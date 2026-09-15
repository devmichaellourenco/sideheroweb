import { describe, expect, it } from 'vitest';
import {
  extractCharacterSpritePath,
  getHeroAttackAnimSheet,
  listHeroAttackAnimSpritePaths,
} from './HeroAttackAnimCatalog';

describe('HeroAttackAnimCatalog', () => {
  it('extrai path do portrait a partir do URL do asset', () => {
    expect(
      extractCharacterSpritePath(
        './assets/characters/galneon_aprendiz.png',
      ),
    ).toBe('characters/galneon_aprendiz.png');
  });

  it('registra sheet do Galneon aprendiz no basic_attack', () => {
    const sheet = getHeroAttackAnimSheet('characters/galneon_aprendiz.png', 'basic_attack');
    expect(sheet).toEqual({
      path: 'characters/galneon_aprendiz_basic_attack_sheet.png',
      columns: 4,
      rows: 2,
      frameDurationMs: 560,
    });
    expect(listHeroAttackAnimSpritePaths()).toContain('characters/galneon_aprendiz.png');
  });

  it('registra sheet da Elara aprendiz no basic_attack', () => {
    const sheet = getHeroAttackAnimSheet('characters/elara_aprendiz.png', 'basic_attack');
    expect(sheet).toEqual({
      path: 'characters/elara_aprendiz_basic_attack_sheet.png',
      columns: 4,
      rows: 2,
      frameDurationMs: 560,
    });
    expect(listHeroAttackAnimSpritePaths()).toContain('characters/elara_aprendiz.png');
  });

  it('registra sheet da Nix aprendiz no basic_attack', () => {
    const sheet = getHeroAttackAnimSheet('characters/nix_aprendiz.png', 'basic_attack');
    expect(sheet).toEqual({
      path: 'characters/nix_aprendiz_basic_attack_sheet.png',
      columns: 4,
      rows: 2,
      frameDurationMs: 560,
    });
    expect(listHeroAttackAnimSpritePaths()).toContain('characters/nix_aprendiz.png');
  });

  it('não anima evolução sem sheet própria', () => {
    expect(getHeroAttackAnimSheet('characters/galneon_guerreiro.png', 'basic_attack')).toBeNull();
    expect(getHeroAttackAnimSheet('characters/elara_cleriga_sagrada.png', 'basic_attack')).toBeNull();
    expect(getHeroAttackAnimSheet('characters/nix_maga.png', 'basic_attack')).toBeNull();
    expect(getHeroAttackAnimSheet('characters/galneon_aprendiz.png', 'power_attack')).toBeNull();
  });
});
