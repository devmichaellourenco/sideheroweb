import { AscensionOptionDto } from '../../application/dto/AscensionOptionDto';
import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { SkillNodeDto } from '../../application/dto/SkillNodeDto';
import { bindBarTooltips } from './BarTooltipBinder';
import { bindAscensionMomentTooltips, hideAscensionMomentTooltip } from './HeroAscensionMomentTooltipBinder';
import {
  bindAscensionPathCardTooltips,
  hideAscensionPathCardTooltip,
} from './AscensionPathCardTooltipBinder';
import { bindEquipmentTooltips } from './EquipmentTooltipBinder';
import { bindHeroImprovementTooltips, hideHeroImprovementTooltip } from './HeroImprovementTooltipBinder';
import { bindHeroStatTooltips } from './HeroStatTooltipBinder';
import { bindSkillChipTooltips } from './SkillChipTooltipBinder';
import { bindSkillSlotAssignment } from '../skills/SkillSlotAssignmentBinder';
import {
  captureHeroDetailScroll,
  restoreHeroDetailScroll,
  type HeroDetailScrollState,
} from './hero-detail/HeroDetailScrollPresentation';
import { renderHeroAttributesTab } from './hero-detail/HeroAttributesTabRenderer';
import { renderHeroClassTab } from './hero-detail/HeroClassTabRenderer';
import { renderHeroDetailHeader } from './hero-detail/HeroDetailHeaderRenderer';
import { renderHeroSheetTab } from './hero-detail/HeroSheetTabRenderer';
import { renderHeroSkillsTab } from './hero-detail/HeroSkillsTabRenderer';
import { renderHeroLoadoutStrip } from './HeroLoadoutStripPresentation';
import { GearSlotKey } from './GearPresentation';

export type HeroDetailTab = 'sheet' | 'attributes' | 'skills' | 'class';

export type HeroDetailModalHandlers = {
  onSlotClick: (heroId: string, slot: string) => void;
  onSpendAttribute: (heroId: string, attr: 'str' | 'dex' | 'int') => void;
  onRefundAttribute: (heroId: string, attr: 'str' | 'dex' | 'int') => void;
  onAllocateSkill: (heroId: string, skillId: string) => void;
  onRefundSkill: (heroId: string, skillId: string) => void;
  onMassRefund: (heroId: string) => void;
  onAssignSkillSlot: (heroId: string, skillId: string, slotIndex: number) => void;
  onClearSkillSlot: (heroId: string, skillId: string) => void;
  onEquipSkillFirstAvailable: (heroId: string, skillId: string) => void;
  onAscendClass: (heroId: string, ascensionId: string) => void;
  onAllocateAscensionSkill: (heroId: string, skillId: string) => void;
  onTabChange: (heroId: string, tab: HeroDetailTab) => void;
  onMountInventory?: (host: HTMLElement) => void;
};

export class HeroDetailModalRenderer {
  private activeTab: HeroDetailTab = 'sheet';
  private skillNodes: SkillNodeDto[] = [];
  private ascensionOptions: AscensionOptionDto[] = [];
  private ascensionName: string | null = null;
  private ascensionSkillNodes: SkillNodeDto[] = [];
  private preservedScrollState: HeroDetailScrollState | null = null;
  private inlineActiveSlot: { heroId: string; slot: GearSlotKey } | null = null;

  setInlineActiveSlot(slot: { heroId: string; slot: GearSlotKey } | null): void {
    this.inlineActiveSlot = slot;
  }

  setSkillNodes(nodes: SkillNodeDto[]): void {
    this.skillNodes = nodes;
  }

  setAscensionData(
    options: AscensionOptionDto[],
    ascensionName: string | null,
    ascensionSkillNodes: SkillNodeDto[],
  ): void {
    this.ascensionOptions = options;
    this.ascensionName = ascensionName;
    this.ascensionSkillNodes = ascensionSkillNodes;
  }

  setActiveTab(tab: HeroDetailTab): void {
    this.activeTab = tab;
  }

  getActiveTab(): HeroDetailTab {
    return this.activeTab;
  }

