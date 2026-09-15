// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnboardingController } from './OnboardingController';

describe('OnboardingController spotlight', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('abre recorte de spotlight sobre o âncora destacado', () => {
    const anchor = document.createElement('button');
    anchor.id = 'tutorial-target';
    anchor.textContent = 'Alvo';
    document.body.appendChild(anchor);
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 40,
      left: 20,
      bottom: 80,
      right: 120,
      width: 100,
      height: 40,
      x: 20,
      y: 40,
      toJSON: () => ({}),
    });

    const controller = new OnboardingController();
    controller.show(
      {
        id: 'welcome',
        title: 'Bem-vindo',
        message: 'Clique aqui',
        anchorSelector: '#tutorial-target',
      },
      { onDismissStep: vi.fn(), onSkipAll: vi.fn() },
    );

    // reposition usa rAF
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const spotlight = document.querySelector('.onboarding-spotlight') as HTMLElement;
        const backdrop = document.querySelector('.onboarding-backdrop') as HTMLElement;

        expect(spotlight.classList.contains('hidden')).toBe(false);
        expect(backdrop.classList.contains('onboarding-backdrop--cutout')).toBe(true);
        expect(anchor.classList.contains('onboarding-highlight')).toBe(true);
        expect(anchor.classList.contains('onboarding-anchor-source')).toBe(true);
        expect(spotlight.style.width).toBe('116px');
        expect(spotlight.style.height).toBe('56px');

        const clone = document.querySelector('.onboarding-anchor-clone') as HTMLElement;
        expect(clone).toBeTruthy();
        expect(clone.textContent).toContain('Alvo');
        expect(clone.id).toBe('');

        controller.destroy();
        resolve();
      });
    });
  });

  it('centraliza o card de boas-vindas sem âncora e usa o rótulo do passo', () => {
    const controller = new OnboardingController();
    controller.show(
      {
        id: 'welcome',
        title: 'Sua jornada começa aqui',
        message: 'Vamos abrir o mapa',
        anchorSelector: '',
        kicker: 'Bem-vindo',
        confirmLabel: 'Abrir o mapa',
        variant: 'welcome',
      },
      { onDismissStep: vi.fn(), onSkipAll: vi.fn() },
    );

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const card = document.querySelector('.onboarding-card') as HTMLElement;
        const spotlight = document.querySelector('.onboarding-spotlight') as HTMLElement;

        expect(card.dataset.variant).toBe('welcome');
        expect(card.dataset.placement).toBe('center');
        expect(card.style.transform).toBe('translate(-50%, -50%)');
        expect(spotlight.classList.contains('hidden')).toBe(true);
        expect(document.querySelector('.onboarding-kicker')?.textContent).toBe('Bem-vindo');
        expect(document.querySelector('[data-onboarding-ok]')?.textContent).toBe('Abrir o mapa');

        controller.destroy();
        resolve();
      });
    });
  });

  it('clona ícone e rótulo do botão de baú no overlay do tutorial', () => {
    const anchor = document.createElement('button');
    anchor.id = 'open-chest-btn';
    anchor.className = 'quick-action-btn quick-action-btn--chest chest-available';
    const icon = document.createElement('img');
    icon.className = 'btn-icon';
    icon.src = 'https://example.test/chest.png';
    const label = document.createElement('span');
    label.className = 'quick-action-label';
    label.textContent = 'Abrir baú';
    anchor.append(icon, label);
    document.body.appendChild(anchor);
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 200,
      left: 40,
      bottom: 260,
      right: 140,
      width: 100,
      height: 60,
      x: 40,
      y: 200,
      toJSON: () => ({}),
    });

    const controller = new OnboardingController();
    controller.show(
      {
        id: 'first-chest',
        title: 'Seu primeiro baú',
        message: 'Toque no baú',
        anchorSelector: '#open-chest-btn',
      },
      { onDismissStep: vi.fn(), onSkipAll: vi.fn() },
    );

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const clone = document.querySelector('.onboarding-anchor-clone') as HTMLElement;
        const cloneIcon = clone.querySelector('img.btn-icon') as HTMLImageElement;
        const cloneLabel = clone.querySelector('.quick-action-label');

        expect(clone).toBeTruthy();
        expect(cloneLabel?.textContent).toBe('Abrir baú');
        expect(cloneIcon.src).toContain('chest.png');
        expect(anchor.classList.contains('onboarding-anchor-source')).toBe(true);

        controller.destroy();
        resolve();
      });
    });
  });
});
