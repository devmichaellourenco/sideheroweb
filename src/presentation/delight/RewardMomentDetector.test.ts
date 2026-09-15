import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { RewardMomentDetector } from './RewardMomentDetector';

function baseState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    heroes: [
      {
        id: 'hero-1',
        name: 'Galneon',
        heroClass: 'knight',
        emoji: '⚔️',
        level: 5,
        experience: 0,
        experienceToNextLevel: 100,
        attack: 10,
        defense: 5,
        attackSpeed: 1,
        castSpeed: 1,
        critChance: 0,
        critDamage: 1.5,
        health: 100,
        maxHealth: 100,
        baseAttributes: { str: 1, dex: 1, int: 1 },
        allocatedAttributes: { str: 0, dex: 0, int: 0 },
        totalAttributes: { str: 1, dex: 1, int: 1 },
        unspentImprovementPoints: 0,
        unspentAscensionPoints: 0,
        skillRanks: {},
        equippedSkillIds: [],
        activeSkills: [],
        maxActiveSkills: 1,
        unlockedActiveSkillSlots: 1,
        ascensionId: null,
        hasUnspentPoints: false,
        equipment: {},
        combatIntent: null,
        combatSkills: [],
        combatSkillCooldowns: [],
        statusEffects: [],
        combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
      },
    ],
    enemies: [],
    stage: 1,
    difficultyTier: 1,
    gold: 100,
    chests: [],
    inventory: [],
    stash: [],
    storageCapacity: {
      inventoryLimit: 30,
      inventoryUsed: 0,
      stashLimit: 0,
      stashUsed: 0,
      stashUnlocked: false,
    },
    battleLog: [],
    totalBattlesWon: 0,
    pendingChestCount: 0,
    upgradeLevels: {},
    shopRefreshUses: 0,
    shopRefreshLimit: 0,
    purchasableUpgradeCount: 0,
    featureFlags: {
      autoBattle: true,
      autoBattleMaxSpeed: 1,
      autoOpenChests: false,
      openAllChests: false,
      autoOpenAllChests: false,
      optimizeLoadout: false,
      optimizeInLootBatch: false,
      autoEquipLoot: false,
      autoEquipSilent: false,
      logFilter: false,
      battleStats: false,
      shopRefresh: false,
      backgroundTick: false,
      backgroundTickMultiplier: 1,
      itemStash: false,
      stashCapacity: 0,
      inventoryCapacity: 30,
      divineForge: false,
      improvementReset: 0,
    },
    chestProgress: { current: 0, target: 5, ratio: 0 },
    gearUpgradeHints: [],
    campaignProgress: {
      selectedPhaseId: '1-1',
      unlockedPhaseIds: ['1-1'],
      clearedPhaseIds: [],
      highestTierReached: 1,
      seasonCompleted: false,
    },
    seasonCompleted: false,
    canEditParty: true,
    phaseRun: null,
    combatIntermission: null,
    activeTurn: null,
    ...overrides,
  } as GameStateDto;
}

