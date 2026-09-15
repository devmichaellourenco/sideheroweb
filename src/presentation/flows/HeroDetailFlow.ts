import { AscensionOptionDto } from '../../application/dto/AscensionOptionDto';
import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { SkillNodeDto } from '../../application/dto/SkillNodeDto';
import { HeroDetailModalRenderer, HeroDetailTab } from '../components/HeroDetailModalRenderer';
import { ToastController } from '../components/ToastController';
import { RewardCelebrationPort } from '../delight/RewardCelebrationPort';
import { AscendClassConfirmDialog } from '../components/AscendClassConfirmDialog';
import { ImprovementResetConfirmDialog } from '../components/ImprovementResetConfirmDialog';
import { ImprovementResetUiCopy } from '../components/ImprovementResetUiCopy';

export class HeroDetailFlow {
  skillNodes: SkillNodeDto[] = [];
  ascensionOptions: AscensionOptionDto[] = [];
  ascensionName: string | null = null;
  ascensionSkillNodes: SkillNodeDto[] = [];

  constructor(
    private readonly client: IGameClient,
    private readonly heroDetailModal: HeroDetailModalRenderer,
    private readonly toasts: ToastController,
    private readonly rewards: RewardCelebrationPort,
    private readonly ascendClassConfirmDialog: AscendClassConfirmDialog,
    private readonly improvementResetConfirmDialog: ImprovementResetConfirmDialog,
    private readonly onStateUpdated: (state: GameStateDto) => void,
    private readonly refreshModal: () => void,
  ) {}

  private onTabWillChange: ((tab: HeroDetailTab) => void) | null = null;

  setTabWillChangeListener(listener: (tab: HeroDetailTab) => void): void {
    this.onTabWillChange = listener;
  }

  async prepareOpen(heroId: string, tab: HeroDetailTab): Promise<void> {
    this.heroDetailModal.setActiveTab(tab);

    if (tab === 'skills' || tab === 'sheet') {
      await this.loadSkillTree(heroId);
    }
    if (tab === 'skills' || tab === 'class') {
      await this.loadAscensionTree(heroId);
    }
  }

  async loadSkillTree(heroId: string): Promise<void> {
    const response = await this.client.send({ type: 'GET_HERO_SKILL_TREE', heroId });
    if (response.ok && response.skillNodes) {
      this.skillNodes = response.skillNodes;
    }
  }

  async loadAscensionTree(heroId: string): Promise<void> {
    const response = await this.client.send({ type: 'GET_HERO_ASCENSION_TREE', heroId });
    if (!response.ok) {
      this.ascensionOptions = [];
      this.ascensionName = null;
      this.ascensionSkillNodes = [];
      return;
    }

    this.ascensionOptions = response.ascensionOptions ?? [];
    this.ascensionName = response.ascensionName ?? null;
    this.ascensionSkillNodes = response.ascensionSkillNodes ?? [];
  }

  async changeTab(heroId: string, tab: HeroDetailTab): Promise<void> {
    this.onTabWillChange?.(tab);
    this.heroDetailModal.setActiveTab(tab);
    if (tab === 'skills') {
      await Promise.all([this.loadSkillTree(heroId), this.loadAscensionTree(heroId)]);
    }
    if (tab === 'class') {
      await this.loadAscensionTree(heroId);
    }
    this.refreshModal();
  }

  bindToModal(
    container: HTMLElement,
    state: GameStateDto,
    heroId: string,
    handlers: {
      onSlotClick: (heroId: string, slot: string) => void;
      mountInventory?: (host: HTMLElement) => void;
    },
  ): void {
    this.heroDetailModal.setSkillNodes(this.skillNodes);
    this.heroDetailModal.setAscensionData(
      this.ascensionOptions,
      this.ascensionName,
      this.ascensionSkillNodes,
    );

    this.heroDetailModal.render(container, state, heroId, {
      onSlotClick: handlers.onSlotClick,
      onSpendAttribute: (id, attr) => {
        void this.spendAttributePoint(id, attr);
      },
      onRefundAttribute: (id, attr) => {
        void this.refundAttributePoint(id, attr);
      },
      onAllocateSkill: (id, skillId) => {
        void this.allocateSkillPoint(id, skillId);
      },
      onRefundSkill: (id, skillId) => {
        void this.refundSkillPoint(id, skillId);
      },
      onMassRefund: (id) => {
        const heroEntry = state.heroes.find((entry) => entry.id === id);
        if (heroEntry) {
          void this.confirmAndMassRefund(id, heroEntry.name);
        }
      },
      onAssignSkillSlot: (id, skillId, slotIndex) => {
        void this.assignSkillSlot(id, skillId, slotIndex);
      },
      onClearSkillSlot: (id, skillId) => {
        void this.clearSkillSlot(id, skillId);
      },
      onEquipSkillFirstAvailable: (id, skillId) => {
        void this.equipSkillFirstAvailable(id, skillId);
      },
      onAscendClass: (id, ascensionId) => {
        const heroEntry = state.heroes.find((entry) => entry.id === id);
        if (heroEntry) {
          void this.confirmAndAscend(id, ascensionId, heroEntry);
        }
      },
      onAllocateAscensionSkill: (id, skillId) => {
        void this.allocateAscensionSkill(id, skillId);
      },
      onTabChange: (id, tab) => {
        void this.changeTab(id, tab);
      },
      onMountInventory: handlers.mountInventory,
    });
  }

  private afterMutation(state: GameStateDto): void {
    this.onStateUpdated(state);
  }

