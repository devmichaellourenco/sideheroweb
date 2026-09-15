import { describe, expect, it } from 'vitest';
import { resolvePhase } from './CampaignCatalog';
import { buildPhaseId } from './CampaignIds';
import { PhaseCombatHandlers } from './PhaseCombatHandlers';
import { PhaseRun } from './PhaseRun';
import { EncounterResolver } from './EncounterResolver';
import { GameState } from '../entities/GameState';
import { Hero } from '../entities/Hero';
import { HeroUnlockService } from '../party/HeroUnlockService';
import { mainMissionId, normalMissionId } from './missions/MissionId';

describe('PhaseCombatHandlers', () => {
  const handlers = new PhaseCombatHandlers();
  const resolver = new EncounterResolver();

  it('reinicia fase do início ao retomar pausa manual', () => {
    const phaseId = buildPhaseId(1, 1);
    const phaseRun = PhaseRun.start(phaseId).advanceWave();
    let state = GameState.initial().withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const restarted = handlers.restartPhaseFromPause(state, phaseRun);

    expect(restarted.state.phaseRun?.waveIndex).toBe(0);
    expect(restarted.state.combat).not.toBeNull();
    expect(restarted.events.some((event) => event.includes('reiniciada'))).toBe(true);
  });

  it('avança para wave 2 após limpar lixo', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    const wave1 = resolver.resolve(phaseId, 0);
    expect(wave1).not.toBeNull();

    let state = GameState.initial().withPhaseRun(phaseRun).withCombat(null);

    const started = handlers.startPhaseRun(state, phaseRun);
    state = started.state;

    const defeated = wave1!.enemies;
    const cleared = handlers.onWaveCleared(
      state,
      defeated,
      state.heroes,
      wave1!.meta,
      phaseRun,
    );

    expect(cleared.state.phaseRun?.waveIndex).toBe(1);
    expect(cleared.state.combatIntermission?.variant).toBe('boss-approach');
    expect(cleared.state.combat).not.toBeNull();
    expect(cleared.state.combat?.livingEnemies().length).toBe(0);

    const resumed = handlers.resumeIntermission(cleared.state);
    expect(resumed.state.combat?.encounterMeta?.isBossWave).toBe(true);
    expect(resumed.state.combatIntermission).toBeNull();
    expect(cleared.events.some((event) => event.includes('Wave limpa'))).toBe(true);
  });

  it('restaura vida da party ao derrotar boss e retorna ao fluxo de acampamento', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial()
      .withCampaignProgress(GameState.initial().campaignProgress.withSelectedPhase(phaseId))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    state = state.withHeroes(
      state.heroes.map((hero, index) =>
        Hero.restore({ ...hero.toProps(), currentHealth: index === 0 ? 1 : hero.maxHealth }),
      ),
    );

    const boss = resolver.resolve(phaseId, 1);
    expect(boss).not.toBeNull();

    const victory = handlers.onBossDefeated(state, boss!.enemies, state.heroes, boss!.meta);

    expect(victory.state.heroes.every((hero) => hero.currentHealth === hero.maxHealth)).toBe(true);
    expect(victory.state.battleLog.some((entry) => entry.message.includes('Party recuperada'))).toBe(
      true,
    );
    expect(victory.state.combatIntermission?.variant).toBe('phase-clear');
    expect(victory.state.combatIntermission?.nextPhaseId).toBeNull();
  });

  it('não auto-avança fase linear ao derrotar boss — marca cleared e prepara camp', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial()
      .withCampaignProgress(GameState.initial().campaignProgress.withSelectedPhase(phaseId))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const boss = resolver.resolve(phaseId, 1);
    expect(boss).not.toBeNull();

    const victory = handlers.onBossDefeated(state, boss!.enemies, state.heroes, boss!.meta);

    expect(victory.state.campaignProgress.isCleared(phaseId)).toBe(true);
    expect(victory.state.campaignProgress.isUnlocked(buildPhaseId(1, 3))).toBe(false);
    expect(victory.state.phaseRun).toBeNull();
    expect(victory.state.combat).toBeNull();
    expect(victory.state.campaignProgress.missionProgress.normalOfferFor('stendra')).not.toContain(
      normalMissionId(phaseId),
    );

    const camp = handlers.resumeIntermission(victory.state);
    expect(camp.state.loadoutEditOpen).toBe(true);
    expect(camp.state.phaseRun).toBeNull();
    expect(camp.state.phaseRestartOnResume).toBe(false);
  });

  it('marca temporada concluída ao derrotar boss final do jogo base e vai ao camp', () => {
    const phaseId = '4-50';
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial()
      .withCampaignProgress(GameState.initial().campaignProgress.withSelectedPhase(phaseId))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const finale = resolvePhase(phaseId)!;
    const resolved = resolver.resolve(phaseId, finale.waves.length - 1);
    expect(resolved).not.toBeNull();

    const victory = handlers.onBossDefeated(
      state,
      resolved!.enemies,
      state.heroes,
      resolved!.meta,
    );

    expect(victory.state.campaignProgress.seasonCompleted).toBe(true);
    expect(victory.events.some((event) => event.includes('Jornada concluída'))).toBe(true);
    expect(victory.state.campaignProgress.missionProgress.isMainCompleted(mainMissionId('4-50'))).toBe(
      true,
    );

    const camp = handlers.resumeIntermission(victory.state);

    expect(camp.state.loadoutEditOpen).toBe(true);
    expect(camp.state.phaseRestartOnResume).toBe(false);
    expect(camp.state.combat).toBeNull();
    expect(camp.state.phaseRun).toBeNull();
  });

  it('envia para acampamento após marco X-50 sem auto-start da próxima região', () => {
    const phaseId = buildPhaseId(1, 50);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial()
      .withCampaignProgress(GameState.initial().campaignProgress.withSelectedPhase(phaseId))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const finale = resolvePhase(phaseId)!;
    const resolved = resolver.resolve(phaseId, finale.waves.length - 1);
    expect(resolved).not.toBeNull();

    const victory = handlers.onBossDefeated(
      state,
      resolved!.enemies,
      state.heroes,
      resolved!.meta,
    );

    expect(victory.state.campaignProgress.missionProgress.isMainCompleted(mainMissionId('1-50'))).toBe(
      true,
    );
    expect(victory.state.combatIntermission?.nextPhaseId).toBeNull();

    const camp = handlers.resumeIntermission(victory.state);

    expect(camp.state.loadoutEditOpen).toBe(true);
    expect(camp.state.phaseRestartOnResume).toBe(false);
    expect(camp.state.combat).toBeNull();
    expect(camp.state.phaseRun).toBeNull();
  });

  it('wipe retorna ao acampamento com cura completa (sem fase anterior)', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial().withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const woundedHero = state.heroes[0];
    state = state.withHeroes([Hero.restore({ ...woundedHero.toProps(), currentHealth: 1 })]);

    const wiped = handlers.onPhaseWipe(state, phaseRun);

    expect(wiped.state.phaseRun).toBeNull();
    expect(wiped.state.heroes[0].currentHealth).toBe(wiped.state.heroes[0].maxHealth);
    expect(wiped.state.combatIntermission?.variant).toBe('defeat');
    expect(wiped.state.combat).toBeNull();

    const resumed = handlers.resumeIntermission(wiped.state);
    expect(resumed.state.loadoutEditOpen).toBe(true);
    expect(resumed.state.combat).toBeNull();
    expect(resumed.state.phaseRun).toBeNull();
    expect(wiped.events.some((event) => event.includes('acampamento'))).toBe(true);
  });

  it('wipe em 1-1 também volta ao acampamento', () => {
    const phaseId = buildPhaseId(1, 1);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial().withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const wiped = handlers.onPhaseWipe(state, phaseRun);

    expect(wiped.state.phaseRun).toBeNull();
    expect(wiped.state.combatIntermission?.variant).toBe('defeat');
  });

  it('não concede ouro em lote ao limpar wave (recompensa é por kill)', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    const wave1 = resolver.resolve(phaseId, 0);
    expect(wave1).not.toBeNull();

    let state = GameState.initial()
      .withGold(GameState.initial().gold.add(500))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const replayWave = handlers.onWaveCleared(
      state,
      wave1!.enemies,
      state.heroes,
      wave1!.meta,
      phaseRun,
    );

    expect(replayWave.state.gold.value()).toBe(500);
    expect(replayWave.state.chests).toHaveLength(0);
  });

  it('concede XP do orçamento da fase ao derrotar o boss', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    const boss = resolver.resolve(phaseId, 1);
    expect(boss).not.toBeNull();

    let state = GameState.initial()
      .withGold(GameState.initial().gold.add(1000))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;
    const xpBefore = state.activeHeroes()[0].toProps().experience.current;

    const victory = handlers.onBossDefeated(state, boss!.enemies, state.activeHeroes(), boss!.meta);

    expect(victory.state.gold.value()).toBe(1000);
    expect(victory.state.activeHeroes()[0].toProps().experience.current).toBeGreaterThan(xpBefore);
  });

  it('não concede baú extra ao repetir boss de fase já cleared', () => {
    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    const boss = resolver.resolve(phaseId, 1);
    expect(boss).not.toBeNull();

    const clearedProgress = GameState.initial()
      .campaignProgress.markCleared(phaseId, [buildPhaseId(1, 3)], 2)
      .withSelectedPhase(buildPhaseId(1, 5));

    let state = GameState.initial()
      .withGold(GameState.initial().gold.add(1000))
      .withCampaignProgress(clearedProgress)
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const victory = handlers.onBossDefeated(state, boss!.enemies, state.activeHeroes(), boss!.meta);

    expect(victory.state.gold.value()).toBe(1000);
    expect(victory.state.chests).toHaveLength(0);
  });

  it('recupera vida da party ao derrotar boss', () => {
    let state = GameState.initial().withActivePartyIds(['hero-1', 'hero-2']);
    state = HeroUnlockService.applyUnlock(state, 'berserker');

    const phaseId = buildPhaseId(1, 2);
    const phaseRun = PhaseRun.start(phaseId);
    state = state
      .withCampaignProgress(GameState.initial().campaignProgress.withSelectedPhase(phaseId))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const boss = resolver.resolve(phaseId, 1);
    expect(boss).not.toBeNull();

    const victory = handlers.onBossDefeated(state, boss!.enemies, state.activeHeroes(), boss!.meta);

    const benchHero = victory.state.roster.find((hero) => hero.id === 'hero-berserker');
    const activeHero = victory.state.roster.find((hero) => hero.id === 'hero-1');
    expect(benchHero).toBeDefined();
    expect(activeHero).toBeDefined();
    expect(benchHero!.toProps().experience.current).toBe(0);
    expect(activeHero!.toProps().experience.current).toBe(0);
  });
});
