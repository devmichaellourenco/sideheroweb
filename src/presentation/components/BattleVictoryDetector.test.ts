import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { detectBattleVictory, buildBattleIntermissionPayload } from './BattleVictoryDetector';

function baseState(partial: Partial<GameStateDto> = {}): GameStateDto {
  return {
    heroes: [],
    activeParty: [],
    activePartyIds: [],
    benchHeroes: [],
    canEditParty: true,
    loadoutEditOpen: false,
    phaseRestartOnResume: false,
    enemies: [],
    enemy: null,
    activeTurn: null,
    combatRound: 1,
    campaignName: 'Temporada I',
    mapId: 'stendra',
    mapName: 'Stendra',
    mapCombatHint: '',
    phaseLabel: 'Fase 1-2',
    phaseChallengeHint: '',
    phaseRun: null,
    combatIntermission: null,
    campaignProgress: {
      selectedPhaseId: '1-2',
      unlockedPhaseIds: ['1-1', '1-2'],
      clearedPhaseIds: ['1-1'],
      highestTierReached: 1,
      seasonCompleted: false,
    },
    stage: 1,
    difficultyTier: 1,
    gold: 100,
    chests: [],
    inventory: [],
    battleLog: [],
    totalBattlesWon: 2,
    pendingChestCount: 0,
    upgradeLevels: {},
    shopRefreshUses: 0,
    shopRefreshLimit: 0,
    purchasableUpgradeCount: 0,
    featureFlags: {} as GameStateDto['featureFlags'],
    chestProgress: { wins: 2, target: 3, remaining: 1 },
    gearUpgradeHints: {},
    seasonCompleted: false,
    ...partial,
  };
}

