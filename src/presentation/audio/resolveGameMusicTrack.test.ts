import { describe, expect, it } from 'vitest';
import { resolveGameMusicTrack } from './resolveGameMusicTrack';

describe('resolveGameMusicTrack', () => {
  it('retorna camp quando nao ha missao ativa', () => {
    expect(resolveGameMusicTrack({ phaseRun: null })).toBe('camp');
  });

  it('retorna battle quando phaseRun esta ativo', () => {
    expect(resolveGameMusicTrack({ phaseRun: { phaseId: '1-1' } })).toBe('battle');
  });

  it('retorna null sem estado', () => {
    expect(resolveGameMusicTrack(null)).toBeNull();
  });
});
