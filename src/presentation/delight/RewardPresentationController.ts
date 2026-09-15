import { GameStateDto, GearDto, HeroDto } from '../../application/dto/GameStateDto';
import { AchievementUpdateDto } from '../../application/dto/AchievementDto';
// OFFLINE PROGRESS DESATIVADO (2026-07)
// import { PanelSnapshot } from '../components/PanelStateSnapshot';
import { RewardCelebrationPort } from '../delight/RewardCelebrationPort';
import { RewardMomentKind } from '../delight/types/RewardMoment';
import { RewardMomentDetector, StateChangeDetectOptions, StateChangeHandlers } from '../delight/RewardMomentDetector';
import { WowCelebrationController } from '../wow/WowCelebrationController';

const PHASE_CLEAR_CELEBRATION_KINDS = new Set<RewardMomentKind>([
  'milestone_boss_defeated',
  'named_legendary_received',
  'season_complete',
]);

export class RewardPresentationController implements RewardCelebrationPort {
  private readonly detector = new RewardMomentDetector();

  constructor(private readonly wowCelebration: WowCelebrationController) {}

  detectStateChange(
    previous: GameStateDto | null,
    next: GameStateDto,
    handlers: StateChangeHandlers = {},
    options: StateChangeDetectOptions = {},
  ): void {
    const moments = this.detector.detect(previous, next, handlers, options);
    for (const moment of moments) {
      this.wowCelebration.enqueueMoment(moment);
    }
  }

  /** Após boss final de área (X-50): só marco e lendário nomeado viram tela wow. */
  celebratePhaseMilestoneRewards(previous: GameStateDto, next: GameStateDto): void {
    const moments = this.detector.detect(previous, next);
    for (const moment of moments) {
      if (PHASE_CLEAR_CELEBRATION_KINDS.has(moment.kind)) {
        this.wowCelebration.enqueueMoment(moment);
      }
    }
  }

  celebrateUpgradePurchased(upgradeId: string): void {
    const moment = this.detector.buildUpgradePurchasedMoment(upgradeId);
    if (moment) this.wowCelebration.enqueueMoment(moment);
  }

  celebrateShopPurchase(gear: GearDto): void {
    this.wowCelebration.enqueueMoment(this.detector.buildShopPurchaseMoment(gear));
  }

  celebrateForgeCreated(gear: GearDto): void {
    this.wowCelebration.enqueueMoment(this.detector.buildForgeCreatedMoment(gear));
  }

  celebrateAscension(hero: Pick<HeroDto, 'id' | 'name' | 'heroClass' | 'ascensionId'>): void {
    this.wowCelebration.enqueueMoment(this.detector.buildAscensionMoment(hero));
  }

  celebrateAchievementUpdates(updates: readonly AchievementUpdateDto[]): void {
    if (updates.length === 0) return;
    for (const moment of this.detector.buildAchievementMoments(updates)) {
      this.wowCelebration.enqueueMoment(moment);
    }
  }

  celebrateBatchLoot(gears: GearDto[]): void {
    if (gears.length === 0) return;
    if (gears.length === 1) {
      void this.celebrateLoot(gears[0]);
      return;
    }
    this.wowCelebration.enqueueMoment(this.detector.buildBatchLootMoment(gears));
  }

  async celebrateLoot(gear: GearDto): Promise<void> {
    const moment = this.detector.buildLootMoment(gear);
    if (!moment) return;
    this.wowCelebration.enqueueMoment(moment);
  }

  // OFFLINE PROGRESS DESATIVADO (2026-07)
  // showIdleReport(snapshot: PanelSnapshot, state: GameStateDto): void {
  //   const moment = this.detector.buildIdleReport(snapshot, state);
  //   if (moment) this.wowCelebration.enqueueMoment(moment);
  // }
}
