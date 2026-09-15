import { describe, expect, it } from 'vitest';
import {
  getGearTemplate,
  GEAR_TEMPLATES,
  resolveGearTemplateSprite,
} from './GearTemplateCatalog';

describe('GearTemplateCatalog', () => {
  it('define um sprite único por item do catálogo', () => {
    const worn = getGearTemplate('worn_sword')!;
    const recruit = getGearTemplate('recruit_blade')!;

    expect(worn.id).toBe('worn_sword');
    expect(recruit.id).toBe('recruit_blade');
    expect(worn.sprite).toBe('gear/items/worn_sword.png');
    expect(recruit.sprite).toBe('gear/items/recruit_blade.png');
  });

  it('cada entrada tem spriteId e caminho de sprite distintos', () => {
    const ids = new Set(GEAR_TEMPLATES.map((entry) => entry.id));
    const sprites = new Set(GEAR_TEMPLATES.map((entry) => entry.sprite));
    expect(ids.size).toBe(GEAR_TEMPLATES.length);
    expect(sprites.size).toBe(GEAR_TEMPLATES.length);
  });

  it('resolve sprite do item Galneon pelo id', () => {
    const template = getGearTemplate('galneon_knight_sword')!;
    expect(resolveGearTemplateSprite(template)).toBe('gear/items/galneon_knight_sword.png');
  });

  it('mantém efeitos únicos nos sprites nomeados', () => {
    expect(getGearTemplate('sword_vorpal_lupnus')?.uniqueEffectId).toBe('vorpal_lupnus_heal_block');
    expect(getGearTemplate('soler_plegius')?.uniqueEffectId).toBe('soler_plegius_cleanse');
  });
});
