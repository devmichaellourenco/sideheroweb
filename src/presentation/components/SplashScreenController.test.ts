// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SPLASH_SCREEN_MIN_VISIBLE_MS,
  SplashScreenController,
} from './SplashScreenController';

function mountSplash(): { root: HTMLElement; image: HTMLImageElement } {
  const root = document.createElement('div');
  root.id = 'splash-screen-root';
  root.className = 'splash-screen-root';
  const image = document.createElement('img');
  image.id = 'splash-screen-image';
  image.className = 'splash-screen-image';
  root.appendChild(image);
  document.body.appendChild(root);
  return { root, image };
}

describe('SplashScreenController', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    vi.useRealTimers();
  });

  it('exibe e remove a splash após o tempo mínimo', async () => {
    vi.useFakeTimers();
    const { root, image } = mountSplash();
    const splash = new SplashScreenController(root, image);

    const playPromise = splash.play({ minVisibleMs: 100, fadeMs: 50 });
    expect(document.body.classList.contains('splash-screen-open')).toBe(true);
    expect(root.classList.contains('hidden')).toBe(false);

    // Simula load imediato da imagem
    image.dispatchEvent(new Event('load'));

    await vi.advanceTimersByTimeAsync(100);
    expect(root.classList.contains('splash-screen-root--fading')).toBe(true);

    await vi.advanceTimersByTimeAsync(50);
    await playPromise;

    expect(root.classList.contains('hidden')).toBe(true);
    expect(document.body.classList.contains('splash-screen-open')).toBe(false);
    expect(splash.isActive()).toBe(false);
  });

  it('dismissImmediate encerra sem esperar o timer', async () => {
    vi.useFakeTimers();
    const { root, image } = mountSplash();
    const splash = new SplashScreenController(root, image);

    const playPromise = splash.play({ minVisibleMs: 5000, fadeMs: 50 });
    splash.dismissImmediate();
    await playPromise;

    expect(root.classList.contains('hidden')).toBe(true);
    expect(splash.isActive()).toBe(false);
  });

  it('usa pelo menos 5 segundos de exibição por padrão', () => {
    expect(SPLASH_SCREEN_MIN_VISIBLE_MS).toBe(5000);
  });
});
