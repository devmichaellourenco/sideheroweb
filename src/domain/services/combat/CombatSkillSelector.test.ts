import { describe, expect, it } from 'vitest';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { Stats } from '../../value-objects/Stats';
import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { SkillPowerCalculator } from '../../progression/combat/SkillPowerCalculator';
import { listEnemyCombatSkillsByType } from '../../progression/combat/EnemyCombatSkillCatalog';
import { SkillCooldownTracker } from './SkillCooldownTracker';
import { CombatSkillSelector } from './CombatSkillSelector';
import { SkillTargetResolver } from './SkillTargetResolver';

describe('CombatSkillSelector', () => {
  const selector = new CombatSkillSelector(
    undefined,
    new SkillTargetResolver(() => 0),
  );
  const power = new SkillPowerCalculator();
  const enemies = [Enemy.forStage(1)];
  const emptyCooldowns = SkillCooldownTracker.fromMap({});

  it('usa ataque básico equipado quando nenhuma outra skill está pronta', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Lyra');
    const selected = selector.selectHeroAction(hero, [hero], enemies, emptyCooldowns);

    expect(hero.toProps().equippedSkillIds).toContain('basic_attack');
    expect(selected?.skillId).toBe('basic_attack');
    expect(selected?.action.targeting).toBe('single_enemy');
    expect(selected?.action.power).toBe(
      Math.max(
        1,
        Math.floor(hero.attack * getHeroCombatIdentity(hero.heroClass).basicAttackDamageRatio),
      ),
    );
  });

  it('prioriza cura quando aliado está ferido e skill está pronta', () => {
    let priest = Hero.createStarter('p1', 'priest', 'Elara');
    priest = Hero.restore({
      ...priest.toProps(),
      skillRanks: { minor_heal: 1 },
      equippedSkillIds: ['basic_attack', 'minor_heal'],
    });

    let knight = Hero.createStarter('k1', 'knight', 'Galneon');
    knight = Hero.restore({
      ...knight.toProps(),
      currentHealth: 10,
    });

    const selected = selector.selectHeroAction(priest, [priest, knight], enemies, emptyCooldowns);

    expect(selected?.skillId).toBe('minor_heal');
    expect(selected?.action.targetHeroId).toBe('k1');
  });

  it('fireball respeita cooldown inicial e prioridade quando pronta', () => {
    let sorcerer = Hero.createStarter('s1', 'sorcerer', 'Lyra');
    sorcerer = Hero.restore({
      ...sorcerer.toProps(),
      skillRanks: { fireball: 1, arcane_bolt: 1 },
      equippedSkillIds: ['basic_attack', 'fireball', 'arcane_bolt'],
    });

    const charging = SkillCooldownTracker.fromMap({
      'hero:s1': { fireball: 2 },
    });
    const chargingPick = selector.selectHeroAction(sorcerer, [sorcerer], enemies, charging);
    expect(chargingPick?.skillId).toBe('arcane_bolt');

    const ready = SkillCooldownTracker.fromMap({});
    const readyPick = selector.selectHeroAction(sorcerer, [sorcerer], enemies, ready);
    expect(readyPick?.skillId).toBe('fireball');
  });

  it('inquisitor_judgment mira no inimigo com mais vida', () => {
    let priest = Hero.createStarter('p1', 'priest', 'Elara');
    priest = Hero.restore({
      ...priest.toProps(),
      skillRanks: { inquisitor_judgment: 1 },
      equippedSkillIds: ['basic_attack', 'inquisitor_judgment'],
    });

    const weak = Enemy.restore({
      ...Enemy.forStage(1).toProps(),
      id: 'weak-enemy',
      stats: Stats.create({
        attack: 10,
        defense: 4,
        maxHealth: 60,
        currentHealth: 15,
      }),
    });
    const tough = Enemy.restore({
      ...Enemy.forStage(2).toProps(),
      id: 'tough-enemy',
    });

    const heroSelected = selector.selectHeroAction(
      priest,
      [priest],
      [weak, tough],
      emptyCooldowns,
    );

    expect(heroSelected?.skillId).toBe('inquisitor_judgment');
    expect(heroSelected?.action.targetEnemyId).toBe('tough-enemy');
  });

  it('goblin prioriza Facada com poder acima do ataque básico (BAL-013)', () => {
    const goblin = Enemy.restore({
      ...Enemy.forStage(2).toProps(),
      id: 'goblin-1',
      enemyType: 'goblin_raider',
      name: 'Goblin Lv.2',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const stab = listEnemyCombatSkillsByType('goblin_raider').find((s) => s.skillId === 'goblin_stab')!;

    const selected = selector.selectEnemyAction(goblin, [hero], [goblin], emptyCooldowns);

    expect(selected?.skillId).toBe('goblin_stab');
    expect(selected?.action.skillName).toBe('Facada');
    expect(selected?.action.power).toBe(power.calculateForEnemy(stab, goblin));
    expect(selected?.action.targetHeroId).toBe('h1');
  });

  it('slime usa Ácido quando pronto em vez do ataque básico', () => {
    const slime = Enemy.restore({
      ...Enemy.forStage(3).toProps(),
      id: 'slime-1',
      enemyType: 'giant_rat',
      name: 'Rato Gigante Lv.3',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');

    const selected = selector.selectEnemyAction(slime, [hero], [slime], emptyCooldowns);

    expect(selected?.skillId).toBe('wild_bite');
  });

  it('orc prioriza Pancada com poder acima do ataque básico (BAL-013)', () => {
    const orc = Enemy.restore({
      ...Enemy.forStage(4).toProps(),
      id: 'orc-1',
      enemyType: 'orc_warrior',
      name: 'Orc Lv.4',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const smash = listEnemyCombatSkillsByType('orc_warrior').find((s) => s.skillId === 'orc_smash')!;

    const selected = selector.selectEnemyAction(orc, [hero], [orc], emptyCooldowns);

    expect(selected?.skillId).toBe('orc_smash');
    expect(selected?.action.skillName).toBe('Pancada');
    expect(selected?.action.power).toBe(power.calculateForEnemy(smash, orc));
  });

  it('wraith prioriza Drenar Vida (BAL-013)', () => {
    const wraith = Enemy.restore({
      ...Enemy.forStage(6).toProps(),
      id: 'wraith-1',
      enemyType: 'skeleton_warrior',
      name: 'Wraith Lv.6',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const drain = listEnemyCombatSkillsByType('skeleton_warrior').find(
      (s) => s.skillId === 'wraith_drain',
    )!;

    const selected = selector.selectEnemyAction(wraith, [hero], [wraith], emptyCooldowns);

    expect(selected?.skillId).toBe('wraith_drain');
    expect(selected?.action.skillName).toBe('Drenar Vida');
    expect(selected?.action.power).toBe(power.calculateForEnemy(drain, wraith));
  });

  it('dragão prioriza Baforada em área quando fora de cooldown inicial', () => {
    const dragon = Enemy.restore({
      ...Enemy.forStage(5).toProps(),
      id: 'dragon-1',
      enemyType: 'young_green_dragon',
      name: 'Dragon Lv.5',
    });
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const ready = SkillCooldownTracker.fromMap({});
    const charging = SkillCooldownTracker.fromMap({
      'enemy:dragon-1': { dragon_breath: 2 },
    });
    const breath = listEnemyCombatSkillsByType('young_green_dragon').find(
      (s) => s.skillId === 'dragon_breath',
    )!;

    const readyPick = selector.selectEnemyAction(dragon, [hero], [dragon], ready);
    expect(readyPick?.skillId).toBe('dragon_breath');
    expect(readyPick?.action.skillName).toBe('Baforada');
    expect(readyPick?.action.targeting).toBe('all_allies');
    expect(readyPick?.action.power).toBe(power.calculateForEnemy(breath, dragon));

    const chargingPick = selector.selectEnemyAction(dragon, [hero], [dragon], charging);
    expect(chargingPick?.skillId).toBe('dragon_bite');
    expect(chargingPick?.action.skillName).toBe('Mordida');
  });

  it('sacerdotisa prioriza Bênção em party saudável acima de dano', () => {
    let priest = Hero.createStarter('p1', 'priest', 'Elara');
    priest = Hero.restore({
      ...priest.toProps(),
      skillRanks: { blessing: 1 },
      equippedSkillIds: ['basic_attack', 'blessing'],
    });

    const goblin = Enemy.restore({
      ...Enemy.forStage(2).toProps(),
      enemyType: 'goblin_raider',
    });

    const selected = selector.selectHeroAction(priest, [priest], [goblin], emptyCooldowns);

    expect(selected?.skillId).toBe('blessing');
    expect(selected?.action.kind).toBe('buff_attack');
    expect(selected?.action.targeting).toBe('all_allies');
    expect(selected?.action.effectDurationTurns).toBe(3);
  });
});
