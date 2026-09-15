import { describe, expect, it, vi } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { Chest } from '../entities/Chest';
import {
  IGNUS_IX_TEMPLATE_ID,
  MORTHAVEN_SEAL_TEMPLATE_ID,
  SOLER_PLEGIUS_TEMPLATE_ID,
  SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
} from '../gear/UniqueGearCatalog';
import { ILootService } from '../services/ILootService';
import {
  isNamedChapterBossKill,
  tryCreateGonodorVorpalDrop,
  tryCreatePhase3SolerDrop,
  tryCreateSaciIgnusDrop,
  tryCreateUniqueBossGearDrop,
  tryGrantMilestoneUniqueGearOnPhaseClear,
} from './UniqueGearLootService';

describe('UniqueGearLootService', () => {
  const loot: ILootService = {
    generateGear: vi.fn(),
    generateGearForChest: vi.fn(),
    generateGearForSlot: vi.fn(),
    generateDeterministicGearForSlot: vi.fn(),
    generateGearFromCatalogItem: vi.fn(),
    generateGearFromTemplate: vi.fn().mockImplementation((templateId: string) =>
      Gear.create({
        id: `unique-${templateId}`,
        name: templateId,
        templateId,
        slot: templateId === IGNUS_IX_TEMPLATE_ID ? 'accessory' : 'weapon',
        rarity: 'legendary',
        attackBonus: 30,
        defenseBonus: 0,
        healthBonus: 0,
      }),
    ),
  };

  it('cria drop do Gonodor na fase 2-50 se o jogador ainda não possui', () => {
    const drop = tryCreateGonodorVorpalDrop(
      GameState.initial(),
      {
        phaseId: buildPhaseId(2, 50),
        mapIndex: 2,
        enemyType: 'gonodor',
        role: 'boss',
        isPhaseBoss: true,
      },
      loot,
    );

    expect(drop?.templateId).toBe(SWORD_VORPAL_LUPNUS_TEMPLATE_ID);
  });

  it('cria drop do Saci na fase 1-50 se o jogador ainda não possui', () => {
    const drop = tryCreateSaciIgnusDrop(
      GameState.initial(),
      {
        phaseId: buildPhaseId(1, 50),
        mapIndex: 1,
        enemyType: 'saci',
        role: 'boss',
        isPhaseBoss: true,
      },
      loot,
    );

    expect(drop?.templateId).toBe(IGNUS_IX_TEMPLATE_ID);
    expect(loot.generateGearFromTemplate).toHaveBeenCalledWith(
      IGNUS_IX_TEMPLATE_ID,
      expect.any(Number),
      'legendary',
      `unique-${IGNUS_IX_TEMPLATE_ID}`,
    );
  });

  it('reconhece boss de capítulo X-50 mesmo sem role após migração de save', () => {
    expect(
      isNamedChapterBossKill({
        phaseId: buildPhaseId(1, 50),
        mapIndex: 1,
        enemyType: 'saci',
        role: 'trash',
        isPhaseBoss: true,
      }),
    ).toBe(true);

    const drop = tryCreateSaciIgnusDrop(
      GameState.initial(),
      {
        phaseId: buildPhaseId(1, 50),
        mapIndex: 1,
        enemyType: 'saci',
        role: 'trash',
        isPhaseBoss: true,
      },
      loot,
    );

    expect(drop?.templateId).toBe(IGNUS_IX_TEMPLATE_ID);
  });

  it('cria drop do chefe da fase 3-50 se o jogador ainda não possui', () => {
    const drop = tryCreatePhase3SolerDrop(
      GameState.initial(),
      {
        phaseId: buildPhaseId(3, 50),
        mapIndex: 3,
        enemyType: 'renegade_necromancer',
        role: 'boss',
        isPhaseBoss: true,
      },
      loot,
    );

    expect(drop?.templateId).toBe(SOLER_PLEGIUS_TEMPLATE_ID);
  });

  it('tryCreateUniqueBossGearDrop prioriza Saci, Gonodor e fase 3', () => {
    const saciDrop = tryCreateUniqueBossGearDrop(
      GameState.initial(),
      {
        phaseId: buildPhaseId(1, 50),
        mapIndex: 1,
        enemyType: 'saci',
        role: 'boss',
        isPhaseBoss: true,
      },
      loot,
    );
    expect(saciDrop?.templateId).toBe(IGNUS_IX_TEMPLATE_ID);
  });

  it('concede lendário ao concluir marco X-50', () => {
    const drop = tryGrantMilestoneUniqueGearOnPhaseClear(
      GameState.initial(),
      buildPhaseId(2, 50),
      loot,
    );

    expect(drop?.templateId).toBe(SWORD_VORPAL_LUPNUS_TEMPLATE_ID);
  });

  it('não dropa fora do boss correto nem se já possui', () => {
    const ownedIgnus = GameState.initial().withInventory([
      Gear.create({
        id: 'owned',
        name: 'Ignus Ix',
        templateId: IGNUS_IX_TEMPLATE_ID,
        slot: 'accessory',
        rarity: 'legendary',
        attackBonus: 1,
        defenseBonus: 0,
        healthBonus: 0,
      }),
    ]);

    expect(
      tryCreateSaciIgnusDrop(
        ownedIgnus,
        {
          phaseId: buildPhaseId(1, 50),
          mapIndex: 1,
          enemyType: 'saci',
          role: 'boss',
          isPhaseBoss: true,
        },
        loot,
      ),
    ).toBeNull();
    expect(
      tryCreateSaciIgnusDrop(
        GameState.initial(),
        {
          phaseId: buildPhaseId(2, 50),
          mapIndex: 2,
          enemyType: 'saci',
          role: 'boss',
          isPhaseBoss: true,
        },
        loot,
      ),
    ).toBeNull();
    expect(
      tryCreateGonodorVorpalDrop(
        GameState.initial(),
        {
          phaseId: buildPhaseId(1, 50),
          mapIndex: 1,
          enemyType: 'gonodor',
          role: 'boss',
          isPhaseBoss: true,
        },
        loot,
      ),
    ).toBeNull();
  });

  it('não duplica lendário reservado em baú ainda não aberto', () => {
    const reservedIgnus = Gear.create({
      id: 'reserved-ignus',
      name: 'Ignus Ix',
      templateId: IGNUS_IX_TEMPLATE_ID,
      slot: 'accessory',
      rarity: 'legendary',
      attackBonus: 1,
      defenseBonus: 0,
      healthBonus: 0,
    });
    const state = GameState.initial().withChests([
      Chest.createWithGuaranteedLoot(50, 'act_boss', reservedIgnus),
    ]);

    const drop = tryCreateSaciIgnusDrop(
      state,
      {
        phaseId: buildPhaseId(1, 50),
        mapIndex: 1,
        enemyType: 'saci',
        role: 'boss',
        isPhaseBoss: true,
      },
      loot,
    );

    expect(drop).toBeNull();
  });

  it('cria drop do Duque na fase 4-50 (Selo de Morthaven)', () => {
    const drop = tryGrantMilestoneUniqueGearOnPhaseClear(
      GameState.initial(),
      buildPhaseId(4, 50),
      loot,
    );
    expect(drop?.templateId).toBe(MORTHAVEN_SEAL_TEMPLATE_ID);
  });
});
