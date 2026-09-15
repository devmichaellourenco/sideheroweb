import { GameMusicTrackId, getGameMusicTrackUrl } from './GameMusicCatalog';

export type GameMusicPreferences = {
  enabled: boolean;
  volume: number;
};

export type GameMusicSyncOptions = {
  /** false durante splash ou painel desativado. */
  active: boolean;
};

const FADE_MS = 900;
const DEFAULT_VOLUME = 0.55;

type AudioFactory = () => HTMLAudioElement;

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, volume));
}

function createDefaultAudio(): HTMLAudioElement {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = true;
  return audio;
}

export class GameMusicController {
  private readonly players = new Map<GameMusicTrackId, HTMLAudioElement>();
  private readonly failedTracks = new Set<GameMusicTrackId>();
  private currentTrack: GameMusicTrackId | null = null;
  private unlocked = false;
  private pausedByVisibility = false;
  private preferences: GameMusicPreferences = {
    enabled: true,
    volume: DEFAULT_VOLUME,
  };
  private fadeFrame: number | null = null;
  private fadeStartedAt = 0;
  private fadeFrom: HTMLAudioElement | null = null;
  private fadeTo: HTMLAudioElement | null = null;
  private fadeFromStartVolume = 0;
  private fadeToTargetVolume = 0;

  constructor(private readonly createAudio: AudioFactory = createDefaultAudio) {}

  bindUnlock(target: Document | HTMLElement = document): () => void {
    const unlock = () => {
      this.unlocked = true;
      void this.resumeCurrent();
    };

    target.addEventListener('pointerdown', unlock);
    return () => target.removeEventListener('pointerdown', unlock);
  }

  setPreferences(preferences: Partial<GameMusicPreferences>): void {
    this.preferences = {
      enabled: preferences.enabled ?? this.preferences.enabled,
      volume: clampVolume(preferences.volume ?? this.preferences.volume),
    };

    for (const player of this.players.values()) {
      if (player !== this.fadeFrom) {
        player.volume = this.preferences.enabled ? this.preferences.volume : 0;
      }
    }

    if (!this.preferences.enabled) {
      this.stopFade();
      this.pauseAll();
      this.currentTrack = null;
      return;
    }

    if (this.currentTrack) {
      void this.resumeCurrent();
    }
  }

  onVisibilityHidden(): void {
    this.pausedByVisibility = true;
    this.pauseAll();
  }

  onVisibilityVisible(): void {
    this.pausedByVisibility = false;
    void this.resumeCurrent();
  }

  sync(track: GameMusicTrackId | null, options: GameMusicSyncOptions): void {
    if (!options.active || !this.preferences.enabled || !this.unlocked || this.pausedByVisibility) {
      this.stopAll();
      return;
    }

    if (!track) {
      this.stopAll();
      return;
    }

    if (track === this.currentTrack) {
      void this.resumeCurrent();
      return;
    }

    void this.crossfadeTo(track);
  }

  getCurrentTrack(): GameMusicTrackId | null {
    return this.currentTrack;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  private stopAll(): void {
    this.stopFade();
    this.pauseAll();
    this.currentTrack = null;
  }

  private pauseAll(): void {
    for (const player of this.players.values()) {
      player.pause();
    }
  }

  private async resumeCurrent(): Promise<void> {
    if (
      !this.currentTrack ||
      !this.preferences.enabled ||
      !this.unlocked ||
      this.pausedByVisibility
    ) {
      return;
    }

    const player = await this.ensurePlayer(this.currentTrack);
    if (!player) return;

    player.volume = this.preferences.volume;
    try {
      await player.play();
    } catch {
      // Autoplay bloqueado ou asset ausente — fail silent.
    }
  }

  private async crossfadeTo(track: GameMusicTrackId): Promise<void> {
    const nextPlayer = await this.ensurePlayer(track);
    if (!nextPlayer) {
      this.currentTrack = null;
      return;
    }

    const previousTrack = this.currentTrack;
    const previousPlayer = previousTrack ? this.players.get(previousTrack) ?? null : null;

    this.currentTrack = track;
    this.stopFade();

    nextPlayer.volume = 0;
    try {
      await nextPlayer.play();
    } catch {
      this.currentTrack = previousTrack;
      return;
    }

    if (!previousPlayer || previousPlayer === nextPlayer) {
      nextPlayer.volume = this.preferences.volume;
      return;
    }

    this.fadeFrom = previousPlayer;
    this.fadeTo = nextPlayer;
    this.fadeFromStartVolume = previousPlayer.volume;
    this.fadeToTargetVolume = this.preferences.volume;
    this.fadeStartedAt = performance.now();
    this.animateFade();
  }

  private animateFade(): void {
    const from = this.fadeFrom;
    const to = this.fadeTo;
    if (!from || !to) return;

    const elapsed = performance.now() - this.fadeStartedAt;
    const progress = Math.min(1, elapsed / FADE_MS);
    from.volume = this.fadeFromStartVolume * (1 - progress);
    to.volume = this.fadeToTargetVolume * progress;

    if (progress >= 1) {
      from.pause();
      from.currentTime = 0;
      from.volume = 0;
      to.volume = this.fadeToTargetVolume;
      this.fadeFrom = null;
      this.fadeTo = null;
      this.fadeFrame = null;
      return;
    }

    this.fadeFrame = requestAnimationFrame(() => this.animateFade());
  }

  private stopFade(): void {
    if (this.fadeFrame !== null) {
      cancelAnimationFrame(this.fadeFrame);
      this.fadeFrame = null;
    }

    if (this.fadeFrom) {
      this.fadeFrom.pause();
      this.fadeFrom.currentTime = 0;
      this.fadeFrom.volume = 0;
    }

    this.fadeFrom = null;
    this.fadeTo = null;
  }

  private async ensurePlayer(track: GameMusicTrackId): Promise<HTMLAudioElement | null> {
    if (this.failedTracks.has(track)) return null;

    let player = this.players.get(track);
    if (player) return player;

    player = this.createAudio();
    player.src = getGameMusicTrackUrl(track);

    player.addEventListener(
      'error',
      () => {
        this.failedTracks.add(track);
        this.players.delete(track);
        if (this.currentTrack === track) {
          this.currentTrack = null;
        }
      },
      { once: true },
    );

    this.players.set(track, player);
    return player;
  }
}
