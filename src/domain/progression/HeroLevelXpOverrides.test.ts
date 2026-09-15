import { afterEach, describe, expect, it } from 'vitest';
import { Experience } from '../value-objects/Experience';
import {
  catalogExpRequiredToAdvanceFromLevel,
  expRequiredToAdvanceFromLevel,
  HERO_MAX_LEVEL,
} from './HeroLevelXpCatalog';
import {
  normalizeHeroLevelXpOverrides,
  setRuntimeHeroLevelXpOverrides,
} from './HeroLevelXpOverrides';

describe('HeroLevelXpOverrides', () => {
  afterEach(() => {
    setRuntimeHeroLevelXpOverrides(null);
  });

  it('sobrescreve a XP do nível sem alterar a curva canônica', () => {
    const baseline = catalogExpRequiredToAdvanceFromLevel(3);
    setRuntimeHeroLevelXpOverrides({ '3': 12_345 });

    expect(expRequiredToAdvanceFromLevel(3)).toBe(12_345);
    expect(catalogExpRequiredToAdvanceFromLevel(3)).toBe(baseline);
    expect(expRequiredToAdvanceFromLevel(4)).toBe(
      catalogExpRequiredToAdvanceFromLevel(4),
    );
  });

  it('level-up usa a curva sobrescrita', () => {
    setRuntimeHeroLevelXpOverrides({ '1': 10, '2': 10 });

    const gained = Experience.initial().gain(21).experience;

    expect(gained.level).toBe(3);
    expect(gained.current).toBe(1);
  });

  it('mantém 0 no nível máximo mesmo com override', () => {
    setRuntimeHeroLevelXpOverrides({ [String(HERO_MAX_LEVEL)]: 500 });

    expect(expRequiredToAdvanceFromLevel(HERO_MAX_LEVEL)).toBe(0);
  });

  it('descarta valores inválidos ao normalizar', () => {
    expect(
      normalizeHeroLevelXpOverrides({
        '5': 900,
        '6': 0,
        '7': -30,
        '8': 'abc',
        abc: 500,
        '9': 12.9,
      }),
    ).toEqual({ '5': 900, '9': 12 });
  });
});
