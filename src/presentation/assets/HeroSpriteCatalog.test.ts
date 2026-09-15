import { describe, expect, it } from 'vitest';
import { resolveHeroSpritePath } from './HeroSpriteCatalog';

describe('HeroSpriteCatalog', () => {
  it('usa sprite de aprendiz sem evolução', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: null }),
    ).toBe('characters/galneon_aprendiz.png');
  });

  it('mapeia evoluções do Caminho Militar', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: 'knight_military_guerreiro' }),
    ).toBe('characters/galneon_guerreiro.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: 'knight_military_capitao' }),
    ).toBe('characters/galneon_capitao.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: 'knight_military_general' }),
    ).toBe('characters/galneon_general.png');
  });

  it('mapeia evoluções do Caminho Marcial', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: 'knight_martial_gladiador' }),
    ).toBe('characters/galneon_gladiador.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: 'knight_martial_mestre' }),
    ).toBe('characters/galneon_mestre_marcial.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-1', heroClass: 'knight', ascensionId: 'knight_martial_campeao' }),
    ).toBe('characters/galneon_campeao.png');
  });

  it('mapeia evoluções do Caminho Arcano da Nix', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_arcane_maga' }),
    ).toBe('characters/nix_maga.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_arcane_arquimaga' }),
    ).toBe('characters/nix_arquimaga.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_arcane_imperatriz' }),
    ).toBe('characters/nix_imperatriz_arcana.png');
  });

  it('mapeia evoluções do Caminho Inato da Nix', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_innate_feiticeira' }),
    ).toBe('characters/nix_feiticeira.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_innate_soberana' }),
    ).toBe('characters/nix_soberana_astral.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_innate_filha_eter' }),
    ).toBe('characters/nix_filha_do_eter.png');
  });

  it('migra ascensões legadas da Nix', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_pyromancer' }),
    ).toBe('characters/nix_feiticeira.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-2', heroClass: 'sorcerer', ascensionId: 'sorcerer_arcanist' }),
    ).toBe('characters/nix_maga.png');
  });

  it('mapeia evoluções do Caminho Sagrado da Elara', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_sacred_cleriga' }),
    ).toBe('characters/elara_cleriga_sagrada.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_sacred_alta_sacerdotisa' }),
    ).toBe('characters/elara_alta_sacerdotiza.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_sacred_santa' }),
    ).toBe('characters/elara_santa.png');
  });

  it('mapeia evoluções do Caminho da Vida da Elara', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_life_cleriga' }),
    ).toBe('characters/elara_cleriga_da_vida.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_life_guardia' }),
    ).toBe('characters/elara_guardia_da_vida.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_life_filha_aurora' }),
    ).toBe('characters/elara_filha_da_aurora.png');
  });

  it('migra ascensões legadas da Elara', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_oracle' }),
    ).toBe('characters/elara_cleriga_da_vida.png');
    expect(
      resolveHeroSpritePath({ id: 'hero-3', heroClass: 'priest', ascensionId: 'priest_inquisitor' }),
    ).toBe('characters/elara_cleriga_sagrada.png');
  });

  it('usa Valerius como sprite do paladino', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-paladin', heroClass: 'paladin', ascensionId: null }),
    ).toBe('characters/valerius.png');
    expect(
      resolveHeroSpritePath({ id: 'outro', heroClass: 'paladin', ascensionId: null }),
    ).toBe('characters/valerius.png');
  });

  it('usa Rain como sprite da arqueira', () => {
    expect(
      resolveHeroSpritePath({ id: 'hero-archer', heroClass: 'archer', ascensionId: null }),
    ).toBe('characters/rain.png');
  });
});
