import { describe, expect, it } from 'vitest';
import { buildPhaseId } from '../../campaign/CampaignIds';
import { PhaseCombatHandlers } from '../../campaign/PhaseCombatHandlers';
import { PhaseRun } from '../../campaign/PhaseRun';
import { EncounterResolver } from '../../campaign/EncounterResolver';
import { CombatState } from '../../entities/CombatState';
import { Enemy } from '../../entities/Enemy';
import { GameState } from '../../entities/GameState';
import { Hero } from '../../entities/Hero';
import { Stats } from '../../value-objects/Stats';
import { ActionTimerService } from './ActionTimerService';
import { CombatTurnPhase } from './CombatTurnPhase';

function stateWithPhase(phaseId: string, heroes: Hero[]): GameState {
  return GameState.restore({
    ...GameState.initial().toProps(),
    heroes,
    campaignProgress: {
      ...GameState.initial().campaignProgress.toProps(),
      selectedPhaseId: phaseId,
    },
    phaseRun: PhaseRun.start(phaseId).toProps(),
    combat: null,
  });
}

function createCombat(
  heroes: Hero[],
  enemies: Enemy[],
  encounterMeta: NonNullable<CombatState['encounterMeta']>,
): CombatState {
  const timers = new ActionTimerService().createInitial(heroes, enemies);

  return CombatState.restore({
    enemies: enemies.map((enemy) => enemy.toProps()),
    actionTimers: timers,
    combatTime: 0,
    skillCooldowns: {},
    statusEffects: {},
    encounterMeta,
  });
}

