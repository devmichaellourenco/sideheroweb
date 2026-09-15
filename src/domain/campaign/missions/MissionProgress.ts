import { MapId } from '../CampaignIds';
import { MissionId, sanitizeCompletedMainIds } from './MissionId';

export interface MissionProgressProps {
  completedMainIds: MissionId[];
  completedSideIds: MissionId[];
  /** Oferta atual de normais por mapa. */
  normalOffersByMapId: Record<string, MissionId[]>;
  normalOfferEpochByMapId: Record<string, number>;
  campVisitsSinceNormalRefresh: number;
  /** Missão em andamento (null no acampamento). */
  activeMissionId: MissionId | null;
  /** Seed estável do save para ofertas (derivável do save se omitido). */
  offerSeed: number;
  /** Cenas narrativas desbloqueadas e ainda não lidas. */
  pendingNarrativeSceneIds: string[];
  /** Cenas narrativas já vistas. */
  viewedNarrativeSceneIds: string[];
  /** Ids de catálogo de itens exclusivos já concedidos. */
  awardedExclusiveItemIds: string[];
}

export class MissionProgress {
  readonly completedMainIds: MissionId[];
  readonly completedSideIds: MissionId[];
  readonly normalOffersByMapId: Record<string, MissionId[]>;
  readonly normalOfferEpochByMapId: Record<string, number>;
  readonly campVisitsSinceNormalRefresh: number;
  readonly activeMissionId: MissionId | null;
  readonly offerSeed: number;
  readonly pendingNarrativeSceneIds: string[];
  readonly viewedNarrativeSceneIds: string[];
  readonly awardedExclusiveItemIds: string[];

  private constructor(props: MissionProgressProps) {
    this.completedMainIds = [...props.completedMainIds];
    this.completedSideIds = [...props.completedSideIds];
    this.normalOffersByMapId = Object.fromEntries(
      Object.entries(props.normalOffersByMapId ?? {}).map(([k, v]) => [k, [...v]]),
    );
    this.normalOfferEpochByMapId = { ...(props.normalOfferEpochByMapId ?? {}) };
    this.campVisitsSinceNormalRefresh = Math.max(0, props.campVisitsSinceNormalRefresh ?? 0);
    this.activeMissionId = props.activeMissionId ?? null;
    this.offerSeed = props.offerSeed >>> 0;
    this.pendingNarrativeSceneIds = [...(props.pendingNarrativeSceneIds ?? [])];
    this.viewedNarrativeSceneIds = [...(props.viewedNarrativeSceneIds ?? [])];
    this.awardedExclusiveItemIds = [...(props.awardedExclusiveItemIds ?? [])];
  }

  static initial(offerSeed = 1): MissionProgress {
    return new MissionProgress({
      completedMainIds: [],
      completedSideIds: [],
      normalOffersByMapId: {},
      normalOfferEpochByMapId: {},
      campVisitsSinceNormalRefresh: 0,
      activeMissionId: null,
      offerSeed,
      pendingNarrativeSceneIds: [],
      viewedNarrativeSceneIds: [],
      awardedExclusiveItemIds: [],
    });
  }

  static restore(props: Partial<MissionProgressProps> | null | undefined): MissionProgress {
    if (!props) return MissionProgress.initial();
    return new MissionProgress({
      completedMainIds: sanitizeCompletedMainIds(props.completedMainIds ?? []),
      completedSideIds: props.completedSideIds ?? [],
      normalOffersByMapId: props.normalOffersByMapId ?? {},
      normalOfferEpochByMapId: props.normalOfferEpochByMapId ?? {},
      campVisitsSinceNormalRefresh: props.campVisitsSinceNormalRefresh ?? 0,
      activeMissionId: props.activeMissionId ?? null,
      offerSeed: props.offerSeed ?? 1,
      pendingNarrativeSceneIds: props.pendingNarrativeSceneIds ?? [],
      viewedNarrativeSceneIds: props.viewedNarrativeSceneIds ?? [],
      awardedExclusiveItemIds: props.awardedExclusiveItemIds ?? [],
    });
  }

  completedMissionIds(): MissionId[] {
    return [...this.completedMainIds, ...this.completedSideIds];
  }

  isMainCompleted(missionId: MissionId): boolean {
    return this.completedMainIds.includes(missionId);
  }

  isSideCompleted(missionId: MissionId): boolean {
    return this.completedSideIds.includes(missionId);
  }

  normalOfferFor(mapId: MapId): MissionId[] {
    return [...(this.normalOffersByMapId[mapId] ?? [])];
  }

