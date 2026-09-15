import { describe, expect, it } from 'vitest';
import { GameState } from '../entities/GameState';
import {
  FORGE_IGNUS_IX_CHANCE,
  FORGE_SOLER_PLEGIUS_CHANCE,
  FORGE_VORPAL_LUPNUS_CHANCE,
  IGNUS_IX_TEMPLATE_ID,
  isSalvageBlockedGearTemplate,
  playerOwnsGearTemplate,
  resolveForgeNamedLegendaryTemplate,
  SOLER_PLEGIUS_TEMPLATE_ID,
  SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
} from './UniqueGearCatalog';
import { Gear } from '../entities/Gear';

describe('UniqueGearCatalog', () => {
  it('resolveForgeNamedLegendaryTemplate retorna Vorpal no primeiro tier de chance', () => {
    expect(resolveForgeNamedLegendaryTemplate(GameState.initial(), () => 0)).toBe(
      SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
    );
  });

  it('resolveForgeNamedLegendaryTemplate retorna Ignus no segundo tier', () => {
    expect(
      resolveForgeNamedLegendaryTemplate(
        GameState.initial().withInventory([
          Gear.create({
            id: 'vorpal',
            name: 'Vorpal',
            templateId: SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
            slot: 'weapon',
            rarity: 'legendary',
            attackBonus: 1,
            defenseBonus: 0,
            healthBonus: 0,
          }),
        ]),
        () => FORGE_VORPAL_LUPNUS_CHANCE / 2,
      ),
    ).toBe(IGNUS_IX_TEMPLATE_ID);
  });

  it('resolveForgeNamedLegendaryTemplate retorna Soler no terceiro tier', () => {
    const state = GameState.initial()
      .withInventory([
        Gear.create({
          id: 'vorpal',
          name: 'Vorpal',
          templateId: SWORD_VORPAL_LUPNUS_TEMPLATE_ID,
          slot: 'weapon',
          rarity: 'legendary',
          attackBonus: 1,
          defenseBonus: 0,
          healthBonus: 0,
        }),
        Gear.create({
          id: 'ignus',
          name: 'Ignus',
          templateId: IGNUS_IX_TEMPLATE_ID,
          slot: 'accessory',
          rarity: 'legendary',
          attackBonus: 0,
          defenseBonus: 0,
          healthBonus: 0,
        }),
      ]);

    expect(
      resolveForgeNamedLegendaryTemplate(
        state,
        () => FORGE_SOLER_PLEGIUS_CHANCE / 2,
      ),
    ).toBe(SOLER_PLEGIUS_TEMPLATE_ID);
  });

  it('resolveForgeNamedLegendaryTemplate retorna null acima do pool acumulado', () => {
    expect(
      resolveForgeNamedLegendaryTemplate(
        GameState.initial(),
        () =>
          FORGE_VORPAL_LUPNUS_CHANCE + FORGE_IGNUS_IX_CHANCE + FORGE_SOLER_PLEGIUS_CHANCE + 0.01,
      ),
    ).toBeNull();
  });

  it('playerOwnsGearTemplate varre inventário, baú e equipamento', () => {
    const gear = Gear.create({
      id: 'ignus',
      name: 'Ignus Ix',
      templateId: IGNUS_IX_TEMPLATE_ID,
      slot: 'accessory',
      rarity: 'legendary',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 0,
    });

    expect(playerOwnsGearTemplate(GameState.initial().withStash([gear]), IGNUS_IX_TEMPLATE_ID)).toBe(
      true,
    );
  });

  it('bloqueia salvage de lendários nomeados', () => {
    expect(isSalvageBlockedGearTemplate(IGNUS_IX_TEMPLATE_ID)).toBe(true);
    expect(isSalvageBlockedGearTemplate(SOLER_PLEGIUS_TEMPLATE_ID)).toBe(true);
    expect(isSalvageBlockedGearTemplate('rusty_blade')).toBe(false);
  });
});
