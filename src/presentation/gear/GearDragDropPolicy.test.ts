import { describe, expect, it } from 'vitest';
import {
  canDropGearOnSlot,
  parseGearDragSource,
  serializeGearDragSource,
} from './GearDragDropPolicy';

describe('GearDragDropPolicy', () => {
  it('só permite drop no slot compatível', () => {
    expect(canDropGearOnSlot('weapon', 'weapon')).toBe(true);
    expect(canDropGearOnSlot('weapon', 'armor')).toBe(false);
  });

  it('serializa e parseia payload de drag', () => {
    const source = { kind: 'inventory' as const, gearId: 'g1', slot: 'weapon' as const };
    const encoded = encodeURIComponent(serializeGearDragSource(source));
    expect(parseGearDragSource(encoded)).toEqual(source);
  });

  it('rejeita payload inválido', () => {
    expect(parseGearDragSource(null)).toBeNull();
    expect(parseGearDragSource('not-json')).toBeNull();
  });
});
