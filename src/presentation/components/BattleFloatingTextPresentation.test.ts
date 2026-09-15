import { describe, expect, it } from 'vitest';
import {
  resolveBattleFloatClass,
  resolveBattleFloatLabel,
} from './BattleFloatingTextPresentation';

describe('resolveBattleFloatClass', () => {
  it('prioriza classe de crítico', () => {
    expect(resolveBattleFloatClass({ kind: 'crit', damageElement: 'fire' })).toBe('crit');
    expect(resolveBattleFloatClass({ kind: 'crit-heal' })).toBe('crit-heal');
    expect(resolveBattleFloatClass({ kind: 'crit-buff' })).toBe('crit-buff');
  });

  it('usa elemento dominante em dano normal', () => {
    expect(resolveBattleFloatClass({ kind: 'damage', damageElement: 'air' })).toBe('damage-air');
    expect(resolveBattleFloatClass({ kind: 'damage' })).toBe('damage');
  });

  it('marca level-up', () => {
    expect(resolveBattleFloatClass({ kind: 'level-up' })).toBe('level-up');
  });
});

describe('resolveBattleFloatLabel', () => {
  it('formata dano, cura e Lv UP', () => {
    expect(resolveBattleFloatLabel({ kind: 'damage', amount: 12 })).toBe('-12');
    expect(resolveBattleFloatLabel({ kind: 'heal', amount: 8 })).toBe('+8');
    expect(resolveBattleFloatLabel({ kind: 'level-up', amount: 5 })).toBe('Lv UP');
  });
});
