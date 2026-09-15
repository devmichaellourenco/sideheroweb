import { describe, expect, it } from 'vitest';
import { getUniqueEffect, getUniqueEffectDescription } from './UniqueEffectCatalog';

describe('UniqueEffectCatalog', () => {
  it('expõe efeito da Vorpal Lupnus', () => {
    expect(getUniqueEffect('vorpal_lupnus_heal_block').displayName).toBe('Vorpal Lupnus');
    expect(getUniqueEffectDescription('vorpal_lupnus_heal_block')).toContain('não podem receber cura');
  });

  it('expõe efeito do Soler Plégius', () => {
    expect(getUniqueEffect('soler_plegius_cleanse').displayName).toBe('Soler Plégius');
    expect(getUniqueEffectDescription('soler_plegius_cleanse')).toContain('Uma vez por batalha');
  });
});