describe('CombatTurnPhase', () => {
  const phase = new CombatTurnPhase();

  it('inicia fase 1-1 no primeiro tick', () => {
    const sorcerer = Hero.createStarter('s1', 'sorcerer', 'Nix');
    const state = stateWithPhase(buildPhaseId(1, 1), [sorcerer]);

    const result = phase.execute(state);

    expect(result.state.combat?.enemies.length).toBeGreaterThan(0);
    expect(result.state.combat?.encounterMeta?.phaseId).toBe(buildPhaseId(1, 1));
    expect(result.state.phaseRun?.waveIndex).toBe(0);
  });

  it('reinicia fase com cura completa ao perder', () => {
    let knight = Hero.createStarter('k1', 'knight', 'Galneon');
    knight = Hero.restore({ ...knight.toProps(), currentHealth: 1 });

    let state = stateWithPhase(buildPhaseId(1, 1), [knight]);

    for (let tick = 0; tick < 40; tick++) {
      const result = phase.execute(state);
      state = result.state;
      if (result.events.some((event) => event.includes('Reiniciando'))) break;
    }

    expect(state.heroes[0].currentHealth).toBe(state.heroes[0].maxHealth);
    expect(state.phaseRun?.waveIndex).toBe(0);
  });

  it('ignora herói derrotado na timeline e deixa outro combatente agir', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const deadKnight = Hero.restore({ ...knight.toProps(), currentHealth: 0 });
    const enemy = Enemy.restore({
      id: 'e1',
      name: 'Slime',
      enemyType: 'giant_rat',
      stage: 1,
      stats: Stats.fromBase(8, 2, 40),
      goldReward: 5,
      xpReward: 10,
    });

    const combat = createCombat([deadKnight, priest], [enemy], {
      phaseId: buildPhaseId(1, 1),
      waveIndex: 0,
      waveCount: 1,
      isBossWave: true,
    });

    let state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [deadKnight, priest],
      campaignProgress: {
        ...GameState.initial().campaignProgress.toProps(),
        selectedPhaseId: buildPhaseId(1, 1),
      },
      phaseRun: PhaseRun.start(buildPhaseId(1, 1)).toProps(),
      combat,
    });

    const beforeActor = state.combat?.peekNextActor([deadKnight, priest], [enemy]);
    expect(beforeActor?.id).not.toBe('k1');

    const result = phase.execute(state);
    const eventLog = result.events.join(' ');

    expect(eventLog).not.toContain('Galneon');
    expect(result.events.length).toBeGreaterThan(0);
  });

  it('deixa o inimigo agir quando só restam heróis derrotados', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const deadKnight = Hero.restore({ ...knight.toProps(), currentHealth: 0 });
    const enemy = Enemy.restore({
      id: 'e1',
      name: 'Slime',
      enemyType: 'giant_rat',
      stage: 1,
      stats: Stats.fromBase(8, 2, 40),
      goldReward: 5,
      xpReward: 10,
    });

    const combat = createCombat([deadKnight], [enemy], {
      phaseId: buildPhaseId(1, 1),
      waveIndex: 0,
      waveCount: 1,
      isBossWave: true,
    });

    let state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [deadKnight],
      campaignProgress: {
        ...GameState.initial().campaignProgress.toProps(),
        selectedPhaseId: buildPhaseId(1, 1),
      },
      phaseRun: PhaseRun.start(buildPhaseId(1, 1)).toProps(),
      combat,
    });

    const result = phase.execute(state);
    const eventLog = result.events.join(' ');

    expect(eventLog.includes('Slime') || eventLog.includes('Reiniciando')).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
  });

  it('no hub pós-missão, tick não auto-inicia outra fase', () => {
    const phaseHandlers = new PhaseCombatHandlers();
    const resolver = new EncounterResolver();
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId).advanceWave();

    let state = GameState.restore({
      ...GameState.initial().toProps(),
      campaignProgress: {
        ...GameState.initial().campaignProgress.toProps(),
        selectedPhaseId: phaseId,
      },
      phaseRun: phaseRun.toProps(),
      combat: null,
    });

    state = phaseHandlers.startPhaseRun(state, phaseRun).state;

    const boss = resolver.resolve(phaseId, 1);
    expect(boss).not.toBeNull();

    const victory = phaseHandlers.onBossDefeated(
      state,
      boss!.enemies,
      state.heroes,
      boss!.meta,
    );
    state = victory.state;

    expect(state.combatIntermission?.variant).toBe('phase-clear');
    expect(state.phaseRun).toBeNull();

    const resumed = phaseHandlers.resumeIntermission(state);
    state = resumed.state;

    expect(state.loadoutEditOpen).toBe(true);
    expect(state.phaseRun).toBeNull();

    const nextTick = phase.execute(state);

    expect(nextTick.state.phaseRun).toBeNull();
    expect(nextTick.state.combat).toBeNull();
  });

  it('mesmo herói dispara só uma skill por tick mesmo com timer atrasado e 2 skills prontas', () => {
    let sorcerer = Hero.createStarter('s1', 'sorcerer', 'Nix');
    sorcerer = Hero.restore({
      ...sorcerer.toProps(),
      skillRanks: { fireball: 1, arcane_bolt: 1 },
      equippedSkillIds: ['basic_attack', 'fireball', 'arcane_bolt'],
    });

    const enemy = Enemy.restore({
      id: 'e1',
      name: 'Dummy',
      enemyType: 'giant_rat',
      stage: 1,
      stats: Stats.fromBase(1, 0, 500),
      goldReward: 1,
      xpReward: 1,
    });

    const combat = CombatState.restore({
      ...createCombat([sorcerer], [enemy], {
        phaseId: buildPhaseId(1, 1),
        waveIndex: 0,
        waveCount: 1,
        isBossWave: false,
      }).toProps(),
      // Dívida típica após COMBAT_DELTA_SECONDS = 1 com recovery de skill < 1s.
      actionTimers: { 'hero:s1': { remaining: -0.9, total: 1 }, 'enemy:e1': { remaining: 5, total: 5 } },
      skillCooldowns: {},
    });

    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [sorcerer],
      campaignProgress: {
        ...GameState.initial().campaignProgress.toProps(),
        selectedPhaseId: buildPhaseId(1, 1),
      },
      phaseRun: PhaseRun.start(buildPhaseId(1, 1)).toProps(),
      combat,
    });

    const result = phase.execute(state);
    const heroVfx = result.skillVfxEvents.filter((event) => event.attackerId === 's1');
    const heroSkillEvents = result.events.filter((event) => event.includes('Nix'));

    expect(heroVfx).toHaveLength(1);
    expect(heroSkillEvents.length).toBeLessThanOrEqual(1);
    expect(result.state.combat?.actionTimers['hero:s1']?.remaining).toBeGreaterThan(0);
  });
});
