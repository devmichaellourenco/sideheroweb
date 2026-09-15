import { RewardMoment } from '../delight/types/RewardMoment';
import type { UiOverlayOrchestrator } from '../overlays/UiOverlayOrchestrator';
import { isCelebrationMoment } from './WowCelebrationPolicy';
import { resolveWowBannerCta } from './WowBannerCtaPresentation';
import { mapRewardMomentToWowBanner } from './WowMomentMapper';
import { filterUndismissedBanners, recordWowBannerDismiss } from './WowStripDismissStore';
import { WowStripRenderer } from './WowStripRenderer';
import { buildWowStripSnapshot } from './WowStripRenderPolicy';
import { WowBanner, WowBannerAction } from './types/WowBanner';

const EPHEMERAL_DEFAULT_MS = 5200;

export class WowCelebrationController {
  private readonly renderer = new WowStripRenderer();
  private readonly inbox: WowBanner[] = [];
  private readonly displayQueue: WowBanner[] = [];
  private activeCelebration: WowBanner | null = null;
  private inboxOpen = false;
  private inboxActiveIndex = 0;
  private celebrationTimer: number | null = null;
  private celebrationSnapshot: string | null = null;
  private inboxSnapshot: string | null = null;
  private lastCelebrationBannerId: string | null = null;
  private idleListeners: Array<() => void> = [];
  private overlayOrchestrator: UiOverlayOrchestrator | null = null;

