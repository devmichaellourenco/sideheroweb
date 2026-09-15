import { describe, expect, it } from 'vitest';
import { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { Gear } from '../entities/Gear';
import { getEnemyTierCombatBaseline } from '../enemies/EnemyProgressionCatalog';
import { getClassCombatBaseline } from './ClassCombatBaselines';
import { getHeroCombatIdentity } from './HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../enemies/EnemyCombatIdentityCatalog';
import { resolveAttributeAttackSpeed } from './CombatSpeedScaling';
import {
  applyCooldownReduction,
  CombatProfileProvider,
  resolveCastSpeed,
  resolveCooldownReduction,
} from './CombatProfileProvider';

describe('CombatProfileProvider', () => {
  const profiles = new CombatProfileProvider();

  it('separa redução de recarga da velocidade de conjuração', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Mira').equip(
      Gear.create({
        id: 'ring-cdr',
        name: 'Anel Rápido',
        templateId: 'copper_ring',
        slot: 'accessory',
        rarity: 'rare',
        attackBonus: 0,
        defenseBonus: 0,
        healthBonus: 0,
        cooldownReductionBonus: 20,
      }),
    );

    const profile = profiles.forHero(hero);
    expect(profile.castSpeed).toBe(1);
    expect(profile.cooldownReduction).toBeCloseTo(0.2);
  });

  it('cast speed acelera recovery sem alterar redução de recarga', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Mira').equip(
      Gear.create({
        id: 'cast-ring',
        name: 'Anel Ágil',
        templateId: 'copper_ring',
        slot: 'accessory',
        rarity: 'rare',
        attackBonus: 0,
        defenseBonus: 0,
        healthBonus: 0,
        castSpeedBonus: 0.12,
      }),
    );

    const profile = profiles.forHero(hero);
    expect(profile.castSpeed).toBeCloseTo(1.12);
    expect(profile.cooldownReduction).toBe(0);
  });

  it('cajado do catálogo contribui cast speed no perfil de combate', async () => {
    const { createGearFromCatalogItem } = await import('../gear/GearItemCatalog');
    const { Experience } = await import('../value-objects/Experience');
    const staff = createGearFromCatalogItem('arcanist_staff', 'staff-test');
    const base = Hero.createStarter('h1', 'sorcerer', 'Mira');
    const hero = Hero.restore({
      ...base.toProps(),
      experience: Experience.restore(0, 100, 8),
      equipment: { weapon: staff },
    });
    const profile = profiles.forHero(hero);

    expect(staff.castSpeedBonus).toBe(0.09);
    expect(profile.castSpeed).toBeCloseTo(1.09);
  });

  it('aplica redução de recarga como percentual do tempo base', () => {
    expect(applyCooldownReduction(10, resolveCooldownReduction(30))).toBe(7);
    expect(applyCooldownReduction(10, resolveCooldownReduction(0))).toBe(10);
  });

  it('teto e piso de CDR vêm da skill, sem constante global', () => {
    const skill = { maxCooldownReduction: 0.45, minCooldownReduction: -0.25 };
    expect(applyCooldownReduction(10, 0.9, skill)).toBeCloseTo(5.5);
    expect(applyCooldownReduction(10, -0.5, skill)).toBeCloseTo(12.5);
  });

  it('limita penalidade de velocidade de ataque negativa', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Tank').equip(
      Gear.create({
        id: 'heavy-axe',
        name: 'Machado Pesado',
        templateId: 'pixel_axe',
        slot: 'weapon',
        rarity: 'rare',
        attackBonus: 12,
        defenseBonus: 0,
        healthBonus: 0,
        attackSpeedBonus: -0.8,
      }),
    );

    const profile = profiles.forHero(hero);
    expect(profile.attackSpeed).toBeGreaterThanOrEqual(0.175);
  });

  it('herói inicial ataca mais devagar que o baseline de classe', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const baseline = profiles.forHero(hero);
    const classBaselineAspd = getClassCombatBaseline(hero.heroClass).attackSpeed;
    const factor = getHeroCombatIdentity(hero.heroClass).attackSpeedFactor;

    expect(baseline.attackSpeed).toBeLessThan(classBaselineAspd);
    expect(baseline.attackSpeed).toBeCloseTo(
      resolveAttributeAttackSpeed(classBaselineAspd, hero.totalAttributes, true, factor),
      2,
    );
  });

  it('aumenta ASPD com pontos em DEX', () => {
    const starter = profiles.forHero(Hero.createStarter('h1', 'knight', 'A'));
    const invested = profiles.forHero(
      Hero.restore({
        ...Hero.createStarter('h2', 'knight', 'B').toProps(),
        allocatedAttributes: { str: 0, dex: 15, int: 0 },
      }),
    );

    expect(invested.attackSpeed).toBeGreaterThan(starter.attackSpeed);
  });

  it('inimigo ASPD = baseline do tier + attrs (sem escala por stage)', () => {
    const goblin = Enemy.forStage(1);
    const profile = profiles.forEnemy(goblin);
    const tierBaseline = getEnemyTierCombatBaseline(goblin.enemyType).attackSpeed;
    const expected = Math.max(
      0.175,
      resolveAttributeAttackSpeed(
        tierBaseline,
        goblin.totalAttributes,
        goblin.physicalMeleeAspd,
        getEnemyCombatIdentity(goblin.enemyType).attackSpeedFactor,
      ),
    );

    expect(profile.attackSpeed).toBeCloseTo(expected, 4);
    expect(profile.attackSpeed).toBeLessThan(tierBaseline);
  });

  it('inimigo acelera com level (mais attrs)', () => {
    const early = profiles.forEnemy(Enemy.forStage(3));
    const late = profiles.forEnemy(Enemy.forStage(40));

    expect(late.attackSpeed).toBeGreaterThan(early.attackSpeed);
  });

  it('resolveCastSpeed respeita piso mínimo', () => {
    expect(resolveCastSpeed(1, -2)).toBe(0.175);
  });
});