describe('RewardMomentDetector', () => {
  const detector = new RewardMomentDetector();

  it('detecta baú disponível como celebração', () => {
    const previous = baseState({ pendingChestCount: 0, chests: [] });
    const next = baseState({
      pendingChestCount: 1,
      chests: [
        {
          id: 'chest-1',
          stageEarned: 1,
          chestType: 'battle',
          chestLabel: 'Baú de Batalha',
          opened: false,
        },
      ],
    });

    const moments = detector.detect(previous, next);
    expect(moments.some((moment) => moment.kind === 'chest_available')).toBe(true);
  });

  it('agrupa múltiplos level-ups em um card', () => {
    const previous = baseState({
      heroes: [
        {
          ...baseState().heroes[0],
          id: 'hero-1',
          name: 'Galneon',
          level: 4,
        },
        {
          ...baseState().heroes[0],
          id: 'hero-2',
          name: 'Nix',
          emoji: '🔮',
          level: 3,
        },
      ],
    });
    const next = baseState({
      heroes: [
        { ...previous.heroes[0], level: 5 },
        { ...previous.heroes[1], level: 4 },
      ],
    });

    const moments = detector.detect(previous, next);
    const levelMoments = moments.filter((moment) => moment.kind === 'level_up');
    expect(levelMoments).toHaveLength(1);
    expect(levelMoments[0].title).toContain('2 heróis');
    expect(levelMoments[0].heroEmoji).toBeUndefined();
    expect(levelMoments[0].heroPortrait).toEqual({
      id: 'hero-1',
      heroClass: 'knight',
      name: 'Galneon',
      ascensionId: null,
    });
    expect(levelMoments[0].heroPortraits).toHaveLength(2);
    expect(levelMoments[0].detailLines).toEqual([
      'Galneon → Lv.5',
      'Nix → Lv.4',
    ]);
  });

  it('usa portrait do herói em level-up único', () => {
    const previous = baseState({
      heroes: [{ ...baseState().heroes[0], level: 4 }],
    });
    const next = baseState({
      heroes: [{ ...previous.heroes[0], level: 5 }],
    });

    const moments = detector.detect(previous, next);
    const levelMoment = moments.find((moment) => moment.kind === 'level_up');
    expect(levelMoment?.title).toBe('Lv.5');
    expect(levelMoment?.heroEmoji).toBeUndefined();
    expect(levelMoment?.heroPortrait).toEqual({
      id: 'hero-1',
      heroClass: 'knight',
      name: 'Galneon',
      ascensionId: null,
    });
    expect(levelMoment?.heroPortraits).toBeUndefined();
  });

  // OFFLINE PROGRESS DESATIVADO (2026-07)
  it('relatório idle desativado (sem progresso offline)', () => {
    const moment = detector.buildIdleReport(
      {
        at: Date.now() - 60_000,
        stage: 1,
        gold: 100,
        pendingChestCount: 0,
        heroLevels: { 'hero-1': 4 },
      },
      baseState({
        stage: 2,
        gold: 150,
        heroes: [{ ...baseState().heroes[0], level: 5 }],
        activeParty: [{ ...baseState().heroes[0], level: 5 }],
      }),
    );

    expect(moment).toBeNull();
  });

  // it('relatório idle usa portrait dos heróis em vez de ícone genérico', () => {
  //   const moment = detector.buildIdleReport(
  //     {
  //       at: Date.now() - 60_000,
  //       stage: 1,
  //       gold: 100,
  //       pendingChestCount: 0,
  //       heroLevels: { 'hero-1': 4 },
  //     },
  //     baseState({
  //       stage: 2,
  //       gold: 150,
  //       heroes: [{ ...baseState().heroes[0], level: 5 }],
  //       activeParty: [{ ...baseState().heroes[0], level: 5 }],
  //     }),
  //   );
  //
  //   expect(moment?.kind).toBe('idle_report');
  //   expect(moment?.iconUrl).toBeUndefined();
  //   expect(moment?.heroPortrait).toEqual({
  //     id: 'hero-1',
  //     heroClass: 'knight',
  //     name: 'Galneon',
  //     ascensionId: null,
  //   });
  // });

  it('ignora recompensas de vitória quando skipVictoryRewards', () => {
    const previous = baseState({ stage: 1 });
    const next = baseState({ stage: 2 });

    const moments = detector.detect(previous, next, {}, { skipVictoryRewards: true });
    expect(moments).toHaveLength(0);
  });

  it('ainda detecta tier_up no estado, mas não vira tela wow', () => {
    const previous = baseState({ stage: 1 });
    const next = baseState({ stage: 2 });

    const moments = detector.detect(previous, next);
    expect(moments.some((moment) => moment.kind === 'tier_up')).toBe(true);
  });

  it('celebra marco X-50 com momento dedicado', () => {
    const previous = baseState({
      campaignProgress: {
        selectedPhaseId: '1-50',
        unlockedPhaseIds: ['1-1', '1-50'],
        clearedPhaseIds: [],
        highestTierReached: 1,
        seasonCompleted: false,
      },
    });
    const next = baseState({
      campaignProgress: {
        selectedPhaseId: '2-1',
        unlockedPhaseIds: ['1-1', '1-50', '2-1'],
        clearedPhaseIds: ['1-50'],
        highestTierReached: 50,
        seasonCompleted: false,
      },
    });

    const moments = detector.detect(previous, next);
    expect(moments.some((moment) => moment.kind === 'milestone_boss_defeated')).toBe(true);
    expect(moments.some((moment) => moment.kind === 'phase_cleared')).toBe(false);
    expect(moments.find((moment) => moment.kind === 'milestone_boss_defeated')?.title).toContain(
      'Capítulo',
    );
  });

  it('fase normal limpa gera phase_cleared, não marco', () => {
    const previous = baseState({
      campaignProgress: {
        selectedPhaseId: '1-2',
        unlockedPhaseIds: ['1-1', '1-2'],
        clearedPhaseIds: ['1-1'],
        highestTierReached: 1,
        seasonCompleted: false,
      },
    });
    const next = baseState({
      stage: 2,
      campaignProgress: {
        selectedPhaseId: '1-3',
        unlockedPhaseIds: ['1-1', '1-2', '1-3'],
        clearedPhaseIds: ['1-1', '1-2'],
        highestTierReached: 2,
        seasonCompleted: false,
      },
    });

    const moments = detector.detect(previous, next);
    expect(moments.some((moment) => moment.kind === 'phase_cleared')).toBe(true);
    expect(moments.some((moment) => moment.kind === 'milestone_boss_defeated')).toBe(false);
  });

  it('celebra lendário nomeado ao entrar no inventário', () => {
    const previous = baseState({ inventory: [] });
    const next = baseState({
      inventory: [
        {
          id: 'gear-ignus',
          name: 'Ignus Ix',
          templateId: 'ignus_ix',
          slot: 'accessory',
          rarity: 'legendary',
          attackBonus: 0,
          defenseBonus: 0,
          healthBonus: 0,
          attackSpeedBonus: 0,
          castSpeedBonus: 0,
          critChanceBonus: 0,
          critDamageBonus: 0,
          fireResistBonus: 0,
          coldResistBonus: 0,
          lightningResistBonus: 0,
          airResistBonus: 0,
          allElementalResistBonus: 0,
          fireDamageBonus: 30,
          fireResistPenetrationBonus: 30,
          coldDamageBonus: 0,
          lightningDamageBonus: 0,
          airDamageBonus: 0,
          allElementalDamageBonus: 0,
          fireDamageFlat: 0,
          coldDamageFlat: 0,
          lightningDamageFlat: 0,
          airDamageFlat: 0,
          fireResistFlat: 0,
          coldResistFlat: 0,
          lightningResistFlat: 0,
          airResistFlat: 0,
          attackPercentBonus: 0,
          defensePercentBonus: 0,
          healthPercentBonus: 0,
          physicalDamagePercentBonus: 0,
          cooldownReductionBonus: 0,
          dodgeChanceBonus: 0,
          blockChanceBonus: 0,
          damageReductionBonus: 0,
          requirements: { minLevel: 30, int: 28 },
          isNamedLegendary: true,
        },
      ],
    });

    const moments = detector.detect(previous, next);
    expect(moments.some((moment) => moment.kind === 'named_legendary_received')).toBe(true);
    expect(moments.find((moment) => moment.kind === 'named_legendary_received')?.gear?.name).toBe(
      'Ignus Ix',
    );
  });

  it('só celebra loot raro ou melhor', () => {
    expect(
      detector.buildLootMoment({
        id: 'g1',
        name: 'Espada',
        templateId: 'sword',
        slot: 'weapon',
        rarity: 'common',
        attackBonus: 1,
        defenseBonus: 0,
        healthBonus: 0,
        attackSpeedBonus: 0,
        castSpeedBonus: 0,
        critChanceBonus: 0,
        critDamageBonus: 0,
        fireResistBonus: 0,
        coldResistBonus: 0,
        lightningResistBonus: 0,
        airResistBonus: 0,
        allElementalResistBonus: 0,
        dodgeChanceBonus: 0,
        blockChanceBonus: 0,
        damageReductionBonus: 0,
        requirements: { minLevel: 1 },
      }),
    ).toBeNull();

    expect(
      detector.buildLootMoment({
        id: 'g2',
        name: 'Espada Rara',
        templateId: 'sword',
        slot: 'weapon',
        rarity: 'rare',
        attackBonus: 1,
        defenseBonus: 0,
        healthBonus: 0,
        attackSpeedBonus: 0,
        castSpeedBonus: 0,
        critChanceBonus: 0,
        critDamageBonus: 0,
        fireResistBonus: 0,
        coldResistBonus: 0,
        lightningResistBonus: 0,
        airResistBonus: 0,
        allElementalResistBonus: 0,
        dodgeChanceBonus: 0,
        blockChanceBonus: 0,
        damageReductionBonus: 0,
        requirements: { minLevel: 1 },
      })?.kind,
    ).toBe('loot_received');
  });

  it('celebra ascensão com portrait do sprite de evolução', () => {
    const moment = detector.buildAscensionMoment({
      id: 'hero-1',
      name: 'Galneon',
      heroClass: 'knight',
      ascensionId: 'knight_military_guerreiro',
    });

    expect(moment.title).toBe('Ascensão!');
    expect(moment.heroEmoji).toBeUndefined();
    expect(moment.heroPortrait).toEqual({
      id: 'hero-1',
      heroClass: 'knight',
      name: 'Galneon',
      ascensionId: 'knight_military_guerreiro',
    });
  });

  it('celebra unlock de achievement Hero - Out of the Side', () => {
    const moment = detector.buildAchievementMoment({
      id: 'hero_out_of_the_side',
      title: 'Hero - Out of the Side',
      description: 'Clear stage 1-1 for the first time.',
      previousProgress: 0,
      currentProgress: 1,
      target: 1,
      completed: true,
      justCompleted: true,
    });

    expect(moment.kind).toBe('achievement_unlocked');
    expect(moment.title).toBe('Hero - Out of the Side');
    expect(moment.subtitle).toBe('Achievement desbloqueado!');
    expect(moment.detailLines?.[0]).toBe('Clear stage 1-1 for the first time.');
  });

  it('celebra progresso parcial de achievement', () => {
    const moment = detector.buildAchievementMoment({
      id: 'future_multi_step',
      title: 'Stub Multi',
      description: 'Defeat 3 bosses.',
      previousProgress: 1,
      currentProgress: 2,
      target: 3,
      completed: false,
      justCompleted: false,
    });

    expect(moment.kind).toBe('achievement_progress');
    expect(moment.subtitle).toBe('Progresso: 2/3');
  });
});