  constructor(
    private readonly celebrationRoot: HTMLElement,
    private readonly celebrationStage: HTMLElement,
    private readonly inboxRoot: HTMLElement,
    private readonly inboxPanel: HTMLElement,
    private readonly inboxButton: HTMLButtonElement,
  ) {
    this.celebrationRoot.addEventListener('click', (event) => this.handleCelebrationClick(event));
    this.inboxPanel.addEventListener('click', (event) => this.handleInboxClick(event));
    this.inboxButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleInbox();
    });

    document.addEventListener('click', (event) => {
      if (!this.inboxOpen) return;
      const target = event.target as HTMLElement;
      if (
        this.inboxRoot.contains(target) ||
        this.inboxButton.contains(target)
      ) {
        return;
      }
      this.closeInbox();
    });
  }

  /** Liga o gate global — celebrações centrais esperam outros overlays. */
  setOverlayOrchestrator(orchestrator: UiOverlayOrchestrator | null): void {
    this.overlayOrchestrator = orchestrator;
  }

  enqueueMoment(moment: RewardMoment): void {
    if (!isCelebrationMoment(moment)) return;

    const banner = mapRewardMomentToWowBanner(moment);
    if (!banner) return;

    if (moment.cta) {
      banner.cta = {
        label: moment.cta.label,
        action: 'dismiss',
      };
      banner.onCtaClick = moment.cta.onClick;
    }

    if (this.inbox.some((entry) => entry.id === banner.id)) return;

    this.inbox.push(banner);
    this.inbox.sort((left, right) => right.priority - left.priority);
    this.displayQueue.push(banner);
    this.displayQueue.sort((left, right) => right.priority - left.priority);

    this.updateInboxChrome();
    this.pumpCelebrationQueue();
  }

  /**
   * Atualiza pendências persistentes no inbox (✦) sem abrir celebração central.
   * Ephemeral em curso / na fila são preservados.
   */
  syncPersistentBanners(banners: WowBanner[]): void {
    const nextPersistent = filterUndismissedBanners(
      banners.filter((banner) => banner.persistence === 'persistent'),
    );
    const ephemeral = this.inbox.filter((banner) => banner.persistence !== 'persistent');

    this.inbox.length = 0;
    this.inbox.push(...nextPersistent, ...ephemeral);
    this.inbox.sort((left, right) => right.priority - left.priority);

    this.clampInboxIndex();
    this.updateInboxChrome();
    if (this.inboxOpen) {
      this.renderInbox(true);
    }
  }

  isBlockingAdvance(): boolean {
    return this.activeCelebration !== null;
  }

  onIdle(listener: () => void): void {
    this.idleListeners.push(listener);
  }

  destroy(): void {
    this.stopCelebrationTimer();
  }

  toggleInbox(): void {
    if (this.inboxOpen) {
      this.closeInbox();
      return;
    }
    this.openInbox();
  }

  private openInbox(): void {
    if (this.inbox.length === 0) return;

    this.inboxOpen = true;
    this.inboxRoot.classList.remove('hidden');
    this.inboxRoot.setAttribute('aria-hidden', 'false');
    this.inboxButton.classList.add('stat-pill--wow-inbox-open');
    this.inboxButton.setAttribute('aria-expanded', 'true');
    this.clampInboxIndex();
    this.renderInbox(true);
  }

  private closeInbox(): void {
    this.inboxOpen = false;
    this.inboxRoot.classList.add('hidden');
    this.inboxRoot.setAttribute('aria-hidden', 'true');
    this.inboxButton.classList.remove('stat-pill--wow-inbox-open');
    this.inboxButton.setAttribute('aria-expanded', 'false');
  }

  private pumpCelebrationQueue(): void {
    if (this.activeCelebration || this.displayQueue.length === 0) return;

    const present = () => {
      if (this.activeCelebration || this.displayQueue.length === 0) {
        this.overlayOrchestrator?.release('wow', 'wow-display', { notifyIdle: false });
        return;
      }
      const banner = this.displayQueue.shift()!;
      this.showCelebration(banner);
    };

    if (this.overlayOrchestrator) {
      this.overlayOrchestrator.request('wow', 'wow-display', present);
      return;
    }

    present();
  }

  private showCelebration(banner: WowBanner): void {
    this.activeCelebration = banner;
    this.celebrationRoot.classList.remove('hidden');
    this.celebrationRoot.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wow-celebration-open');
    this.renderCelebration(true);
    this.scheduleCelebrationExpiry(banner);
  }

  private finishCelebration(): void {
    this.stopCelebrationTimer();
    this.activeCelebration = null;
    this.celebrationRoot.classList.add('hidden');
    this.celebrationRoot.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wow-celebration-open');
    this.celebrationStage.innerHTML = '';
    this.celebrationSnapshot = null;
    this.overlayOrchestrator?.release('wow', 'wow-display');
    this.pumpCelebrationQueue();
    this.notifyIdleIfReady();
  }

  private notifyIdleIfReady(): void {
    if (this.activeCelebration || this.displayQueue.length > 0) return;

    for (const listener of this.idleListeners) {
      listener();
    }
  }

  private handleCelebrationClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (target.closest('[data-wow-celebration-close]')) {
      event.preventDefault();
      this.dismissActiveCelebration();
      return;
    }

    this.handleBannerInteraction(target, this.activeCelebration, () => {
      this.dismissActiveCelebration();
    });
  }

  private handleInboxClick(event: Event): void {
    const target = event.target as HTMLElement;
    const active = this.inbox[this.inboxActiveIndex];

    const dot = target.closest('[data-wow-dot]') as HTMLElement | null;
    if (dot) {
      const index = Number(dot.getAttribute('data-wow-dot'));
      if (!Number.isNaN(index)) {
        this.inboxActiveIndex = index;
        this.renderInbox(true);
      }
      return;
    }

    this.handleBannerInteraction(target, active, () => {
      if (active) this.removeFromInbox(active);
    });
  }

  private handleBannerInteraction(
    target: HTMLElement,
    active: WowBanner | null,
    onDismiss: () => void,
  ): void {
    if (!active) return;

    const dismissEl = target.closest('[data-wow-dismiss]');
    if (dismissEl) {
      onDismiss();
      return;
    }

    const actionEl = target.closest('[data-wow-action]') as HTMLElement | null;
    if (actionEl) {
      const action = actionEl.getAttribute('data-wow-action') as WowBannerAction | null;
      if (!action) return;

      if (active.onCtaClick) {
        active.onCtaClick();
      }

      if (action === 'dismiss') {
        onDismiss();
      } else if (active.persistence === 'persistent' && active.onCtaClick) {
        this.closeInbox();
      }
      return;
    }

    const bannerEl = target.closest('[data-wow-banner-id]');
    const cta = resolveWowBannerCta(active);
    if (bannerEl && !actionEl) {
      if (active.onCtaClick) {
        active.onCtaClick();
        if (active.persistence === 'persistent') {
          this.closeInbox();
        }
      } else if (cta.action === 'dismiss') {
        onDismiss();
      }
    }
  }

  private dismissActiveCelebration(): void {
    if (!this.activeCelebration) {
      this.finishCelebration();
      return;
    }

    this.finishCelebration();
    this.updateInboxChrome();
    if (this.inboxOpen) {
      this.renderInbox(true);
    }
  }

  private removeFromInbox(banner: WowBanner): void {
    recordWowBannerDismiss(banner);
    const index = this.inbox.findIndex((entry) => entry.id === banner.id);
    if (index !== -1) {
      this.inbox.splice(index, 1);
    }
    this.clampInboxIndex();
    this.updateInboxChrome();
    this.renderInbox(true);

    if (this.inbox.length === 0) {
      this.closeInbox();
    }
  }

  private clampInboxIndex(): void {
    if (this.inbox.length === 0) {
      this.inboxActiveIndex = 0;
      return;
    }
    if (this.inboxActiveIndex >= this.inbox.length) {
      this.inboxActiveIndex = 0;
    }
  }

  private renderCelebration(force = false): void {
    if (!this.activeCelebration) return;

    const snapshot = buildWowStripSnapshot([this.activeCelebration], 0);
    if (!force && snapshot === this.celebrationSnapshot) return;

    const animate = this.activeCelebration.id !== this.lastCelebrationBannerId;
    this.renderer.render(this.celebrationStage, [this.activeCelebration], 0, {
      animate,
      variant: 'center',
    });
    this.celebrationSnapshot = snapshot;
    this.lastCelebrationBannerId = this.activeCelebration.id;
  }

  private renderInbox(force = false): void {
    const snapshot = buildWowStripSnapshot(this.inbox, this.inboxActiveIndex);
    if (!force && snapshot === this.inboxSnapshot) return;

    this.renderer.render(this.inboxPanel, this.inbox, this.inboxActiveIndex, {
      animate: force,
      variant: 'compact',
    });
    this.inboxSnapshot = snapshot;
  }

  private updateInboxChrome(): void {
    const count = this.inbox.length;
    const countEl = this.inboxButton.querySelector('.wow-inbox-btn-count');

    this.inboxButton.classList.toggle('hidden', count === 0);
    this.inboxButton.disabled = count === 0;
    this.inboxButton.title =
      count > 0 ? `Celebrações e pendências (${count})` : 'Sem celebrações recentes';

    if (countEl) {
      countEl.textContent = count > 0 ? String(count) : '';
    }

    if (count === 0) {
      this.closeInbox();
      this.inboxPanel.innerHTML = '';
      this.inboxSnapshot = null;
    }
  }

  private scheduleCelebrationExpiry(banner: WowBanner): void {
    this.stopCelebrationTimer();
    const duration = banner.displayMs ?? EPHEMERAL_DEFAULT_MS;
    this.celebrationTimer = window.setTimeout(() => {
      if (this.activeCelebration?.id === banner.id) {
        this.dismissActiveCelebration();
      }
    }, duration);
  }

  private stopCelebrationTimer(): void {
    if (this.celebrationTimer === null) return;
    window.clearTimeout(this.celebrationTimer);
    this.celebrationTimer = null;
  }
}
