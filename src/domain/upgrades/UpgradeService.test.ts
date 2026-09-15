import { afterEach, describe, expect, it } from 'vitest';
import { GameState } from '../entities/GameState';
import { Gold } from '../value-objects/Gold';
import { getCatalogUpgradeById } from './UpgradeCatalog';
import { setRuntimeUpgradeOverrides } from './UpgradeOverrides';
import { UpgradeService } from './UpgradeService';

describe('UpgradeService', () => {
  const service = new UpgradeService();

  function progressionReadyState(): GameState {
    return GameState.restore({
      ...GameState.initial().toProps(),
      stage: 5,
      gold: Gold.of(10_000).value(),
      totalBattlesWon: 10,
    });
  }

  function nodeStatus(state: GameState, id: string) {
    return service.buildTree(state).find((node) => node.definition.id === id)?.status;
  }

  it('tem apenas battle_skill_slot_2 como raiz desbloqueável inicial', () => {
    const state = progressionReadyState();
    const roots = service
      .buildTree(state)
      .filter((node) => node.definition.parents.length === 0);

    expect(roots.map((node) => node.definition.id)).toEqual(['battle_skill_slot_2']);
    expect(nodeStatus(state, 'battle_skill_slot_2')).toBe('locked');
    expect(nodeStatus(state, 'auto_battle_2')).toBe('locked');
    expect(nodeStatus(state, 'open_all_chests_1')).toBe('locked');
  });

  it('libera slot de skill na raiz quando herói atinge nível 3', () => {
    const roster = progressionReadyState().roster.map((hero, index) =>
      index === 0 ? hero.gainExperience(200) : hero,
    );
    const state = progressionReadyState().withRoster(roster);

    expect(state.roster[0].level).toBeGreaterThanOrEqual(3);
    expect(nodeStatus(state, 'battle_skill_slot_2')).toBe('available');
  });

  it('permite auto_battle_2 com tier implícito 1x após comprar slot de skill', () => {
    const roster = progressionReadyState().roster.map((hero, index) =>
      index === 0 ? hero.gainExperience(200) : hero,
    );
    const state = progressionReadyState()
      .withRoster(roster)
      .withUpgradeLevels({ battle_skill_slots: 1 });

    expect(nodeStatus(state, 'battle_skill_slot_2')).toBe('owned');
    expect(nodeStatus(state, 'auto_battle_2')).toBe('available');
  });

  it('libera baús após slot de skill (raiz)', () => {
    const roster = progressionReadyState().roster.map((hero, index) =>
      index === 0 ? hero.gainExperience(200) : hero,
    );
    const state = progressionReadyState()
      .withRoster(roster)
      .withUpgradeLevels({ battle_skill_slots: 1 });

    expect(nodeStatus(state, 'open_all_chests_1')).toBe('available');
    expect(nodeStatus(state, 'auto_open_chests_1')).toBeUndefined();
  });

  it('bloqueia auto-batalha II sem a raiz de slot de skill', () => {
    const state = progressionReadyState().withUpgradeLevels({ auto_battle: 2 });

    expect(nodeStatus(state, 'auto_battle_2')).toBe('locked');
  });

  describe('overrides do Balance Lab', () => {
    afterEach(() => {
      setRuntimeUpgradeOverrides(null);
    });

    it('buildTree usa o custo com override, não o do catálogo', () => {
      const baseline = getCatalogUpgradeById('battle_skill_slot_2')!;
      const overriddenCost = baseline.cost + 777;
      setRuntimeUpgradeOverrides({
        version: 1,
        updatedAt: null,
        upgrades: { battle_skill_slot_2: { cost: overriddenCost } },
      });

      const node = new UpgradeService()
        .buildTree(progressionReadyState())
        .find((entry) => entry.definition.id === 'battle_skill_slot_2');

      expect(node?.definition.cost).toBe(overriddenCost);
    });

    it('custo exibido na árvore casa com o cobrado na compra', () => {
      const roster = progressionReadyState().roster.map((hero, index) =>
        index === 0 ? hero.gainExperience(200) : hero,
      );
      setRuntimeUpgradeOverrides({
        version: 1,
        updatedAt: null,
        upgrades: { battle_skill_slot_2: { cost: 20 } },
      });

      const state = progressionReadyState().withRoster(roster);
      const shown = new UpgradeService()
        .buildTree(state)
        .find((entry) => entry.definition.id === 'battle_skill_slot_2')!.definition.cost;
      const spent =
        state.gold.value() - service.purchase(state, 'battle_skill_slot_2').gold.value();

      expect(shown).toBe(20);
      expect(spent).toBe(shown);
    });
  });
});
