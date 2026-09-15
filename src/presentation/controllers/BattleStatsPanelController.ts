import type { BattleStatsTabId } from '../components/BattleStatsPresentation';
import { bindBarTooltips } from '../components/BarTooltipBinder';

const VISIBLE_KEY = 'sidehero_battle_stats_visible';
const TAB_KEY = 'sidehero_battle_stats_tab';
const TAB_IDS: readonly BattleStatsTabId[] = [
  'general',
  'damage',
  'healing',
  'taken',
  'mitigated',
  'crits',
];

function isBattleStatsTabId(value: string | null | undefined): value is BattleStatsTabId {
  return Boolean(value && (TAB_IDS as readonly string[]).includes(value));
}

export class BattleStatsPanelController {
  private visible = false;
  private activeTab: BattleStatsTabId = 'general';

  constructor(
    private readonly overlay: HTMLElement,
    private readonly toggleBtn: HTMLButtonElement,
    closeBtn: HTMLButtonElement,
    private readonly bodyEl: HTMLElement,
  ) {
    this.visible = this.readVisiblePreference();
    this.activeTab = this.readTabPreference();
    closeBtn.addEventListener('click', () => this.hide());

    overlay.querySelectorAll('[data-battle-stats-close]').forEach((element) => {
      element.addEventListener('click', () => this.hide());
    });

    this.bodyEl.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const tabBtn = target?.closest('[data-battle-stats-tab]') as HTMLElement | null;
      if (!tabBtn) return;
      const tab = tabBtn.getAttribute('data-battle-stats-tab');
      if (!isBattleStatsTabId(tab) || tab === this.activeTab) return;
      this.activeTab = tab;
      this.writeTabPreference(tab);
      this.applyActiveTab();
    });

    this.applyVisibility();
  }

  private readVisiblePreference(): boolean {
    try {
      return sessionStorage.getItem(VISIBLE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeVisiblePreference(visible: boolean): void {
    try {
      sessionStorage.setItem(VISIBLE_KEY, visible ? '1' : '0');
    } catch {
      // sessionStorage indisponível
    }
  }

  private readTabPreference(): BattleStatsTabId {
    try {
      const raw = sessionStorage.getItem(TAB_KEY);
      return isBattleStatsTabId(raw) ? raw : 'general';
    } catch {
      return 'general';
    }
  }

  private writeTabPreference(tab: BattleStatsTabId): void {
    try {
      sessionStorage.setItem(TAB_KEY, tab);
    } catch {
      // sessionStorage indisponível
    }
  }

  toggle(): void {
    this.visible = !this.visible;
    this.writeVisiblePreference(this.visible);
    this.applyVisibility();
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.writeVisiblePreference(true);
    this.applyVisibility();
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.writeVisiblePreference(false);
    this.applyVisibility();
  }

  isVisible(): boolean {
    return this.visible;
  }

  getActiveTab(): BattleStatsTabId {
    return this.activeTab;
  }

  setContent(html: string): void {
    this.bodyEl.innerHTML = html;
    this.applyActiveTab();
    bindBarTooltips(this.bodyEl);
  }

  private applyActiveTab(): void {
    this.bodyEl.querySelectorAll('[data-battle-stats-tab]').forEach((button) => {
      const tab = button.getAttribute('data-battle-stats-tab');
      const active = tab === this.activeTab;
      button.classList.toggle('battle-stats-tab--active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    this.bodyEl.querySelectorAll('[data-battle-stats-tab-panel]').forEach((panel) => {
      const tab = panel.getAttribute('data-battle-stats-tab-panel');
      const active = tab === this.activeTab;
      panel.classList.toggle('hidden', !active);
      if (active) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  private applyVisibility(): void {
    this.overlay.classList.toggle('hidden', !this.visible);
    this.overlay.setAttribute('aria-hidden', this.visible ? 'false' : 'true');
    this.toggleBtn.classList.toggle('action-icon-btn--active', this.visible);
    this.toggleBtn.setAttribute('aria-expanded', this.visible ? 'true' : 'false');
  }
}
