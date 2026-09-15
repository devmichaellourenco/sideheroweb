import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { listAscensionChainIds, resolveHeroPassives } from './PassiveResolver';

describe('PassiveResolver', () => {
  it('concede passiva de classe base', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const ids = resolveHeroPassives(knight).map((p) => p.id);
    expect(ids).toContain('titan_health');
    expect(ids).toHaveLength(1);
  });

  it('cumula cadeia de ascensão sem remover a de classe', () => {
    const base = Hero.createStarter('k1', 'knight', 'Galneon');
    const ascended = Hero.restore({
      ...base.toProps(),
      ascensionId: 'knight_military_capitao',
    });

    expect(listAscensionChainIds('knight_military_capitao')).toEqual([
      'knight_military_guerreiro',
      'knight_military_capitao',
    ]);

    const ids = resolveHeroPassives(ascended).map((p) => p.id);
    expect(ids).toEqual(['titan_health', 'discipline_steel', 'rally_heart']);
  });

  it('berserker, arqueira e paladino têm passiva base própria', () => {
    expect(resolveHeroPassives(Hero.createStarter('b1', 'berserker', 'Rok')).map((p) => p.id)).toEqual([
      'blood_thirst',
    ]);
    expect(resolveHeroPassives(Hero.createStarter('a1', 'archer', 'Rain')).map((p) => p.id)).toEqual([
      'kontempler_sight',
    ]);
    expect(resolveHeroPassives(Hero.createStarter('p1', 'paladin', 'Oath')).map((p) => p.id)).toEqual([
      'sacred_aegis',
    ]);
  });
});
