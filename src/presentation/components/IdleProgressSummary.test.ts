import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { PanelSnapshot } from './PanelStateSnapshot';
import { buildIdleProgress, formatIdleDuration } from './IdleProgressSummary';

function snapshot(overrides: Partial<PanelSnapshot> = {}): PanelSnapshot {
  return {
    at: Date.now() - 60_000,
    stage: 1,
    gold: 100,
    pendingChestCount: 0,
    heroLevels: { hero_a: 2 },
    ...overrides,
  };
}

function state(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    stage: 3,
    gold: 180,
    pendingChestCount: 1,
    heroes: [{ id: 'hero_a', name: 'Aria', emoji: '🧙', level: 4 } as GameStateDto['heroes'][number]],
    ...overrides,
  } as GameStateDto;
}

describe('formatIdleDuration', () => {
  it('formata minutos e horas', () => {
    expect(formatIdleDuration(30_000)).toBe('Poucos segundos fora');
    expect(formatIdleDuration(5 * 60_000)).toBe('5 min fora');
    expect(formatIdleDuration(90 * 60_000)).toBe('1h 30min fora');
  });
});

describe('buildIdleProgress', () => {
  // OFFLINE PROGRESS DESATIVADO (2026-07)
  it('sempre null enquanto progresso offline estiver desativado', () => {
    expect(buildIdleProgress(snapshot({ at: Date.now() - 2000 }), state())).toBeNull();
    expect(buildIdleProgress(snapshot(), state())).toBeNull();
  });

  // it('retorna null quando o afastamento foi curto', () => {
  //   expect(buildIdleProgress(snapshot({ at: Date.now() - 2000 }), state())).toBeNull();
  // });
  //
  // it('monta linhas de progresso offline', () => {
  //   const progress = buildIdleProgress(snapshot(), state());
  //   expect(progress).not.toBeNull();
  //   expect(progress?.detailLines[0]).toMatch(/fora$/);
  //   expect(progress?.detailLines).toContain('+2 fases');
  //   expect(progress?.detailLines).toContain('+80 ouro');
  //   expect(progress?.detailLines).toContain('+1 baú');
  //   expect(progress?.detailLines.some((line) => line.includes('Aria'))).toBe(true);
  //   expect(progress?.toastLine).toContain('Enquanto você estava fora');
  //   expect(progress?.leveledHeroes).toHaveLength(1);
  //   expect(progress?.leveledHeroes[0].id).toBe('hero_a');
  // });
});
