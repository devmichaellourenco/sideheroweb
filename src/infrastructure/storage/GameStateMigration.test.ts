import { describe, expect, it } from 'vitest';
import { buildPhaseId } from '../../domain/campaign/CampaignIds';
import {
  migrateChest,
  migrateCombat,
  migrateEnemy,
  migrateGear,
  migrateHero,
  migrateLegacyChaosGearFields,
  migrateStatusEffects,
} from './GameStateMigration';
import { IGNUS_IX_TEMPLATE_ID } from '../../domain/gear/UniqueGearCatalog';
import { getGearCatalogItem } from '../../domain/gear/GearItemCatalog';
import { DAMAGE_ELEMENTS } from '../../domain/combat/DamageElement';
import { Hero } from '../../domain/entities/Hero';

describe('migrateGear', () => {
  it('reespelha stats atuais do catálogo preservando o id da instância', () => {
    const catalog = getGearCatalogItem('arcanist_staff')!;
    const migrated = migrateGear({
      id: 'inst-arcanist',
      catalogItemId: 'arcanist_staff',
      name: 'Cajado antigo',
      templateId: 'arcanist_staff',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 999,
      defenseBonus: 0,
      healthBonus: 0,
      castSpeedBonus: 0,
      requirements: { minLevel: 1, str: 99 },
    });

    expect(migrated.id).toBe('inst-arcanist');
    expect(migrated.attackBonus).toBe(catalog.attackBonus);
    expect(migrated.castSpeedBonus).toBe(catalog.castSpeedBonus);
    expect(migrated.allElementalDamageBonus).toBe(catalog.allElementalDamageBonus);
    expect(migrated.requirements).toEqual(catalog.requirements);
  });

  it('migra equipamento equipado no herói com stats do catálogo', () => {
    const catalog = getGearCatalogItem('oracle_staff')!;
    const hero = migrateHero({
      id: 'h1',
      name: 'Ora',
      heroClass: 'priest',
      equipment: {
        weapon: {
          id: 'eq-oracle',
          catalogItemId: 'oracle_staff',
          name: 'Oráculo velho',
          templateId: 'oracle_staff',
          slot: 'weapon',
          rarity: 'legendary',
          attackBonus: 1,
          defenseBonus: 0,
          healthBonus: 0,
        },
      },
    });

    const weapon = hero.toProps().equipment?.weapon;
    expect(weapon?.id).toBe('eq-oracle');
    expect(weapon?.cooldownReductionBonus).toBe(catalog.cooldownReductionBonus);
    expect(weapon?.castSpeedBonus).toBe(catalog.castSpeedBonus);
  });

  it('migra chaos_* legado de gear para air_* sem sobrescrever air existente', () => {
    const migrated = migrateGear({
      id: 'legacy-air-gear',
      name: 'Anel legado custom',
      templateId: 'custom_legacy_ring',
      slot: 'accessory',
      rarity: 'common',
      attackBonus: 1,
      defenseBonus: 0,
      healthBonus: 10,
      chaosResistBonus: 12,
      chaosDamageFlat: 4,
      airResistBonus: 7,
    });

    const props = migrated.toProps() as unknown as Record<string, unknown>;
    expect(migrated.airResistBonus).toBe(7);
    expect(migrated.airDamageFlat).toBe(4);
    expect(props.chaosResistBonus).toBeUndefined();
    expect(props.chaosDamageFlat).toBeUndefined();
    expect(Object.keys(props).some((k) => k.toLowerCase().includes('chaos'))).toBe(false);
  });

  it('migra catalogItemId/templateId chaos_mantle e chaos_pendant para air_*', () => {
    const mantle = migrateGear({
      id: 'inst-mantle',
      catalogItemId: 'chaos_mantle',
      name: 'Manto do Caos (rare)',
      templateId: 'chaos_mantle',
      slot: 'armor',
      rarity: 'rare',
      attackBonus: 0,
      defenseBonus: 1,
      healthBonus: 1,
    });
    const pendant = migrateGear({
      id: 'inst-pendant',
      catalogItemId: 'chaos_pendant',
      templateId: 'chaos_pendant',
      name: 'Pingente do Caos (uncommon)',
      slot: 'accessory',
      rarity: 'uncommon',
      attackBonus: 1,
      defenseBonus: 0,
      healthBonus: 1,
    });

    expect(mantle.catalogItemId).toBe('air_mantle');
    expect(mantle.templateId).toBe('air_mantle');
    expect(mantle.airResistBonus).toBe(getGearCatalogItem('air_mantle')!.airResistBonus);
    expect(pendant.catalogItemId).toBe('air_pendant');
    expect(pendant.templateId).toBe('air_pendant');
  });

  it('migrateLegacyChaosGearFields remove chaves chaos* da saída canônica', () => {
    const raw: Record<string, unknown> = {
      chaosResistBonus: 5,
      chaosResistFlat: 1,
      chaosDamageBonus: 3,
      chaosDamageFlat: 2,
      airDamageBonus: 9,
    };
    migrateLegacyChaosGearFields(raw);
    expect(raw.airResistBonus).toBe(5);
    expect(raw.airResistFlat).toBe(1);
    expect(raw.airDamageBonus).toBe(9);
    expect(raw.airDamageFlat).toBe(2);
    expect(raw.chaosResistBonus).toBeUndefined();
    expect(raw.chaosDamageBonus).toBeUndefined();
  });
});

