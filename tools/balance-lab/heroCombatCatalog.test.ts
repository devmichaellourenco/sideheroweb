import { describe, expect, it } from 'vitest';
import {
  buildHeroCombatLabPayload,
  HERO_CLASS_DISPLAY,
  HERO_DEX_ORDER,
} from './heroCombatCatalog';

describe('heroCombatCatalog dex', () => {
  it('ordena o índice na cadeia de unlock (Nix primeiro)', () => {
    expect([...HERO_DEX_ORDER]).toEqual([
      'sorcerer',
      'knight',
      'priest',
      'berserker',
      'archer',
      'paladin',
    ]);
    expect(HERO_CLASS_DISPLAY.sorcerer).toMatchObject({
      name: 'Nix',
      classLabel: 'Maga',
      roleLabel: 'Magia',
      dexNo: 1,
      starter: true,
    });
  });

  it('expõe sprite, papel e descrição de skill no snapshot do lab', () => {
    const payload = buildHeroCombatLabPayload();
    expect(payload.heroes.map((hero) => hero.heroClass)).toEqual([...HERO_DEX_ORDER]);
    const nix = payload.heroes[0];
    expect(nix?.name).toBe('Nix');
    expect(nix?.dexNo).toBe(1);
    expect(nix?.roleLabel).toBe('Magia');
    expect(nix?.starter).toBe(true);
    expect(nix?.spriteUrl).toContain('nix');
    const bolt = nix?.skills.find((skill) => skill.skillId === 'arcane_bolt');
    expect(bolt?.description).toMatch(/Magia/i);
    expect(bolt?.iconUrl).toMatch(/arcane_bolt|fireball|skills\//);
    expect(payload.skillFields.find((field) => field.key === 'powerPerRank')?.label).toBe(
      'Poder / rank',
    );
    expect(payload.universalSkills.some((skill) => skill.skillId === 'basic_attack')).toBe(true);
    const basic = payload.universalSkills.find((skill) => skill.skillId === 'basic_attack');
    expect(basic?.iconUrl).toContain('/panel/assets/');
    const maga = nix?.ascensions.find((row) => row.id === 'sorcerer_arcane_maga');
    expect(maga?.spriteUrl).toMatch(/nix_maga/);
    expect(nix?.passives[0]?.iconUrl).toContain('/panel/assets/');
  });
});
