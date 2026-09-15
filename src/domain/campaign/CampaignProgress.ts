import { PhaseId, buildPhaseId } from './CampaignIds';
import {
  clampSelectedPhaseId,
  isPhaseReleased,
  maxReleasedTier,
} from './CampaignReleaseScope';
import { MissionProgress, MissionProgressProps } from './missions/MissionProgress';
import { migrateLegacyCampaignToMissionProgress } from './missions/migrateLegacyCampaignToMissions';

export interface CampaignProgressProps {
  unlockedPhaseIds: PhaseId[];
  clearedPhaseIds: PhaseId[];
  selectedPhaseId: PhaseId;
  highestTierReached: number;
  seasonCompleted: boolean;
  viewedActSceneIds?: string[];
  /** Progresso do board de missões (camp-missions). */
  missionProgress?: MissionProgressProps;
}

export class CampaignProgress {
  readonly unlockedPhaseIds: PhaseId[];
  readonly clearedPhaseIds: PhaseId[];
  readonly selectedPhaseId: PhaseId;
  readonly highestTierReached: number;
  readonly seasonCompleted: boolean;
  readonly viewedActSceneIds: string[];
  readonly missionProgress: MissionProgress;

  private constructor(props: CampaignProgressProps) {
    this.unlockedPhaseIds = [...props.unlockedPhaseIds];
    this.clearedPhaseIds = [...props.clearedPhaseIds];
    this.selectedPhaseId = props.selectedPhaseId;
    this.highestTierReached = Math.max(1, props.highestTierReached);
    this.seasonCompleted = props.seasonCompleted ?? false;
    this.viewedActSceneIds = [...(props.viewedActSceneIds ?? [])];
    this.missionProgress = MissionProgress.restore(props.missionProgress);
  }

  static initial(): CampaignProgress {
    return new CampaignProgress({
      unlockedPhaseIds: [buildPhaseId(1, 1)],
      clearedPhaseIds: [],
      selectedPhaseId: buildPhaseId(1, 1),
      highestTierReached: 1,
      seasonCompleted: false,
      viewedActSceneIds: [],
      missionProgress: MissionProgress.initial().toProps(),
    });
  }

  static restore(props: CampaignProgressProps): CampaignProgress {
    const unlockedPhaseIds = props.unlockedPhaseIds ?? [buildPhaseId(1, 1)];
    const clearedPhaseIds = props.clearedPhaseIds ?? [];
    const selectedPhaseId = props.selectedPhaseId ?? buildPhaseId(1, 1);
    const maxTier = maxReleasedTier();

    const missionProgress = migrateLegacyCampaignToMissionProgress(
      {
        unlockedPhaseIds,
        clearedPhaseIds,
        selectedPhaseId,
        highestTierReached: props.highestTierReached ?? 1,
        seasonCompleted: props.seasonCompleted ?? false,
        viewedActSceneIds: props.viewedActSceneIds ?? [],
        missionProgress: props.missionProgress,
      },
      1,
    );

    return new CampaignProgress({
      unlockedPhaseIds,
      clearedPhaseIds,
      selectedPhaseId: clampSelectedPhaseId(selectedPhaseId, clearedPhaseIds, unlockedPhaseIds),
      highestTierReached: Math.min(Math.max(1, props.highestTierReached ?? 1), maxTier),
      seasonCompleted: props.seasonCompleted ?? false,
      viewedActSceneIds: props.viewedActSceneIds ?? [],
      missionProgress,
    });
  }

  canPlayPhase(phaseId: PhaseId): boolean {
    return (
      isPhaseReleased(phaseId) && (this.isUnlocked(phaseId) || this.isCleared(phaseId))
    );
  }

  isUnlocked(phaseId: PhaseId): boolean {
    return this.unlockedPhaseIds.includes(phaseId);
  }

  isCleared(phaseId: PhaseId): boolean {
    return this.clearedPhaseIds.includes(phaseId);
  }

  withSelectedPhase(phaseId: PhaseId): CampaignProgress {
    return this.clone({ selectedPhaseId: phaseId });
  }

  withMissionProgress(progress: MissionProgress): CampaignProgress {
    return this.clone({ missionProgress: progress.toProps() });
  }

  markCleared(phaseId: PhaseId, unlocks: PhaseId[], difficultyTier: number): CampaignProgress {
    const cleared = this.clearedPhaseIds.includes(phaseId)
      ? this.clearedPhaseIds
      : [...this.clearedPhaseIds, phaseId];

    const unlocked = new Set(this.unlockedPhaseIds);
    for (const nextId of unlocks) {
      unlocked.add(nextId);
    }

    return this.clone({
      clearedPhaseIds: cleared,
      unlockedPhaseIds: [...unlocked],
      highestTierReached: Math.max(this.highestTierReached, difficultyTier),
    });
  }

  markSeasonCompleted(): CampaignProgress {
    return this.clone({ seasonCompleted: true });
  }

  markActSceneViewed(sceneId: string): CampaignProgress {
    if (this.viewedActSceneIds.includes(sceneId)) {
      return this;
    }

    return this.clone({
      viewedActSceneIds: [...this.viewedActSceneIds, sceneId],
    });
  }

  toProps(): CampaignProgressProps {
    return {
      unlockedPhaseIds: [...this.unlockedPhaseIds],
      clearedPhaseIds: [...this.clearedPhaseIds],
      selectedPhaseId: this.selectedPhaseId,
      highestTierReached: this.highestTierReached,
      seasonCompleted: this.seasonCompleted,
      viewedActSceneIds: [...this.viewedActSceneIds],
      missionProgress: this.missionProgress.toProps(),
    };
  }

  private clone(partial: Partial<CampaignProgressProps>): CampaignProgress {
    return new CampaignProgress({ ...this.toProps(), ...partial });
  }
}
