import { describe, expect, it } from 'vitest';
import {
  validateUpgradeDependencies,
  validateUpgradeOverrideInput,
} from './upgradeTreeCatalog';

describe('validateUpgradeDependencies', () => {
  it('aceita alteração válida de pai', () => {
    const errors = validateUpgradeDependencies({
      version: 1,
      updatedAt: null,
      upgrades: {
        open_all_chests_1: { parents: ['auto_battle_2'] },
      },
    });

    expect(errors).toEqual([]);
  });

  it('rejeita pai inexistente, autorreferência e ciclo', () => {
    expect(
      validateUpgradeDependencies({
        version: 1,
        updatedAt: null,
        upgrades: { open_all_chests_1: { parents: ['missing'] } },
      }).join(' '),
    ).toContain('pai inexistente');

    expect(
      validateUpgradeDependencies({
        version: 1,
        updatedAt: null,
        upgrades: { open_all_chests_1: { parents: ['open_all_chests_1'] } },
      }).join(' '),
    ).toContain('não pode depender de si');

    expect(
      validateUpgradeDependencies({
        version: 1,
        updatedAt: null,
        upgrades: { battle_skill_slot_2: { parents: ['auto_battle_2'] } },
      }).join(' '),
    ).toContain('ciclo');
  });

  it('mantém battle_skill_slot_2 como única raiz', () => {
    const errors = validateUpgradeDependencies({
      version: 1,
      updatedAt: null,
      upgrades: { open_all_chests_1: { parents: [] } },
    });

    expect(errors).toContain('A árvore deve manter battle_skill_slot_2 como única raiz');
  });
});

describe('validateUpgradeOverrideInput', () => {
  it('rejeita requisito sem shape canônico', () => {
    expect(
      validateUpgradeOverrideInput({
        requirements: [{ type: 'upgrade_level', feature: 'invalid', minLevel: 1 }],
      }),
    ).toEqual(['requirements[0] é inválido']);
  });
});
