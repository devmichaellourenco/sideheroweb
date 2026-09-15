import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { PartyValidationError, PartyValidator } from './PartyValidator';

function starter(id: string): Hero {
  return Hero.createStarter(id, 'knight', `Hero ${id}`);
}

describe('PartyValidator', () => {
  const roster = [
    starter('hero-1'),
    Hero.createStarter('hero-2', 'sorcerer', 'Lyra'),
    Hero.createStarter('hero-3', 'priest', 'Elara'),
  ];

  it('normaliza ids inválidos mantendo party mínima', () => {
    const ids = PartyValidator.normalizeActivePartyIds(roster, ['missing', 'hero-2']);
    expect(ids).toEqual(['hero-2']);
  });

  it('limita party ao máximo de slots', () => {
    const ids = PartyValidator.normalizeActivePartyIds(roster, [
      'hero-1',
      'hero-2',
      'hero-3',
      'hero-1',
    ]);
    expect(ids).toEqual(['hero-1', 'hero-2', 'hero-3']);
  });

  it('valida party válida', () => {
    expect(() => PartyValidator.assertValid(roster, ['hero-1', 'hero-3'])).not.toThrow();
  });

  it('rejeita party vazia', () => {
    expect(() => PartyValidator.assertValid(roster, [])).toThrow(PartyValidationError);
  });

  it('rejeita herói fora do roster', () => {
    expect(() => PartyValidator.assertValid(roster, ['hero-99'])).toThrow(PartyValidationError);
  });

  it('rejeita duplicatas', () => {
    expect(() => PartyValidator.assertValid(roster, ['hero-1', 'hero-1'])).toThrow(
      PartyValidationError,
    );
  });
});