  offerEpochFor(mapId: MapId): number {
    return this.normalOfferEpochByMapId[mapId] ?? 0;
  }

  hasAwardedExclusiveItem(itemId: string): boolean {
    return this.awardedExclusiveItemIds.includes(itemId);
  }

  nextPendingNarrativeSceneId(): string | null {
    return this.pendingNarrativeSceneIds[0] ?? null;
  }

  withActiveMission(missionId: MissionId | null): MissionProgress {
    return this.clone({ activeMissionId: missionId });
  }

  withNormalOffer(mapId: MapId, offer: readonly MissionId[], epoch: number): MissionProgress {
    return this.clone({
      normalOffersByMapId: {
        ...this.normalOffersByMapId,
        [mapId]: [...offer],
      },
      normalOfferEpochByMapId: {
        ...this.normalOfferEpochByMapId,
        [mapId]: epoch,
      },
    });
  }

  withCampVisitsSinceNormalRefresh(visits: number): MissionProgress {
    return this.clone({ campVisitsSinceNormalRefresh: Math.max(0, visits) });
  }

  markMainCompleted(missionId: MissionId): MissionProgress {
    if (this.completedMainIds.includes(missionId)) return this;
    return this.clone({
      completedMainIds: [...this.completedMainIds, missionId],
      activeMissionId: this.activeMissionId === missionId ? null : this.activeMissionId,
    });
  }

  withCompletedMains(missionIds: readonly MissionId[]): MissionProgress {
    return this.clone({ completedMainIds: [...missionIds] });
  }

  markSideCompleted(missionId: MissionId): MissionProgress {
    if (this.completedSideIds.includes(missionId)) return this;
    return this.clone({
      completedSideIds: [...this.completedSideIds, missionId],
      activeMissionId: this.activeMissionId === missionId ? null : this.activeMissionId,
    });
  }

  /** Remove normal da oferta (vitória ou derrota). */
  removeNormalFromOffer(mapId: MapId, missionId: MissionId): MissionProgress {
    const current = this.normalOfferFor(mapId);
    if (!current.includes(missionId)) return this;
    return this.withNormalOffer(
      mapId,
      current.filter((id) => id !== missionId),
      this.offerEpochFor(mapId),
    );
  }

  clearActiveMission(): MissionProgress {
    return this.clone({ activeMissionId: null });
  }

  unlockNarrativeScene(sceneId: string): MissionProgress {
    if (
      this.viewedNarrativeSceneIds.includes(sceneId) ||
      this.pendingNarrativeSceneIds.includes(sceneId)
    ) {
      return this;
    }
    return this.clone({
      pendingNarrativeSceneIds: [...this.pendingNarrativeSceneIds, sceneId],
    });
  }

  markNarrativeSceneViewed(sceneId: string): MissionProgress {
    const pending = this.pendingNarrativeSceneIds.filter((id) => id !== sceneId);
    const viewed = this.viewedNarrativeSceneIds.includes(sceneId)
      ? this.viewedNarrativeSceneIds
      : [...this.viewedNarrativeSceneIds, sceneId];
    return this.clone({
      pendingNarrativeSceneIds: pending,
      viewedNarrativeSceneIds: viewed,
    });
  }

  markExclusiveItemAwarded(itemId: string): MissionProgress {
    if (this.awardedExclusiveItemIds.includes(itemId)) return this;
    return this.clone({
      awardedExclusiveItemIds: [...this.awardedExclusiveItemIds, itemId],
    });
  }

  toProps(): MissionProgressProps {
    return {
      completedMainIds: [...this.completedMainIds],
      completedSideIds: [...this.completedSideIds],
      normalOffersByMapId: Object.fromEntries(
        Object.entries(this.normalOffersByMapId).map(([k, v]) => [k, [...v]]),
      ),
      normalOfferEpochByMapId: { ...this.normalOfferEpochByMapId },
      campVisitsSinceNormalRefresh: this.campVisitsSinceNormalRefresh,
      activeMissionId: this.activeMissionId,
      offerSeed: this.offerSeed,
      pendingNarrativeSceneIds: [...this.pendingNarrativeSceneIds],
      viewedNarrativeSceneIds: [...this.viewedNarrativeSceneIds],
      awardedExclusiveItemIds: [...this.awardedExclusiveItemIds],
    };
  }

  private clone(partial: Partial<MissionProgressProps>): MissionProgress {
    return new MissionProgress({ ...this.toProps(), ...partial });
  }
}
