import { isMilestonePhase, parsePhaseId } from '../../domain/campaign/CampaignIds';
import { getMilestoneBlueprint } from '../../domain/campaign/MilestonePhaseBlueprints';
import { GearDto } from '../dto/GameStateDto';

export interface MilestoneVictoryPresentation {
  isMilestone: boolean;
  isMajorMilestone: boolean;
  chapterTitle: string;
  bossSubtitle: string;
}

export function isChapterMilestonePhaseId(phaseId: string): boolean {
  const { phaseNumber } = parsePhaseId(phaseId);
  return isMilestonePhase(phaseNumber);
}

export function resolveMilestoneVictoryPresentation(
  phaseId: string,
  clearedPhaseName: string,
): MilestoneVictoryPresentation {
  const milestone = isChapterMilestonePhaseId(phaseId);
  const blueprint = milestone ? getMilestoneBlueprint(phaseId) : null;

  return {
    isMilestone: milestone,
    isMajorMilestone: blueprint?.majorMilestone === true,
    chapterTitle: blueprint?.displayName ?? clearedPhaseName,
    bossSubtitle: clearedPhaseName,
  };
}

export function isCelebrationNamedGear(gear: GearDto): boolean {
  return gear.isUniqueLegendary === true || gear.isNamedLegendary === true;
}