describe('BattleVictoryDetector', () => {
  it('detecta vitória no boss com recompensas', () => {
    const previous = baseState({
      phaseRun: {
        phaseId: '1-2',
        displayName: 'Esgotos Profundos',
        waveIndex: 1,
        waveCount: 2,
        isBossWave: true,
      },
      enemies: [
        {
          id: 'boss-1',
          name: 'Capitão Slime',
          enemyType: 'giant_rat',
          health: 0,
          maxHealth: 50,
          attack: 5,
          defense: 2,
          goldReward: 25,
          xpReward: 40,
          signatureSkills: [],
          combatIntent: null,
          combatSkills: [],
          statusEffects: [],
        },
      ],
      heroes: [
        {
          id: 'h1',
          name: 'Galneon',
          heroClass: 'knight',
          emoji: '⚔',
          level: 1,
          experience: 0,
          experienceToNextLevel: 100,
          attack: 10,
          defense: 5,
          health: 50,
          maxHealth: 50,
          baseAttributes: { str: 5, dex: 3, int: 1 },
          allocatedAttributes: { str: 0, dex: 0, int: 0 },
          totalAttributes: { str: 5, dex: 3, int: 1 },
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
        },
      ],
    });

    const next = baseState({
      gold: 125,
      stage: 2,
      phaseRun: null,
      phaseLabel: 'Fase 1-3',
      campaignProgress: {
        selectedPhaseId: '1-3',
        unlockedPhaseIds: ['1-1', '1-2', '1-3'],
        clearedPhaseIds: ['1-1', '1-2'],
        highestTierReached: 2,
        seasonCompleted: false,
      },
      heroes: [
        {
          ...previous.heroes[0],
          level: 2,
          experience: 10,
          experienceToNextLevel: 150,
        },
      ],
    });

    const payload = detectBattleVictory(previous, next);

    expect(payload).not.toBeNull();
    expect(payload?.variant).toBe('phase-clear');
    expect(payload?.clearedPhaseName).toBe('Esgotos Profundos');
    expect(payload?.nextPhaseId).toBe('1-3');
    expect(payload?.goldGained).toBe(25);
    // XP vem do delta nos heróis (orçamento da fase na vitória), não de xpReward do inimigo.
    expect(payload?.xpGained).toBe(110);
    expect(payload?.tierReached).toBe(2);
    expect(payload?.heroRewards).toHaveLength(1);
    expect(payload?.heroRewards[0].newLevel).toBe(2);
  });

  it('detecta aproximação do boss com variant boss-approach', () => {
    const previous = baseState({
      phaseRun: {
        phaseId: '1-2',
        displayName: 'Esgotos Profundos',
        waveIndex: 0,
        waveCount: 2,
        isBossWave: false,
      },
      gold: 100,
    });

    const next = baseState({
      phaseRun: {
        phaseId: '1-2',
        displayName: 'Esgotos Profundos',
        waveIndex: 1,
        waveCount: 2,
        isBossWave: true,
      },
      campaignProgress: previous.campaignProgress,
      gold: 115,
    });

    const payload = detectBattleVictory(previous, next);

    expect(payload).not.toBeNull();
    expect(payload?.variant).toBe('boss-approach');
  });

  it('buildBattleIntermissionPayload na derrota exibe ouro parcial e zero XP', () => {
    const previous = baseState({
      gold: 100,
      heroes: [
        {
          id: 'h1',
          name: 'Nix',
          heroClass: 'sorcerer',
          emoji: '✦',
          level: 1,
          experience: 0,
          experienceToNextLevel: 100,
          attack: 10,
          defense: 5,
          health: 50,
          maxHealth: 50,
          baseAttributes: { str: 1, dex: 3, int: 5 },
          allocatedAttributes: { str: 0, dex: 0, int: 0 },
          totalAttributes: { str: 1, dex: 3, int: 5 },
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
        },
      ],
      phaseRun: {
        phaseId: '1-2',
        displayName: 'Patrulha',
        waveIndex: 0,
        waveCount: 2,
        isBossWave: false,
      },
    });

    const next = baseState({
      gold: 103,
      heroes: [
        {
          ...previous.heroes[0],
          experience: 0,
        },
      ],
      phaseRun: null,
      combatIntermission: {
        variant: 'defeat',
        clearedPhaseId: '1-2',
        clearedPhaseName: 'Patrulha',
        nextPhaseId: null,
        nextPhaseName: null,
      },
    });

    const payload = buildBattleIntermissionPayload(next.combatIntermission!, next, previous);

    expect(payload.variant).toBe('defeat');
    expect(payload.goldGained).toBe(3);
    expect(payload.xpGained).toBe(0);
  });

  it('derrota soma ouro da tentativa inteira e não concede XP', () => {
    const attemptStart = baseState({
      gold: 100,
      heroes: [
        {
          id: 'h1',
          name: 'Nix',
          heroClass: 'sorcerer',
          emoji: '✦',
          level: 1,
          experience: 0,
          experienceToNextLevel: 100,
          attack: 10,
          defense: 5,
          health: 50,
          maxHealth: 50,
          baseAttributes: { str: 1, dex: 3, int: 5 },
          allocatedAttributes: { str: 0, dex: 0, int: 0 },
          totalAttributes: { str: 1, dex: 3, int: 5 },
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
        },
      ],
    });
    const lastTick = baseState({
      gold: 118,
      heroes: [{ ...attemptStart.heroes[0]!, experience: 0, health: 0 }],
      phaseRun: {
        phaseId: '1-2',
        displayName: 'Patrulha',
        waveIndex: 1,
        waveCount: 2,
        isBossWave: false,
      },
    });
    const defeat = baseState({
      gold: 118,
      heroes: [{ ...attemptStart.heroes[0]!, experience: 0, health: 50 }],
      phaseRun: null,
      combatIntermission: {
        variant: 'defeat',
        clearedPhaseId: '1-2',
        clearedPhaseName: 'Patrulha',
        nextPhaseId: null,
        nextPhaseName: null,
      },
    });

    const withoutBaseline = buildBattleIntermissionPayload(
      defeat.combatIntermission!,
      defeat,
      lastTick,
    );
    expect(withoutBaseline.goldGained).toBe(0);
    expect(withoutBaseline.xpGained).toBe(0);

    const payload = buildBattleIntermissionPayload(
      defeat.combatIntermission!,
      defeat,
      lastTick,
      attemptStart,
    );
    expect(payload.goldGained).toBe(18);
    expect(payload.xpGained).toBe(0);
  });

  it('derrota sem delta de XP no herói não inventa XP a partir dos inimigos', () => {
    const previous = baseState({
      gold: 100,
      enemies: [
        {
          id: 'e1',
          name: 'Rato',
          enemyType: 'giant_rat',
          health: 10,
          maxHealth: 10,
          attack: 2,
          defense: 0,
          goldReward: 5,
          xpReward: 40,
          signatureSkills: [],
          combatIntent: null,
          combatSkills: [],
          statusEffects: [],
        },
      ],
      heroes: [
        {
          id: 'h1',
          name: 'Nix',
          heroClass: 'sorcerer',
          emoji: '✦',
          level: 1,
          experience: 7,
          experienceToNextLevel: 100,
          attack: 10,
          defense: 5,
          health: 0,
          maxHealth: 50,
          baseAttributes: { str: 1, dex: 3, int: 5 },
          allocatedAttributes: { str: 0, dex: 0, int: 0 },
          totalAttributes: { str: 1, dex: 3, int: 5 },
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
        },
      ],
      phaseRun: {
        phaseId: '1-1',
        displayName: 'Aventuras na Estrada',
        waveIndex: 0,
        waveCount: 1,
        isBossWave: true,
      },
    });

    const next = baseState({
      gold: 100,
      enemies: [],
      heroes: [
        {
          ...previous.heroes[0],
          health: 50,
          experience: 7,
        },
      ],
      phaseRun: null,
      combatIntermission: {
        variant: 'defeat',
        clearedPhaseId: '1-1',
        clearedPhaseName: 'Aventuras na Estrada',
        nextPhaseId: null,
        nextPhaseName: null,
      },
    });

    const payload = buildBattleIntermissionPayload(next.combatIntermission!, next, previous);

    expect(payload.variant).toBe('defeat');
    expect(payload.goldGained).toBe(0);
    expect(payload.xpGained).toBe(0);
  });
});
