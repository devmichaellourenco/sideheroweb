import { describe, expect, it } from 'vitest';
import { Gear } from '../../entities/Gear';
import { Hero } from '../../entities/Hero';
import { Enemy } from '../../entities/Enemy';
import { CombatActionExecutor } from './CombatActionExecutor';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';

describe('CombatActionExecutor', () => {
  const executor = new CombatActionExecutor();

  it('aplica blessing como buff de ataque em todos os aliados', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const enemy = Enemy.forStage(1);

    const result = executor.execute(
      {
        skillId: 'blessing',
        skillName: 'Bênção',
        kind: 'buff_attack',
        targeting: 'all_allies',
        power: 5,
        effectDurationTurns: 3,
        targetHeroIds: ['p1', 'k1'],
      },
      'Elara',
      [priest, knight],
      [enemy],
    );

    expect(result.statusApplications).toHaveLength(2);
    expect(result.statusApplications[0]).toMatchObject({
      kind: 'buff_attack',
      magnitude: 5,
      durationTurns: 3,
    });
    expect(result.event).toContain('Bênção');
  });

  it('emite floating de cura no aliado curado, não no conjurador', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const damagedKnight = Hero.createStarter('k1', 'knight', 'Galneon').takeDamage(50);
    const hpBeforeHeal = damagedKnight.currentHealth;
    const enemy = Enemy.forStage(1);

    const result = executor.execute(
      {
        skillId: 'minor_heal',
        skillName: 'Cura Menor',
        kind: 'heal_ally',
        targeting: 'single_ally',
        power: 20,
        targetHeroId: 'k1',
      },
      'Elara',
      [priest, damagedKnight],
      [enemy],
    );

    expect(result.floatingEvents).toHaveLength(1);
    expect(result.floatingEvents[0]).toMatchObject({
      target: 'hero',
      targetId: 'k1',
      kind: 'heal',
      amount: 20,
    });
    expect(result.heroes.find((hero) => hero.id === 'k1')?.currentHealth).toBe(hpBeforeHeal + 20);
  });

  it('emite floating de cura para cada aliado em cura em área', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara').takeDamage(30);
    const knight = Hero.createStarter('k1', 'knight', 'Galneon').takeDamage(40);
    const enemy = Enemy.forStage(1);

    const result = executor.execute(
      {
        skillId: 'group_heal',
        skillName: 'Cura em Grupo',
        kind: 'heal_ally',
        targeting: 'all_allies',
        power: 15,
        targetHeroIds: ['p1', 'k1'],
      },
      'Elara',
      [priest, knight],
      [enemy],
    );

    expect(result.floatingEvents).toHaveLength(2);
    expect(result.floatingEvents.map((entry) => entry.targetId).sort()).toEqual(['k1', 'p1']);
    expect(result.floatingEvents.every((entry) => entry.kind === 'heal' && entry.target === 'hero')).toBe(
      true,
    );
  });

  it('debuff de defesa aumenta dano recebido pelo herói', () => {
    const enemy = Enemy.forStage(1);
    const statusEffects = CombatStatusEffectTracker.fromMap({}).apply({
      combatantKey: 'hero:k1',
      skillId: 'wraith_curse',
      kind: 'debuff_defense',
      magnitude: 8,
      durationTurns: 2,
    });
    const damageContext = { rng: () => 0.5 };

    const withoutDebuff = executor.execute(
      {
        skillId: 'basic_attack',
        skillName: 'Ataque Básico',
        kind: 'damage',
        damageComponents: [{ element: 'physical', delivery: 'melee', weight: 1 }],
        targeting: 'single_ally',
        power: 20,
        targetHeroId: 'k1',
      },
      'Wraith',
      [Hero.createStarter('k1', 'knight', 'Galneon')],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      damageContext,
    );

    const withDebuff = executor.execute(
      {
        skillId: 'basic_attack',
        skillName: 'Ataque Básico',
        kind: 'damage',
        damageComponents: [{ element: 'physical', delivery: 'melee', weight: 1 }],
        targeting: 'single_ally',
        power: 20,
        targetHeroId: 'k1',
      },
      'Wraith',
      [Hero.createStarter('k1', 'knight', 'Galneon')],
      [enemy],
      statusEffects,
      damageContext,
    );

    const healthWithout = withoutDebuff.heroes[0].currentHealth;
    const healthWith = withDebuff.heroes[0].currentHealth;
    expect(healthWith).toBeLessThan(healthWithout);
  });

  it('resistência de gear reduz dano elemental recebido', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const withResist = knight.equip(
      Gear.create({
        id: 'armor-fire',
        name: 'Armadura Ígnea',
        slot: 'armor',
        rarity: 'epic',
        attackBonus: 0,
        defenseBonus: 4,
        healthBonus: 0,
        fireResistBonus: 50,
      }),
    );
    const enemy = Enemy.forStage(1);
    const damageContext = { rng: () => 0.99 };

    const baseline = executor.execute(
      {
        skillId: 'saci_fire',
        skillName: 'Fogo do Saci',
        kind: 'damage',
        damageComponents: [{ element: 'fire', delivery: 'projectile', weight: 1 }],
        targeting: 'single_ally',
        power: 40,
        targetHeroId: 'k1',
      },
      'Saci',
      [knight],
      [enemy],
      undefined,
      damageContext,
    );

    const mitigated = executor.execute(
      {
        skillId: 'saci_fire',
        skillName: 'Fogo do Saci',
        kind: 'damage',
        damageComponents: [{ element: 'fire', delivery: 'projectile', weight: 1 }],
        targeting: 'single_ally',
        power: 40,
        targetHeroId: 'k1',
      },
      'Saci',
      [withResist],
      [enemy],
      undefined,
      damageContext,
    );

    expect(mitigated.heroes[0].currentHealth).toBeGreaterThan(baseline.heroes[0].currentHealth);
  });

  it('bônus de dano elemental em arma amplifica skill do mesmo elemento', () => {
    const sorcerer = Hero.createStarter('s1', 'sorcerer', 'Nix');
    const withFireWeapon = sorcerer.equip(
      Gear.create({
        id: 'w-fire',
        name: 'Espada Ígnea',
        templateId: 'flame_brand',
        slot: 'weapon',
        rarity: 'rare',
        attackBonus: 8,
        defenseBonus: 0,
        healthBonus: 0,
        fireDamageBonus: 25,
      }),
    );
    const enemy = Enemy.forStage(1);

    const baseline = executor.execute(
      {
        skillId: 'fireball',
        skillName: 'Bola de Fogo',
        kind: 'damage',
        damageComponents: [{ element: 'fire', delivery: 'projectile', weight: 1 }],
        targeting: 'single_enemy',
        power: 30,
        targetEnemyId: enemy.id,
      },
      'Nix',
      [sorcerer],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      { attackerProfile: { attackSpeed: 1, castSpeed: 1, cooldownReduction: 0, critChance: 0, critDamage: 1.4 }, stageLevel: 1 },
    );

    const boosted = executor.execute(
      {
        skillId: 'fireball',
        skillName: 'Bola de Fogo',
        kind: 'damage',
        damageComponents: [{ element: 'fire', delivery: 'projectile', weight: 1 }],
        targeting: 'single_enemy',
        power: 30,
        targetEnemyId: enemy.id,
      },
      'Nix',
      [withFireWeapon],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      {
        attackerProfile: { attackSpeed: 1, castSpeed: 1, cooldownReduction: 0, critChance: 0, critDamage: 1.4 },
        stageLevel: 1,
        attackerElementalBonus: { fire: 25, cold: 0, lightning: 0, air: 0, allElemental: 0 },
      },
    );

    expect(boosted.enemies[0].stats.currentHealth).toBeLessThan(baseline.enemies[0].stats.currentHealth);
  });

  it('esquiva de gear evita dano recebido', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const withDodge = knight.equip(
      Gear.create({
        id: 'armor-dodge',
        name: 'Manto Etéreo',
        slot: 'armor',
        rarity: 'legendary',
        attackBonus: 0,
        defenseBonus: 2,
        healthBonus: 0,
        dodgeChanceBonus: 0.5,
      }),
    );
    const enemy = Enemy.forStage(1);
    const hpBefore = withDodge.currentHealth;

    const result = executor.execute(
      {
        skillId: 'basic_attack',
        skillName: 'Ataque Básico',
        kind: 'damage',
        damageComponents: [{ element: 'physical', delivery: 'melee', weight: 1 }],
        targeting: 'single_ally',
        power: 30,
        targetHeroId: 'k1',
      },
      'Goblin',
      [withDodge],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      { rng: () => 0 },
    );

    expect(result.heroes[0].currentHealth).toBe(hpBefore);
    expect(result.event).toContain('esquivou');
  });

  it('aplica DOT ao acertar com onHitDot', () => {
    const mage = Hero.createStarter('m1', 'sorcerer', 'Aria');
    const enemy = Enemy.forStage(1);

    const result = executor.execute(
      {
        skillId: 'fireball',
        skillName: 'Bola de Fogo',
        kind: 'damage',
        damageComponents: [{ element: 'fire', delivery: 'projectile', weight: 1 }],
        targeting: 'single_enemy',
        power: 20,
        targetEnemyId: enemy.id,
        onHitDot: { element: 'fire', damagePerTurn: 5, durationTurns: 3, applyChance: 1 },
      },
      'Aria',
      [mage],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      { rng: () => 0.99 },
    );

    expect(result.statusApplications).toHaveLength(1);
    expect(result.statusApplications[0]).toMatchObject({
      kind: 'dot',
      magnitude: 5,
      durationTurns: 3,
      dotElement: 'fire',
    });
  });

  it('aplica heal_block ao acertar inimigo com Vorpal Lupnus equipada', () => {
    const sword = Gear.create({
      id: 'vorpal',
      name: 'Vorpal Lupnus',
      templateId: 'sword_vorpal_lupnus',
      slot: 'weapon',
      rarity: 'legendary',
      attackBonus: 30,
      defenseBonus: 0,
      healthBonus: 0,
    });
    const knight = Hero.createStarter('k1', 'knight', 'Galneon').equip(sword);
    const enemy = Enemy.forStage(1);

    const result = executor.execute(
      {
        skillId: 'basic_attack',
        skillName: 'Ataque',
        kind: 'damage',
        targeting: 'single_enemy',
        power: 20,
        targetEnemyId: enemy.id,
      },
      'Galneon',
      [knight],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      {
        attackerProfile: { attackSpeed: 1, castSpeed: 1, cooldownReduction: 0, critChance: 0, critDamage: 1.4 },
        stageLevel: 1,
        attackerEquipment: knight.toProps().equipment,
        rng: () => 0.99,
      },
    );

    expect(result.statusApplications.some((entry) => entry.kind === 'heal_block')).toBe(true);
  });

  it('aplica crítico probabilístico em cura quando roll está dentro da chance', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const damagedKnight = Hero.createStarter('k1', 'knight', 'Galneon').takeDamage(50);
    const enemy = Enemy.forStage(1);
    const context = {
      attackerProfile: {
        attackSpeed: 1,
        castSpeed: 1,
        cooldownReduction: 0,
        critChance: 0.25,
        critDamage: 2,
      },
      stageLevel: 1,
      rng: () => 0.1,
    };

    const result = executor.execute(
      {
        skillId: 'minor_heal',
        skillName: 'Cura Menor',
        kind: 'heal_ally',
        targeting: 'single_ally',
        power: 20,
        targetHeroId: 'k1',
      },
      'Elara',
      [priest, damagedKnight],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      context,
    );

    expect(result.floatingEvents[0]).toMatchObject({
      kind: 'crit-heal',
      amount: 40,
    });
    expect(result.event).toContain('CRÍTICO');
  });

  it('não aplica multiplicador de crítico em cura quando roll falha', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const damagedKnight = Hero.createStarter('k1', 'knight', 'Galneon').takeDamage(50);
    const enemy = Enemy.forStage(1);
    const context = {
      attackerProfile: {
        attackSpeed: 1,
        castSpeed: 1,
        cooldownReduction: 0,
        critChance: 0.25,
        critDamage: 2,
      },
      stageLevel: 1,
      rng: () => 0.9,
    };

    const result = executor.execute(
      {
        skillId: 'minor_heal',
        skillName: 'Cura Menor',
        kind: 'heal_ally',
        targeting: 'single_ally',
        power: 20,
        targetHeroId: 'k1',
      },
      'Elara',
      [priest, damagedKnight],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      context,
    );

    expect(result.floatingEvents[0]).toMatchObject({
      kind: 'heal',
      amount: 20,
    });
  });

  it('aplica crítico probabilístico em buff de ataque', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const enemy = Enemy.forStage(1);
    const context = {
      attackerProfile: {
        attackSpeed: 1,
        castSpeed: 1,
        cooldownReduction: 0,
        critChance: 0.5,
        critDamage: 1.5,
      },
      stageLevel: 1,
      rng: () => 0.2,
    };

    const result = executor.execute(
      {
        skillId: 'blessing',
        skillName: 'Bênção',
        kind: 'buff_attack',
        targeting: 'single_ally',
        power: 10,
        effectDurationTurns: 3,
        targetHeroId: 'k1',
      },
      'Elara',
      [priest, knight],
      [enemy],
      CombatStatusEffectTracker.fromMap({}),
      context,
    );

    expect(result.statusApplications[0]).toMatchObject({ magnitude: 15 });
    expect(result.floatingEvents[0]).toMatchObject({ kind: 'crit-buff', amount: 15 });
    expect(result.event).toContain('CRÍTICO');
  });

  it('bloqueia cura em inimigo com heal_block', () => {
    const enemy = Enemy.forStage(1).takeDamage(20);
    const hpBefore = enemy.stats.currentHealth;
    const statusEffects = CombatStatusEffectTracker.fromMap({}).apply({
      combatantKey: `enemy:${enemy.id}`,
      skillId: 'vorpal_lupnus_heal_block',
      kind: 'heal_block',
      magnitude: 0,
      durationTurns: 999,
    });

    const result = executor.execute(
      {
        skillId: 'regenerate',
        skillName: 'Regenerar',
        kind: 'heal_ally',
        targeting: 'single_enemy',
        power: 15,
        targetEnemyId: enemy.id,
      },
      'Slime',
      [],
      [enemy],
      statusEffects,
    );

    expect(result.enemies[0].stats.currentHealth).toBe(hpBefore);
    expect(result.floatingEvents).toHaveLength(0);
    expect(result.event).toContain('bloqueada');
  });
});
