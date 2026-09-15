import { describe, expect, it } from 'vitest';
import { ImprovementResetMessages } from './ImprovementResetMessages';

describe('ImprovementResetMessages', () => {
  it('monta mensagens de bloqueio e massa parcial', () => {
    expect(ImprovementResetMessages.featureUnitaryBlocked).toMatch(/Runas/);
    expect(ImprovementResetMessages.skillEquippedAtZero('Investida')).toContain('Investida');
    expect(ImprovementResetMessages.attributeBlockedByAscension('Capitão', 'str', 16)).toContain(
      'STR ≥ 16',
    );
    expect(ImprovementResetMessages.massPartialGear('Elmo', 'dex', 12)).toContain('Desequipe');
  });
});
