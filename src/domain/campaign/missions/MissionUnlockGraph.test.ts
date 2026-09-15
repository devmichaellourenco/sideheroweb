import { describe, expect, it } from 'vitest';
import { mainMissionId, sideMissionId } from './MissionId';
import {
  isSideMissionUnlocked,
  listEligibleSideMissionIds,
  sideMissionsUnlockedByCompleting,
} from './MissionUnlockGraph';

describe('MissionUnlockGraph', () => {
  const main1 = mainMissionId('1-1');
  const main10 = mainMissionId('1-10');
  const main20 = mainMissionId('1-20');
  const watch = sideMissionId('stendra_village_watch');
  const patrol = sideMissionId('stendra_wayward_patrol');
  const skirmish = sideMissionId('stendra_border_skirmish');
  const ash = sideMissionId('stendra_ash_trail');
  const cache = sideMissionId('stendra_hidden_cache');

  it('capítulo 1-1: sides iniciais liberadas sem main; cinzas após 1-1', () => {
    expect(isSideMissionUnlocked(watch, [])).toBe(true);
    expect(isSideMissionUnlocked(patrol, [])).toBe(true);
    expect(isSideMissionUnlocked(skirmish, [])).toBe(true);
    expect(isSideMissionUnlocked(ash, [])).toBe(false);
    expect(isSideMissionUnlocked(ash, [main1])).toBe(true);
    expect(isSideMissionUnlocked(cache, [main1])).toBe(false);
    expect(isSideMissionUnlocked(cache, [main1, ash])).toBe(true);
  });

  it('Trilha de Cinzas expira ao concluir 1-10 (janela do capítulo 1-10)', () => {
    expect(isSideMissionUnlocked(ash, [main1])).toBe(true);
    expect(isSideMissionUnlocked(ash, [main1, main10])).toBe(false);
    const eligible = listEligibleSideMissionIds('stendra', [main1, main10]);
    expect(eligible).not.toContain(ash);
    expect(eligible).not.toContain(cache);
  });

  it('sides do capítulo 1-1 continuam unlocked no grafo após 1-10 (board filtra por faixa)', () => {
    expect(isSideMissionUnlocked(patrol, [main1, main10])).toBe(true);
    expect(listEligibleSideMissionIds('stendra', [main1, main10])).toEqual(
      expect.arrayContaining([watch, patrol, skirmish]),
    );
  });

  it('não lista side já concluída', () => {
    expect(isSideMissionUnlocked(ash, [main1, ash])).toBe(false);
    expect(listEligibleSideMissionIds('stendra', [main1, ash])).not.toContain(ash);
  });

  it('sideMissionsUnlockedByCompleting revela o próximo da cadeia', () => {
    expect(sideMissionsUnlockedByCompleting(main1, [])).toEqual([ash]);
    expect(sideMissionsUnlockedByCompleting(ash, [main1])).toEqual([cache]);
  });

  it('concluir 1-20 não muda unlock de ash já expirada por 1-10', () => {
    expect(isSideMissionUnlocked(ash, [main1, main10, main20])).toBe(false);
  });
});
