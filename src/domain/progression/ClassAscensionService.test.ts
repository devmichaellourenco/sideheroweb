import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { Experience } from '../value-objects/Experience';
import { ClassAscensionService } from './ClassAscensionService';

describe('ClassAscensionService', () => {
  const service = new ClassAscensionService();

  it('lista dois caminhos iniciais para knight Aprendiz', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const options = service.listOptions(knight);

    expect(options).toHaveLength(2);
    expect(options.map((opt) => opt.definition.id)).toEqual([
      'knight_military_guerreiro',
      'knight_martial_gladiador',
    ]);
    expect(options.every((opt) => !opt.canAscend)).toBe(true);
  });

  it('permite escolher caminho militar quando requisitos são atendidos', () => {
    let knight = Hero.createStarter('k1', 'knight', 'Galneon');
    knight = Hero.restore({
      ...knight.toProps(),
      experience: Experience.restore(0, 100, 12),
      allocatedAttributes: { str: 2, dex: 0, int: 0 },
      skillRanks: { thrust: 1 },
    });

    expect(service.canAscend(knight, 'knight_military_guerreiro')).toBe(true);

    const ascended = service.ascend(knight, 'knight_military_guerreiro');
    expect(ascended.toProps().ascensionId).toBe('knight_military_guerreiro');
    expect(ascended.toProps().unspentImprovementPoints).toBe(2);
    expect(ascended.toProps().unspentAscensionPoints).toBe(0);
  });

  it('lista apenas a próxima evolução do caminho escolhido', () => {
    const knight = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      ascensionId: 'knight_military_guerreiro',
    });

    const options = service.listOptions(knight);
    expect(options).toHaveLength(1);
    expect(options[0].definition.id).toBe('knight_military_capitao');
  });

  it('impede trocar de caminho após a primeira evolução', () => {
    const knight = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      ascensionId: 'knight_military_guerreiro',
    });

    expect(service.canAscend(knight, 'knight_martial_gladiador')).toBe(false);
  });

  it('lista dois caminhos iniciais para sorcerer Aprendiz', () => {
    const sorcerer = Hero.createStarter('s1', 'sorcerer', 'Nix');
    const options = service.listOptions(sorcerer);

    expect(options).toHaveLength(2);
    expect(options.map((opt) => opt.definition.id)).toEqual([
      'sorcerer_arcane_maga',
      'sorcerer_innate_feiticeira',
    ]);
  });

  it('permite escolher caminho arcano quando requisitos são atendidos', () => {
    let sorcerer = Hero.createStarter('s1', 'sorcerer', 'Nix');
    sorcerer = Hero.restore({
      ...sorcerer.toProps(),
      experience: Experience.restore(0, 100, 12),
      allocatedAttributes: { str: 0, dex: 0, int: 2 },
      skillRanks: { arcane_bolt: 1 },
    });

    expect(service.canAscend(sorcerer, 'sorcerer_arcane_maga')).toBe(true);

    const ascended = service.ascend(sorcerer, 'sorcerer_arcane_maga');
    expect(ascended.toProps().ascensionId).toBe('sorcerer_arcane_maga');
  });

  it('lista dois caminhos iniciais para priest Aprendiz', () => {
    const priest = Hero.createStarter('p1', 'priest', 'Elara');
    const options = service.listOptions(priest);

    expect(options).toHaveLength(2);
    expect(options.map((opt) => opt.definition.id)).toEqual([
      'priest_sacred_cleriga',
      'priest_life_cleriga',
    ]);
  });

  it('permite escolher caminho da vida quando requisitos são atendidos', () => {
    let priest = Hero.createStarter('p1', 'priest', 'Elara');
    priest = Hero.restore({
      ...priest.toProps(),
      experience: Experience.restore(0, 100, 12),
      allocatedAttributes: { str: 0, dex: 3, int: 0 },
      skillRanks: { minor_heal: 1 },
    });

    expect(service.canAscend(priest, 'priest_life_cleriga')).toBe(true);

    const ascended = service.ascend(priest, 'priest_life_cleriga');
    expect(ascended.toProps().ascensionId).toBe('priest_life_cleriga');
  });
});
