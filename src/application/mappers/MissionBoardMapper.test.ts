import { describe, expect, it } from 'vitest';
import { effectivePhaseGoldTotal } from '../../domain/balance/PhaseGoldBudget';
import { effectivePhaseXpTotal } from '../../domain/balance/PhaseXpBudget';
import { buildPhaseId } from '../../domain/campaign/CampaignIds';
import { getMissionById } from '../../domain/campaign/missions/MissionCatalog';
import { mainMissionId, sideMissionId } from '../../domain/campaign/missions/MissionId';
import { mapMissionPreview } from './MissionBoardMapper';

describe('MissionBoardMapper', () => {
  it('expõe ouro esperado e XP de vitória da fase no preview', () => {
    const mission = getMissionById(mainMissionId('1-1'));
    expect(mission).toBeDefined();
    const dto = mapMissionPreview(mission!, null);
    const phaseId = buildPhaseId(1, 1);

    expect(dto.expectedGold).toBe(effectivePhaseGoldTotal(phaseId));
    expect(dto.victoryXp).toBe(effectivePhaseXpTotal(phaseId));
    expect(dto.expectedGold).toBeGreaterThan(0);
    expect(dto.victoryXp).toBeGreaterThan(0);
  });

  it('resolve nomes legíveis de item e cena nas recompensas', () => {
    const mission = getMissionById(sideMissionId('stendra_hidden_cache'));
    expect(mission).toBeDefined();
    const dto = mapMissionPreview(mission!, null);

    expect(dto.rewards?.itemId).toBeTruthy();
    expect(dto.rewards?.sceneId).toBe('side:stendra_hidden_cache');
    expect(dto.rewardItemName).toBeTruthy();
    expect(dto.rewardSceneTitle).toBe('O esconderijo');
  });
});
