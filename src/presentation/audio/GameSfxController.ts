import { GameUiClickSfxId, getGameUiClickSfxUrl } from './GameSfxCatalog';
import { resolveUiClickSfx } from './resolveUiClickSfx';

export type GameSfxPreferences = {
  enabled: boolean;
  volume: number;
};

const DEFAULT_VOLUME = 0.75;

type AudioFactory = () => HTMLAudioElement;

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, volume));
}

function createDefaultAudio(): HTMLAudioElement {
  const audio = new Audio();
  audio.preload = 'auto';
  return audio;
}

export class GameSfxController {
  private unlocked = false;
  private preferences: GameSfxPreferences = {
    enabled: true,
    volume: DEFAULT_VOLUME,
  };
  private readonly failedIds = new Set<GameUiClickSfxId>();

  constructor(private readonly createAudio: AudioFactory = createDefaultAudio) {}

  bindUnlock(target: Document | HTMLElement = document): () => void {
    const unlock = () => {
      this.unlocked = true;
    };

    target.addEventListener('pointerdown', unlock);
    return () => target.removeEventListener('pointerdown', unlock);
  }

  bindUiClicks(
    target: Document | HTMLElement = document,
    options: { active?: () => boolean } = {},
  ): () => void {
    const onClick = (event: MouseEvent) => {
      if (options.active && !options.active()) return;
      if (event.defaultPrevented) return;

      const sfxId = resolveUiClickSfx(event.target);
      if (!sfxId) return;

      this.play(sfxId);
    };

    target.addEventListener('click', onClick, true);
    return () => target.removeEventListener('click', onClick, true);
  }

  setPreferences(preferences: Partial<GameSfxPreferences>): void {
    this.preferences = {
      enabled: preferences.enabled ?? this.preferences.enabled,
      volume: clampVolume(preferences.volume ?? this.preferences.volume),
    };
  }

  play(sfxId: GameUiClickSfxId): void {
    if (!this.preferences.enabled || !this.unlocked || this.failedIds.has(sfxId)) return;

    const audio = this.createAudio();
    audio.volume = this.preferences.volume;
    audio.src = getGameUiClickSfxUrl(sfxId);

    audio.addEventListener(
      'error',
      () => {
        this.failedIds.add(sfxId);
      },
      { once: true },
    );

    void audio.play().catch(() => {
      // Autoplay bloqueado ou asset ausente — fail silent.
    });
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }
}
