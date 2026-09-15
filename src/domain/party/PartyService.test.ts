import { describe, expect, it } from 'vitest';
import { PhaseRun } from '../campaign/PhaseRun';
import { CombatState } from '../entities/CombatState';
import { GameState } from '../entities/GameState';
import { Hero } from '../entities/Hero';
import { HeroUnlockService } from './HeroUnlockService';
import { PartyService } from './PartyService';
import { ActionTimerService } from '../services/combat/ActionTimerService';

function stateWithStarters(): GameState {
  const nix = GameState.initial();
  const roster = [
    Hero.createStarter('hero-1', 'knight', 'Galneon'),
    ...nix.roster,
    Hero.createStarter('hero-3', 'priest', 'Elara'),
  ];
  return nix.withRoster(roster).withActivePartyIds(['hero-1', 'hero-2', 'hero-3']);
}

describe('PartyService', () => {
  const service = new PartyService();

  it('adiciona herói da reserva à party ativa', () => {
    let state = stateWithStarters().withActivePartyIds(['hero-1', 'hero-2']);
    state = HeroUnlockService.applyUnlock(state, 'berserker');
    state = service.addToActiveParty(state, 'hero-berserker');
    expect(state.activePartyIds).toEqual(['hero-1', 'hero-2', 'hero-berserker']);
  });

  it('remove herói da party mantendo mínimo', () => {
    const state = stateWithStarters().withActivePartyIds(['hero-1', 'hero-2']);
    const next = service.removeFromActiveParty(state, 'hero-2');
    expect(next.activePartyIds).toEqual(['hero-1']);
  });

  it('reordena membros da party ativa', () => {
    const state = stateWithStarters();
    const next = service.moveActivePartyMember(state, 2, 0);
    expect(next.activePartyIds).toEqual(['hero-3', 'hero-1', 'hero-2']);
  });

  it('bloqueia edição durante combate', () => {
    const base = stateWithStarters();
    const locked = base.withCombat(
      CombatState.start(base.activeHeroes(), [], new ActionTimerService(), null),
    );
    expect(() => service.addToActiveParty(locked, 'hero-1')).toThrow(
      'Party só pode ser editada fora de combate',
    );
  });

  it('bloqueia edição com phaseRun ativo', () => {
    const locked = stateWithStarters().withPhaseRun(PhaseRun.start('1-1'));
    expect(() => service.removeFromActiveParty(locked, 'hero-3')).toThrow();
  });

  it('substitui herói da reserva em slot ocupado da equipe', () => {
    let state = stateWithStarters();
    state = HeroUnlockService.applyUnlock(state, 'berserker');
    const next = service.setActivePartySlot(state, 1, 'hero-berserker');
    expect(next.activePartyIds).toEqual(['hero-1', 'hero-berserker', 'hero-3']);
    expect(next.activePartyIds).not.toContain('hero-2');
  });

  it('troca heróis ativos ao soltar em slot ocupado', () => {
    const state = stateWithStarters();
    const next = service.setActivePartySlot(state, 2, 'hero-1');
    expect(next.activePartyIds).toEqual(['hero-3', 'hero-2', 'hero-1']);
  });

  it('preenche slot vazio da equipe', () => {
    let state = stateWithStarters().withActivePartyIds(['hero-1']);
    state = HeroUnlockService.applyUnlock(state, 'berserker');
    const next = service.setActivePartySlot(state, 1, 'hero-berserker');
    expect(next.activePartyIds).toEqual(['hero-1', 'hero-berserker']);
  });
});