  render(
    container: HTMLElement,
    state: GameStateDto,
    heroId: string,
    handlers: HeroDetailModalHandlers,
  ): void {
    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      container.innerHTML = '<p class="empty-state">Herói não encontrado.</p>';
      return;
    }

    const badge = hero.hasUnspentPoints
      ? '<span class="inventory-upgrade-badge">!</span>'
      : '';

    const showGearLoadout = this.activeTab === 'sheet';
    const showSkillsLoadout = this.activeTab === 'skills';
    const equipPickerMode =
      showGearLoadout &&
      this.inlineActiveSlot !== null &&
      this.inlineActiveSlot.heroId === hero.id;
    const loadoutSection = showGearLoadout
      ? `
        <div class="hero-detail-loadout">
          ${renderHeroLoadoutStrip(hero, {
            variant: 'featured',
            skillSlotMode: 'skills-tab',
            heroId: hero.id,
            showSkills: false,
            showGear: true,
            activeEquipSlot: equipPickerMode ? this.inlineActiveSlot?.slot : undefined,
            equipPickerMode,
          })}
          <div class="inline-equip-host hidden" data-inline-equip-host aria-live="polite"></div>
        </div>
      `
      : showSkillsLoadout
        ? `
        <div class="hero-detail-loadout">
          ${renderHeroLoadoutStrip(hero, {
            variant: 'featured',
            skillSlotMode: 'skills-tab',
            heroId: hero.id,
            showSkills: true,
            showGear: false,
          })}
        </div>
      `
        : '';

    const scrollState = this.preservedScrollState ?? captureHeroDetailScroll(container);

    hideHeroImprovementTooltip();
    hideAscensionMomentTooltip();
    hideAscensionPathCardTooltip();

    container.innerHTML = `
      <div class="hero-detail-layout">
        <header class="hero-detail-header">${renderHeroDetailHeader(hero, this.ascensionName)}</header>
        <nav class="hero-detail-tabs">
          <button type="button" class="hero-tab ${this.activeTab === 'sheet' ? 'active' : ''}" data-hero-tab="sheet">Inventário</button>
          <button type="button" class="hero-tab ${this.activeTab === 'attributes' ? 'active' : ''}" data-hero-tab="attributes">Status${badge}</button>
          <button type="button" class="hero-tab ${this.activeTab === 'skills' ? 'active' : ''}" data-hero-tab="skills">Skills${badge}</button>
          <button type="button" class="hero-tab ${this.activeTab === 'class' ? 'active' : ''}" data-hero-tab="class">Classe</button>
        </nav>
        ${loadoutSection}
        <div class="hero-detail-panel game-scroll">${this.renderTabContent(hero, state)}</div>
      </div>
    `;

