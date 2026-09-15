import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

export const SPLASH_SCREEN_MIN_VISIBLE_MS = 5000;
export const SPLASH_SCREEN_FADE_MS = 450;

export interface SplashScreenPlayOptions {
  minVisibleMs?: number;
  fadeMs?: number;
}

/**
 * Splash full-bleed na abertura do painel principal — termina antes do loop de batalha.
 */
export class SplashScreenController {
  private finished = false;
  private readonly waitResolvers: Array<() => void> = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly image: HTMLImageElement,
  ) {}

  isActive(): boolean {
    return !this.finished && !this.root.classList.contains('hidden');
  }

  dismissImmediate(): void {
    this.finished = true;
    this.interruptWaits();
    this.root.classList.add('hidden');
    this.root.classList.remove('splash-screen-root--fading');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('splash-screen-open');
  }

  async play(options: SplashScreenPlayOptions = {}): Promise<void> {
    if (this.finished) return;

    const minVisibleMs = options.minVisibleMs ?? SPLASH_SCREEN_MIN_VISIBLE_MS;
    const fadeMs = options.fadeMs ?? SPLASH_SCREEN_FADE_MS;
    const src = getAssetUrl(ASSETS.ui.splashScreen);

    document.body.classList.add('splash-screen-open');
    this.root.classList.remove('hidden', 'splash-screen-root--fading');
    this.root.setAttribute('aria-hidden', 'false');

    const startedAt = Date.now();
    await this.loadImage(src);
    if (this.finished) return;

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minVisibleMs - elapsed);
    if (remaining > 0) {
      await this.waitMs(remaining);
    }
    if (this.finished) return;

    this.root.classList.add('splash-screen-root--fading');
    await this.waitMs(fadeMs);
    if (this.finished) return;

    this.dismissImmediate();
  }

  private interruptWaits(): void {
    const resolvers = this.waitResolvers.splice(0, this.waitResolvers.length);
    for (const resolve of resolvers) {
      resolve();
    }
  }

  private waitMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.finished) {
        resolve();
        return;
      }

      const done = () => {
        window.clearTimeout(timer);
        const index = this.waitResolvers.indexOf(done);
        if (index >= 0) this.waitResolvers.splice(index, 1);
        resolve();
      };

      this.waitResolvers.push(done);
      const timer = window.setTimeout(done, ms);
    });
  }

  private loadImage(src: string): Promise<void> {
    if (!src) return Promise.resolve();

    return new Promise((resolve) => {
      const settle = () => {
        this.image.removeEventListener('load', settle);
        this.image.removeEventListener('error', settle);
        const index = this.waitResolvers.indexOf(settle);
        if (index >= 0) this.waitResolvers.splice(index, 1);
        resolve();
      };

      if (this.finished) {
        settle();
        return;
      }

      if (this.image.getAttribute('src') === src && this.image.complete) {
        settle();
        return;
      }

      this.waitResolvers.push(settle);
      this.image.addEventListener('load', settle, { once: true });
      this.image.addEventListener('error', settle, { once: true });
      this.image.src = src;

      if (this.image.complete) {
        settle();
      }
    });
  }
}