  private async spendAttributePoint(heroId: string, attr: 'str' | 'dex' | 'int'): Promise<void> {
    const response = await this.client.send({
      type: 'SPEND_IMPROVEMENT_POINT',
      heroId,
      target: { type: 'attribute', key: attr },
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao gastar Aprimoramento', 'info');
      return;
    }
    this.afterMutation(response.state);
    this.toasts.show(`+1 ${attr.toUpperCase()}`, 'info');
  }

  private async refundAttributePoint(heroId: string, attr: 'str' | 'dex' | 'int'): Promise<void> {
    const response = await this.client.send({
      type: 'REFUND_IMPROVEMENT_POINT',
      heroId,
      target: { type: 'attribute', key: attr },
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? ImprovementResetUiCopy.refundAttributeFailed, 'info');
      return;
    }
    this.afterMutation(response.state);
    this.toasts.show(ImprovementResetUiCopy.unitaryAttributeSuccess(attr), 'info');
  }

  private async allocateSkillPoint(heroId: string, skillId: string): Promise<void> {
    const response = await this.client.send({
      type: 'SPEND_IMPROVEMENT_POINT',
      heroId,
      target: { type: 'skill', skillId },
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha na skill', 'info');
      return;
    }
    await this.loadSkillTree(heroId);
    this.afterMutation(response.state);
  }

  private async refundSkillPoint(heroId: string, skillId: string): Promise<void> {
    const response = await this.client.send({
      type: 'REFUND_IMPROVEMENT_POINT',
      heroId,
      target: { type: 'skill', skillId },
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? ImprovementResetUiCopy.refundSkillFailed, 'info');
      return;
    }
    await this.loadSkillTree(heroId);
    this.afterMutation(response.state);
  }

  async confirmAndMassRefund(heroId: string, heroName: string): Promise<void> {
    const previewResponse = await this.client.send({
      type: 'PREVIEW_MASS_REFUND_IMPROVEMENT_POINTS',
      heroId,
    });
    if (!previewResponse.ok || !previewResponse.massRefundPreview) {
      this.toasts.show(
        !previewResponse.ok
          ? (previewResponse.error ?? ImprovementResetUiCopy.massPreviewFailed)
          : ImprovementResetUiCopy.massPreviewFailed,
        'info',
      );
      return;
    }

    const confirmed = await this.improvementResetConfirmDialog.open(
      heroName,
      previewResponse.massRefundPreview,
    );
    if (!confirmed) return;
    await this.massRefund(heroId);
  }

  private async massRefund(heroId: string): Promise<void> {
    const response = await this.client.send({
      type: 'MASS_REFUND_IMPROVEMENT_POINTS',
      heroId,
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? ImprovementResetUiCopy.massFailed, 'info');
      return;
    }
    await Promise.all([this.loadSkillTree(heroId), this.loadAscensionTree(heroId)]);
    this.afterMutation(response.state);
    const refunded = response.pointsRefunded ?? 0;
    if (refunded > 0) {
      this.toasts.show(ImprovementResetUiCopy.massSuccess(refunded), 'info');
    } else {
      this.toasts.show(ImprovementResetUiCopy.massEmpty, 'info');
    }
    for (const warning of response.refundWarnings ?? []) {
      this.toasts.show(warning, 'info');
    }
  }

  private async assignSkillSlot(heroId: string, skillId: string, slotIndex: number): Promise<void> {
    const response = await this.client.send({
      type: 'ASSIGN_SKILL_SLOT',
      heroId,
      skillId,
      slotIndex,
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao alocar skill', 'info');
      return;
    }
    await Promise.all([this.loadSkillTree(heroId), this.loadAscensionTree(heroId)]);
    this.afterMutation(response.state);
  }

  private async clearSkillSlot(heroId: string, skillId: string): Promise<void> {
    const response = await this.client.send({ type: 'DEACTIVATE_SKILL', heroId, skillId });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao remover skill', 'info');
      return;
    }
    await Promise.all([this.loadSkillTree(heroId), this.loadAscensionTree(heroId)]);
    this.afterMutation(response.state);
  }

  private async equipSkillFirstAvailable(heroId: string, skillId: string): Promise<void> {
    const response = await this.client.send({
      type: 'ASSIGN_SKILL_SLOT',
      heroId,
      skillId,
      slotIndex: -1,
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao equipar skill', 'info');
      return;
    }
    await Promise.all([this.loadSkillTree(heroId), this.loadAscensionTree(heroId)]);
    this.afterMutation(response.state);
  }

  async confirmAndAscend(heroId: string, ascensionId: string, hero: HeroDto): Promise<void> {
    const option = this.ascensionOptions.find((entry) => entry.id === ascensionId);
    if (!option?.canAscend) return;

    const confirmed = await this.ascendClassConfirmDialog.open({
      hero,
      option,
      isUpgrade: Boolean(hero.ascensionId),
    });
    if (!confirmed) return;

    await this.ascendClass(heroId, ascensionId);
  }

  private async ascendClass(heroId: string, ascensionId: string): Promise<void> {
    const response = await this.client.send({ type: 'ASCEND_CLASS', heroId, ascensionId });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha na ascensão', 'info');
      return;
    }
    await this.loadAscensionTree(heroId);
    this.heroDetailModal.setActiveTab('class');
    this.afterMutation(response.state);
    const hero = response.state.heroes.find((entry) => entry.id === heroId);
    if (hero) {
      this.rewards.celebrateAscension(hero);
    }
  }

  private async allocateAscensionSkill(heroId: string, skillId: string): Promise<void> {
    const response = await this.client.send({
      type: 'SPEND_ASCENSION_POINT',
      heroId,
      skillId,
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha na skill de ascensão', 'info');
      return;
    }
    await this.loadAscensionTree(heroId);
    this.afterMutation(response.state);
  }
}