    this.bindInteractions(container, hero, handlers);
    bindBarTooltips(container);
    bindEquipmentTooltips(container);
    bindSkillChipTooltips(container);
    bindHeroImprovementTooltips(container);
    bindAscensionMomentTooltips(container);
    if (this.activeTab === 'class') {
      bindAscensionPathCardTooltips(container);
    }
    if (this.activeTab === 'attributes') {
      bindHeroStatTooltips(container);
    }
    if (this.activeTab === 'sheet' && handlers.onMountInventory) {
      const inventoryHost = container.querySelector('[data-hero-inventory-host]');
      if (inventoryHost) {
        handlers.onMountInventory(inventoryHost as HTMLElement);
      }
    }
    this.restoreScrollAfterRender(container, scrollState);
  }

  private restoreScrollAfterRender(
    container: HTMLElement,
    scrollState: ReturnType<typeof captureHeroDetailScroll>,
  ): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoreHeroDetailScroll(container, scrollState);
        this.preservedScrollState = null;
      });
    });
  }

  private pinScrollBeforeMutation(container: HTMLElement): void {
    this.preservedScrollState = captureHeroDetailScroll(container);
  }

  private renderTabContent(hero: HeroDto, state: GameStateDto): string {
    switch (this.activeTab) {
      case 'attributes':
        return renderHeroAttributesTab(hero, state.featureFlags);
      case 'skills':
        return renderHeroSkillsTab(
          hero,
          this.skillNodes,
          this.ascensionSkillNodes,
          state.featureFlags,
        );
      case 'class':
        return renderHeroClassTab({
          hero,
          options: this.ascensionOptions,
          ascensionName: this.ascensionName,
        });
      default:
        return renderHeroSheetTab();
    }
  }

  private bindInteractions(
    container: HTMLElement,
    hero: HeroDto,
    handlers: HeroDetailModalHandlers,
  ): void {
    container.querySelectorAll('[data-hero-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-hero-tab') as HeroDetailTab;
        if (tab) handlers.onTabChange(hero.id, tab);
      });
    });

    container.querySelectorAll('[data-attr-spend]').forEach((button) => {
      button.addEventListener('click', () => {
        const attr = button.getAttribute('data-attr-spend') as 'str' | 'dex' | 'int';
        if (attr && !(button as HTMLButtonElement).disabled) {
          this.pinScrollBeforeMutation(container);
          handlers.onSpendAttribute(hero.id, attr);
        }
      });
    });

    container.querySelectorAll('[data-attr-refund]').forEach((button) => {
      button.addEventListener('click', () => {
        const attr = button.getAttribute('data-attr-refund') as 'str' | 'dex' | 'int';
        if (attr && !(button as HTMLButtonElement).disabled) {
          this.pinScrollBeforeMutation(container);
          handlers.onRefundAttribute(hero.id, attr);
        }
      });
    });

    container.querySelectorAll('[data-skill-allocate]').forEach((button) => {
      button.addEventListener('click', () => {
        const skillId = button.getAttribute('data-skill-allocate');
        if (skillId && !(button as HTMLButtonElement).disabled) {
          this.pinScrollBeforeMutation(container);
          handlers.onAllocateSkill(hero.id, skillId);
        }
      });
    });

    container.querySelectorAll('[data-skill-refund]').forEach((button) => {
      button.addEventListener('click', () => {
        const skillId = button.getAttribute('data-skill-refund');
        if (skillId && !(button as HTMLButtonElement).disabled) {
          this.pinScrollBeforeMutation(container);
          handlers.onRefundSkill(hero.id, skillId);
        }
      });
    });

    container.querySelectorAll('[data-ascension-refund]').forEach((button) => {
      button.addEventListener('click', () => {
        const skillId = button.getAttribute('data-ascension-refund');
        if (skillId && !(button as HTMLButtonElement).disabled) {
          this.pinScrollBeforeMutation(container);
          handlers.onRefundSkill(hero.id, skillId);
        }
      });
    });

    container.querySelectorAll('[data-mass-refund]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!(button as HTMLButtonElement).disabled) {
          handlers.onMassRefund(hero.id);
        }
      });
    });

    if (this.activeTab === 'skills') {
      bindSkillSlotAssignment(container, {
        onAssign: (skillId, slotIndex) => {
          handlers.onAssignSkillSlot(hero.id, skillId, slotIndex);
        },
        onClear: (skillId) => {
          handlers.onClearSkillSlot(hero.id, skillId);
        },
        onEquipFirstAvailable: (skillId) => {
          handlers.onEquipSkillFirstAvailable(hero.id, skillId);
        },
      });
    }

    container.querySelectorAll('[data-ascension-select]').forEach((card) => {
      const triggerAscend = () => {
        const ascensionId = card.getAttribute('data-ascension-select');
        if (ascensionId) {
          handlers.onAscendClass(hero.id, ascensionId);
        }
      };

      card.addEventListener('click', () => {
        triggerAscend();
      });

      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        triggerAscend();
      });
    });

    container.querySelectorAll('[data-ascension-allocate]').forEach((button) => {
      button.addEventListener('click', () => {
        const skillId = button.getAttribute('data-ascension-allocate');
        if (skillId && !(button as HTMLButtonElement).disabled) {
          this.pinScrollBeforeMutation(container);
          handlers.onAllocateAscensionSkill(hero.id, skillId);
        }
      });
    });
  }
}
