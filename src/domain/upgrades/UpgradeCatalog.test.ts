import { describe, expect, it } from 'vitest';
import { UPGRADE_TREE_UNIFIED_LAYOUT } from '../../presentation/components/UpgradeTreeLayout';
import { UPGRADE_CATALOG } from './UpgradeCatalog';

describe('UpgradeCatalog', () => {
  it('cada melhoria tem posição no layout unificado', () => {
    for (const entry of UPGRADE_CATALOG) {
      expect(UPGRADE_TREE_UNIFIED_LAYOUT[entry.id], `layout ausente: ${entry.id}`).toBeDefined();
    }
  });

  it('cada parent referencia outra melhoria do catálogo', () => {
    const ids = new Set(UPGRADE_CATALOG.map((entry) => entry.id));

    for (const entry of UPGRADE_CATALOG) {
      for (const parentId of entry.parents) {
        expect(ids.has(parentId), `parent inválido: ${entry.id} -> ${parentId}`).toBe(true);
      }
    }
  });

  it('não há ciclos na árvore de parents', () => {
    const byId = new Map(UPGRADE_CATALOG.map((entry) => [entry.id, entry.parents]));

    function hasCycle(startId: string): boolean {
      const visiting = new Set<string>();
      const visited = new Set<string>();

      function walk(id: string): boolean {
        if (visiting.has(id)) return true;
        if (visited.has(id)) return false;

        visiting.add(id);
        for (const parentId of byId.get(id) ?? []) {
          if (walk(parentId)) return true;
        }
        visiting.delete(id);
        visited.add(id);
        return false;
      }

      return walk(startId);
    }

    for (const entry of UPGRADE_CATALOG) {
      expect(hasCycle(entry.id), `ciclo detectado em ${entry.id}`).toBe(false);
    }
  });

  it('heróis estão na ramificação com parents e gates de main', () => {
    const knight = UPGRADE_CATALOG.find((entry) => entry.id === 'hero_unlock_knight');
    const priest = UPGRADE_CATALOG.find((entry) => entry.id === 'hero_unlock_priest');
    const berserker = UPGRADE_CATALOG.find((entry) => entry.id === 'hero_unlock_berserker');
    const archer = UPGRADE_CATALOG.find((entry) => entry.id === 'hero_unlock_archer');
    const paladin = UPGRADE_CATALOG.find((entry) => entry.id === 'hero_unlock_paladin');

    expect(knight?.branch).toBe('heroes');
    expect(knight?.parents).toEqual(['battle_skill_slot_2']);
    expect(knight?.unlockHeroClass).toBe('knight');
    expect(knight?.requirements).toEqual([{ type: 'main_mission_completed', missionId: 'main:1-1' }]);

    expect(priest?.parents).toEqual(['hero_unlock_knight']);
    expect(priest?.unlockHeroClass).toBe('priest');
    expect(priest?.requirements).toEqual([{ type: 'main_mission_completed', missionId: 'main:1-10' }]);

    expect(berserker?.parents).toEqual(['hero_unlock_priest']);
    expect(berserker?.unlockHeroClass).toBe('berserker');
    expect(berserker?.requirements).toEqual([{ type: 'main_mission_completed', missionId: 'main:1-20' }]);

    expect(archer?.parents).toEqual(['hero_unlock_berserker']);
    expect(archer?.unlockHeroClass).toBe('archer');
    expect(archer?.requirements).toEqual([{ type: 'main_mission_completed', missionId: 'main:1-30' }]);

    expect(paladin?.parents).toEqual(['hero_unlock_archer']);
    expect(paladin?.unlockHeroClass).toBe('paladin');
    expect(paladin?.requirements).toEqual([{ type: 'main_mission_completed', missionId: 'main:1-40' }]);
  });

  it('tem uma única raiz: slot de skill II', () => {
    const roots = UPGRADE_CATALOG.filter((entry) => entry.parents.length === 0);
    expect(roots.map((entry) => entry.id)).toEqual(['battle_skill_slot_2']);
    expect(UPGRADE_CATALOG.find((entry) => entry.id === 'optimize_loadout_1')).toBeUndefined();
    expect(UPGRADE_CATALOG.find((entry) => entry.id === 'battle_stats_1')).toBeUndefined();
  });

  it('combate integra slots de skill como raiz (tick idle, otimizar e auto-abrir desativados)', () => {
    const skillSlot = UPGRADE_CATALOG.find((entry) => entry.id === 'battle_skill_slot_2');
    const autoBattle = UPGRADE_CATALOG.find((entry) => entry.id === 'auto_battle_2');
    const openAll = UPGRADE_CATALOG.find((entry) => entry.id === 'open_all_chests_1');

    expect(skillSlot?.parents).toEqual([]);
    expect(autoBattle?.parents).toEqual(['battle_skill_slot_2']);
    expect(openAll?.parents).toEqual(['battle_skill_slot_2']);
    expect(UPGRADE_CATALOG.find((entry) => entry.id === 'background_tick_1')).toBeUndefined();
    expect(UPGRADE_CATALOG.find((entry) => entry.id === 'auto_open_chests_1')).toBeUndefined();
    expect(UPGRADE_CATALOG.find((entry) => entry.id === 'open_all_chests_2')).toBeUndefined();
  });

  it('economia integra renovar loja na árvore principal', () => {
    const shop = UPGRADE_CATALOG.find((entry) => entry.id === 'shop_refresh_1');

    expect(shop?.branch).toBe('economy');
    expect(shop?.parents).toEqual(['auto_battle_2']);
  });

  it('qol libera log após auto-batalha III', () => {
    const logFilter = UPGRADE_CATALOG.find((entry) => entry.id === 'log_filter_1');
    expect(logFilter?.branch).toBe('qol');
    expect(logFilter?.parents).toEqual(['auto_battle_3']);
  });

  it('reset de pontos I e II na árvore (Forja → I → II)', () => {
    const reset1 = UPGRADE_CATALOG.find((entry) => entry.id === 'improvement_reset_1');
    const reset2 = UPGRADE_CATALOG.find((entry) => entry.id === 'improvement_reset_2');

    expect(reset1?.feature).toBe('improvement_reset');
    expect(reset1?.level).toBe(1);
    expect(reset1?.cost).toBe(5000);
    expect(reset1?.parents).toEqual(['divine_forge_1']);
    expect(reset1?.requirements).toEqual(
      expect.arrayContaining([
        { type: 'upgrade_level', feature: 'divine_forge', minLevel: 1 },
        { type: 'min_hero_level', value: 12 },
      ]),
    );

    expect(reset2?.feature).toBe('improvement_reset');
    expect(reset2?.level).toBe(2);
    expect(reset2?.cost).toBe(10000);
    expect(reset2?.parents).toEqual(['improvement_reset_1']);
    expect(reset2?.requirements).toEqual(
      expect.arrayContaining([
        { type: 'upgrade_level', feature: 'improvement_reset', minLevel: 1 },
        { type: 'min_hero_level', value: 22 },
      ]),
    );
  });
});
