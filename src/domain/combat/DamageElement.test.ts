import { describe, expect, it } from 'vitest';
import { DAMAGE_ELEMENTS, DAMAGE_ELEMENT_LABELS } from './DamageElement';

describe('DamageElement', () => {
  it('aceita physical/fire/cold/lightning/air e exclui chaos', () => {
    expect(DAMAGE_ELEMENTS).toEqual(['physical', 'fire', 'cold', 'lightning', 'air']);
    expect(DAMAGE_ELEMENTS).not.toContain('chaos');
  });

  it('rotula air como Ar', () => {
    expect(DAMAGE_ELEMENT_LABELS.air).toBe('Ar');
  });
});
