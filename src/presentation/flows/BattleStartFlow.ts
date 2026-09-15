import { BattleVictoryOverlayRenderer } from '../components/BattleVictoryOverlayRenderer';
import { OVERLAY_ANIMATION_MS } from './BattleVictoryFlow';

/** Cue START antes do primeiro tick da missão. */
export class BattleStartFlow {
  private overlayVisible = false;
  private autoDismissTimer: number | null = null;
  private pendingDismissHandler: (() => void) | null = null;

  constructor(
    private readonly overlayEl: HTMLElement,
    private readonly battleStripEl: HTMLElement,
    private readonly renderer: BattleVictoryOverlayRenderer,
  ) {}

  isActive(): boolean {
    return this.overlayVisible;
  }

  isBlockingAdvance(): boolean {
    return this.overlayVisible;
  }

  show(onDismiss?: () => void): void {
    this.clearTimers();
    this.pendingDismissHandler = onDismiss ?? null;
    this.overlayVisible = true;
    this.renderer.renderStart(this.overlayEl);
    this.overlayEl.classList.remove('hidden');
    this.overlayEl.classList.remove('battle-victory-overlay--await-continue');
    this.battleStripEl.classList.add('battle-strip--victory');
    this.battleFieldEl()?.classList.add('battle-field--victory');

    const label = this.overlayEl.querySelector('.battle-victory-compact-label');
    if (label) {
      label.addEventListener('animationend', () => this.dismiss(), { once: true });
    }

    this.autoDismissTimer = globalThis.setTimeout(
      () => this.dismiss(),
      OVERLAY_ANIMATION_MS + 300,
    );
  }

  dismiss(): void {
    if (!this.overlayVisible) return;

    this.clearTimers();
    this.overlayVisible = false;
    this.hideOverlay();

    const handler = this.pendingDismissHandler;
    this.pendingDismissHandler = null;
    if (handler) {
      handler();
    }
  }

  private hideOverlay(): void {
    this.overlayEl.classList.add('hidden');
    this.overlayEl.innerHTML = '';
    this.battleStripEl.classList.remove('battle-strip--victory', 'battle-strip--milestone-victory');
    this.battleFieldEl()?.classList.remove(
      'battle-field--victory',
      'battle-field--milestone-victory',
    );
  }

  private battleFieldEl(): HTMLElement | null {
    const el = this.battleStripEl as HTMLElement & { closest?: (s: string) => Element | null };
    if (typeof el.closest !== 'function') return null;
    return el.closest('.battle-field');
  }

  private clearTimers(): void {
    if (this.autoDismissTimer !== null) {
      globalThis.clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }
}