describe('migrateStatusEffects / migrateCombat — chaos legado', () => {
  it('converte statusEffects com dotElement chaos para air', () => {
    const migrated = migrateStatusEffects({
      hero_1: [
        {
          skillId: 'dot_skill',
          kind: 'dot',
          magnitude: 4,
          remainingTurns: 2,
          dotElement: 'chaos',
        },
      ],
    });

    expect(migrated.hero_1[0].dotElement).toBe('air');
  });

  it('aplica migração de DOT legado ao restaurar combate', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Test');
    const combat = migrateCombat(
      {
        enemies: [
          {
            id: 'e1',
            name: 'Goblin',
            enemyType: 'goblin',
            stage: 1,
            role: 'normal',
            stats: { attack: 5, defense: 2, maxHealth: 40, currentHealth: 40 },
            goldReward: 1,
            xpReward: 1,
          },
        ],
        statusEffects: {
          e1: [
            {
              skillId: 'legacy_dot',
              kind: 'dot',
              magnitude: 3,
              remainingTurns: 1,
              dotElement: 'chaos',
            },
          ],
        },
      },
      [hero],
      null,
    );

    expect(combat?.statusEffects.e1[0].dotElement).toBe('air');
  });
});

describe('DamageElement — Ar substitui Caos', () => {
  it('lista canônica inclui air e exclui chaos', () => {
    expect(DAMAGE_ELEMENTS).toContain('air');
    expect(DAMAGE_ELEMENTS).not.toContain('chaos');
  });
});

describe('migrateChest', () => {
  it('restaura o loot garantido de um baú ainda não aberto', () => {
    const chest = migrateChest({
      id: 'boss-chest',
      stageEarned: 50,
      chestType: 'act_boss',
      opened: false,
      loot: null,
      guaranteedLoot: {
        id: 'reserved-ignus',
        name: 'Ignus Ix',
        templateId: IGNUS_IX_TEMPLATE_ID,
        slot: 'accessory',
        rarity: 'legendary',
        attackBonus: 1,
        defenseBonus: 0,
        healthBonus: 0,
      },
    });

    expect(chest.guaranteedLoot?.templateId).toBe(IGNUS_IX_TEMPLATE_ID);
    expect(chest.opened).toBe(false);
  });

  it('migra loot legado chaos_mantle no baú', () => {
    const chest = migrateChest({
      id: 'c1',
      stageEarned: 6,
      chestType: 'monster',
      opened: false,
      loot: {
        id: 'loot-mantle',
        catalogItemId: 'chaos_mantle',
        templateId: 'chaos_mantle',
        name: 'Manto do Caos (rare)',
        slot: 'armor',
        rarity: 'rare',
        attackBonus: 0,
        defenseBonus: 1,
        healthBonus: 1,
      },
      guaranteedLoot: null,
    });

    expect(chest.loot?.catalogItemId).toBe('air_mantle');
    expect(chest.loot?.templateId).toBe('air_mantle');
  });
});

