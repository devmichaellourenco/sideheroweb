import { describe, expect, it } from 'vitest';
import { getSkillElementLabel, getSkillPrimaryElement } from './SkillElementResolver';

describe('SkillElementResolver', () => {
  it('resolve elemento primário de skills de dano', () => {
    expect(getSkillPrimaryElement('fireball')).toBe('fire');
    expect(getSkillPrimaryElement('arcane_bolt')).toBe('lightning');
    expect(getSkillPrimaryElement('frost_shard')).toBe('cold');
    expect(getSkillPrimaryElement('blizzard')).toBe('cold');
    expect(getSkillPrimaryElement('minor_heal')).toBeNull();
  });

  it('formata rótulo localizado', () => {
    expect(getSkillElementLabel('fireball')).toBe('Fogo');
    expect(getSkillElementLabel('frost_shard')).toBe('Gelo');
  });
});
