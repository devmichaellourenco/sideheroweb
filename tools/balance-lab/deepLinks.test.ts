import { describe, expect, it } from 'vitest';
import {
  parseHashDeepLink,
  buildHashDeepLink,
} from './deepLinks';

describe('parseHashDeepLink', () => {
  it('faz parse de hash simples de aba', () => {
    expect(parseHashDeepLink('#missions')).toEqual({ tab: 'missions' });
  });

  it('faz parse de hash com id de entidade', () => {
    expect(parseHashDeepLink('#gear?id=iron_sword')).toEqual({
      tab: 'gear',
      entityKey: 'id',
      entityValue: 'iron_sword',
    });
  });

  it('faz parse de hash com class de herói', () => {
    expect(parseHashDeepLink('#heroes?class=knight')).toEqual({
      tab: 'heroes',
      entityKey: 'class',
      entityValue: 'knight',
    });
  });

  it('faz parse de hash com type de inimigo', () => {
    expect(parseHashDeepLink('#enemies?type=goblin_raider')).toEqual({
      tab: 'enemies',
      entityKey: 'type',
      entityValue: 'goblin_raider',
    });
  });

  it('faz parse sem # prefixo', () => {
    expect(parseHashDeepLink('sim')).toEqual({ tab: 'sim' });
  });

  it('retorna null para hash vazio', () => {
    expect(parseHashDeepLink('')).toBeNull();
    expect(parseHashDeepLink('#')).toBeNull();
  });

  it('não retorna entityKey para param desconhecido', () => {
    const result = parseHashDeepLink('#gear?foo=bar');
    expect(result?.entityKey).toBeUndefined();
    expect(result?.entityValue).toBeUndefined();
  });

  it('decodifica valor com encode', () => {
    const result = parseHashDeepLink('#enemies?id=goblin%20raider');
    expect(result?.entityValue).toBe('goblin raider');
  });
});

describe('buildHashDeepLink', () => {
  it('constrói hash simples sem entidade', () => {
    expect(buildHashDeepLink('economy')).toBe('#economy');
  });

  it('constrói hash com entidade id', () => {
    expect(buildHashDeepLink('gear', 'id', 'iron_sword')).toBe('#gear?id=iron_sword');
  });

  it('constrói hash com entidade class', () => {
    expect(buildHashDeepLink('heroes', 'class', 'knight')).toBe('#heroes?class=knight');
  });

  it('ignora entityKey sem entityValue', () => {
    expect(buildHashDeepLink('economy', 'id', undefined)).toBe('#economy');
  });

  it('codifica caracteres especiais no valor', () => {
    const hash = buildHashDeepLink('gear', 'id', 'iron sword');
    expect(hash).toBe('#gear?id=iron%20sword');
  });

  it('round-trip: parse(build(tab, key, value)) recupera valores', () => {
    const hash = buildHashDeepLink('enemies', 'id', 'goblin_raider');
    const parsed = parseHashDeepLink(hash);
    expect(parsed).toEqual({ tab: 'enemies', entityKey: 'id', entityValue: 'goblin_raider' });
  });
});
