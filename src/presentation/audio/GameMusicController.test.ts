// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameMusicController } from './GameMusicController';

class MockAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  loop = false;
  preload = '';
  private listeners = new Map<string, Set<() => void>>();

  play = vi.fn(async () => undefined);
  pause = vi.fn(() => undefined);

  addEventListener(type: string, listener: () => void, options?: { once?: boolean }): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
    if (options?.once) {
      const wrapped = () => {
        listener();
        this.removeEventListener(type, wrapped);
      };
      this.listeners.get(type)?.delete(listener);
      this.listeners.get(type)?.add(wrapped);
    }
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }
}

describe('GameMusicController', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback) => {
        callback(performance.now());
        return 1;
      },
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  it('nao toca antes do desbloqueio do autoplay', () => {
    const created: MockAudio[] = [];
    const controller = new GameMusicController(() => {
      const audio = new MockAudio();
      created.push(audio);
      return audio as unknown as HTMLAudioElement;
    });

    controller.setPreferences({ enabled: true, volume: 0.5 });
    controller.sync('camp', { active: true });

    expect(created).toHaveLength(0);
  });

  it('alterna trilhas apos desbloqueio', async () => {
    const created: MockAudio[] = [];
    const controller = new GameMusicController(() => {
      const audio = new MockAudio();
      created.push(audio);
      return audio as unknown as HTMLAudioElement;
    });

    controller.setPreferences({ enabled: true, volume: 0.6 });
    controller.bindUnlock(document);
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    controller.sync('camp', { active: true });
    await Promise.resolve();

    expect(created).toHaveLength(1);
    expect(created[0]?.play).toHaveBeenCalled();
    expect(controller.getCurrentTrack()).toBe('camp');

    controller.sync('battle', { active: true });
    await Promise.resolve();

    expect(created).toHaveLength(2);
    expect(controller.getCurrentTrack()).toBe('battle');
  });

  it('pausa com painel oculto e retoma ao voltar', async () => {
    const created: MockAudio[] = [];
    const controller = new GameMusicController(() => {
      const audio = new MockAudio();
      created.push(audio);
      return audio as unknown as HTMLAudioElement;
    });

    controller.setPreferences({ enabled: true, volume: 0.5 });
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    controller.sync('camp', { active: true });
    await Promise.resolve();

    controller.onVisibilityHidden();
    expect(created[0]?.pause).toHaveBeenCalled();

    controller.onVisibilityVisible();
    controller.sync('camp', { active: true });
    await Promise.resolve();
    expect(created[0]?.play).toHaveBeenCalledTimes(2);
  });

  it('silencia quando musica desativada', async () => {
    const created: MockAudio[] = [];
    const controller = new GameMusicController(() => {
      const audio = new MockAudio();
      created.push(audio);
      return audio as unknown as HTMLAudioElement;
    });

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    controller.setPreferences({ enabled: true, volume: 0.5 });
    controller.sync('camp', { active: true });
    await Promise.resolve();

    controller.setPreferences({ enabled: false, volume: 0.5 });
    controller.sync('camp', { active: true });

    expect(created[0]?.pause).toHaveBeenCalled();
    expect(controller.getCurrentTrack()).toBeNull();
  });
});
