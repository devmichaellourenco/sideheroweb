import { describe, expect, it } from 'vitest';
import {
  ASCENSION_PASSIVE_IDS,
  BASE_CLASS_PASSIVE_IDS,
  getPassiveDefinition,
  listPassiveDefinitions,
} from './PassiveCatalog';
import { CLASS_ASCENSION_CATALOG } from '../progression/ClassAscensionCatalog';

describe('PassiveCatalog', () => {
  it('define passivas base para as 6 classes', () => {
    expect(BASE_CLASS_PASSIVE_IDS.knight).toBe('titan_health');
    expect(BASE_CLASS_PASSIVE_IDS.sorcerer).toBe('magic_affinity');
    expect(BASE_CLASS_PASSIVE_IDS.priest).toBe('life_bond');
    expect(BASE_CLASS_PASSIVE_IDS.berserker).toBe('blood_thirst');
    expect(BASE_CLASS_PASSIVE_IDS.archer).toBe('kontempler_sight');
    expect(BASE_CLASS_PASSIVE_IDS.paladin).toBe('sacred_aegis');
  });

  it('tem passiva para cada ascensão do catálogo', () => {
    for (const entry of CLASS_ASCENSION_CATALOG) {
      expect(ASCENSION_PASSIVE_IDS[entry.id]).toBeTruthy();
      expect(getPassiveDefinition(ASCENSION_PASSIVE_IDS[entry.id]).id).toBe(
        ASCENSION_PASSIVE_IDS[entry.id],
      );
    }
  });

  it('lista definições com nome e efeitos', () => {
    const list = listPassiveDefinitions();
    expect(list.length).toBeGreaterThanOrEqual(23);
    expect(getPassiveDefinition('titan_health').name).toBe('Saúde de Titã');
    expect(getPassiveDefinition('magic_affinity').name).toBe('Afinidade Mágica');
    expect(getPassiveDefinition('life_bond').name).toBe('Elo com a Vida');
  });
});