describe('migrateEnemy', () => {
  it('preserva role de boss ao recarregar combate do storage', () => {
    const migrated = migrateEnemy({
      id: 'boss-1',
      name: 'Saci',
      enemyType: 'saci',
      stage: 50,
      role: 'boss',
      stats: {
        attack: 20,
        defense: 8,
        maxHealth: 1,
        currentHealth: 1,
      },
      goldReward: 100,
      xpReward: 50,
    });

    expect(migrated?.role).toBe('boss');
    expect(migrated?.enemyType).toBe('saci');
  });
});

describe('migrateHero — progressão', () => {
  it('renomeia Ragnar legado para Torius', () => {
    const hero = migrateHero({
      id: 'hero-berserker',
      name: 'Ragnar',
      heroClass: 'berserker',
    });

    expect(hero.name).toBe('Torius');
  });

  it('funde unspentAscensionPoints antigos em unspentImprovementPoints', () => {
    const hero = migrateHero({
      id: 'h1',
      name: 'Galneon',
      heroClass: 'knight',
      unspentImprovementPoints: 3,
      unspentAscensionPoints: 2,
      ascensionId: 'knight_military_guerreiro',
    });

    expect(hero.toProps().unspentImprovementPoints).toBe(5);
    expect(hero.toProps().unspentAscensionPoints).toBe(0);
    expect(hero.toProps().ascensionId).toBe('knight_military_guerreiro');
  });

  it('remove skills só-passivas e devolve pontos ao pool de aprimoramento', () => {
    const hero = migrateHero({
      id: 'h1',
      name: 'Galneon',
      heroClass: 'knight',
      unspentImprovementPoints: 1,
      skillRanks: { basic_attack: 1, thrust: 1, evasion: 2, iron_skin: 1 },
      equippedSkillIds: ['basic_attack', 'evasion', 'thrust'],
    });

    const props = hero.toProps();
    expect(props.skillRanks.evasion).toBeUndefined();
    expect(props.skillRanks.iron_skin).toBeUndefined();
    expect(props.skillRanks.thrust).toBe(1);
    expect(props.equippedSkillIds).toEqual(['basic_attack', 'thrust']);
    expect(props.unspentImprovementPoints).toBe(4);
  });

  it('migra gear chaos_* equipado no herói', () => {
    const hero = migrateHero({
      id: 'h1',
      name: 'Nix',
      heroClass: 'sorcerer',
      equipment: {
        armor: {
          id: 'eq-mantle',
          catalogItemId: 'chaos_mantle',
          templateId: 'chaos_mantle',
          name: 'Manto do Caos (rare)',
          slot: 'armor',
          rarity: 'rare',
          attackBonus: 0,
          defenseBonus: 1,
          healthBonus: 1,
        },
      },
    });

    const armor = hero.toProps().equipment?.armor;
    expect(armor?.catalogItemId).toBe('air_mantle');
    expect(armor?.templateId).toBe('air_mantle');
  });
});

describe('PhaseCombatHandlers — lendários de marco', () => {
  it('concede Ignus Ix ao concluir fase 1-50', async () => {
    const { PhaseCombatHandlers } = await import('../../domain/campaign/PhaseCombatHandlers');
    const { EncounterResolver } = await import('../../domain/campaign/EncounterResolver');
    const { GameState } = await import('../../domain/entities/GameState');
    const { PhaseRun } = await import('../../domain/campaign/PhaseRun');

    const handlers = new PhaseCombatHandlers();
    const resolver = new EncounterResolver();
    const phaseId = buildPhaseId(1, 50);
    const phaseRun = PhaseRun.start(phaseId);
    let state = GameState.initial()
      .withCampaignProgress(GameState.initial().campaignProgress.withSelectedPhase(phaseId))
      .withPhaseRun(phaseRun);
    state = handlers.startPhaseRun(state, phaseRun).state;

    const bossWave = resolver.resolve(phaseId, 3);
    const victory = handlers.onBossDefeated(state, bossWave!.enemies, state.heroes, bossWave!.meta);

    expect(victory.state.inventory.some((gear) => gear.templateId === IGNUS_IX_TEMPLATE_ID)).toBe(
      false,
    );
    expect(
      victory.state.chests.some(
        (chest) => chest.guaranteedLoot?.templateId === IGNUS_IX_TEMPLATE_ID,
      ),
    ).toBe(true);
  });
});
