// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { RewardMoment } from '../delight/types/RewardMoment';
import { UiOverlayOrchestrator } from '../overlays/UiOverlayOrchestrator';
import { WowCelebrationController } from './WowCelebrationController';
import { WowBanner } from './types/WowBanner';

function buildMoment(): RewardMoment {
  return {
    id: 'test-moment',
    kind: 'milestone_boss_defeated',
    tier: 'macro',
    priority: 90,
    title: 'Boss derrotado',
    tone: 'victory',
  };
}

function persistentBanner(id: string): WowBanner {
  return {
    id,
    kind: 'chest',
    persistence: 'persistent',
    priority: 85,
    tone: 'chest',
    title: '1 baú para abrir',
    cta: { label: 'Abrir baú', action: 'chest' },
  };
}

describe('WowCelebrationController', () => {
  it('bloqueia avanço enquanto celebração central está ativa', () => {
    document.body.innerHTML = `
      <button id="inbox"><span class="wow-inbox-btn-count"></span></button>
      <div id="root" class="hidden"><div id="stage"></div></div>
      <div id="inbox-root" class="hidden"><div id="panel"></div></div>
    `;

    const controller = new WowCelebrationController(
      document.getElementById('root')!,
      document.getElementById('stage')!,
      document.getElementById('inbox-root')!,
      document.getElementById('panel')!,
      document.getElementById('inbox') as HTMLButtonElement,
    );

    expect(controller.isBlockingAdvance()).toBe(false);
    controller.enqueueMoment(buildMoment());
    expect(controller.isBlockingAdvance()).toBe(true);
    controller.destroy();
  });

  it('syncPersistentBanners preenche inbox sem bloquear avanço', () => {
    document.body.innerHTML = `
      <button id="inbox" class="hidden"><span class="wow-inbox-btn-count"></span></button>
      <div id="root" class="hidden"><div id="stage"></div></div>
      <div id="inbox-root" class="hidden"><div id="panel"></div></div>
    `;

    const controller = new WowCelebrationController(
      document.getElementById('root')!,
      document.getElementById('stage')!,
      document.getElementById('inbox-root')!,
      document.getElementById('panel')!,
      document.getElementById('inbox') as HTMLButtonElement,
    );

    controller.syncPersistentBanners([persistentBanner('pending-chest')]);
    expect(controller.isBlockingAdvance()).toBe(false);
    expect(document.getElementById('inbox')!.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('.wow-inbox-btn-count')!.textContent).toBe('1');

    controller.syncPersistentBanners([]);
    expect(document.getElementById('inbox')!.classList.contains('hidden')).toBe(true);
    controller.destroy();
  });

  it('com orquestrador ocupado, celebração espera liberar o slot', () => {
    document.body.innerHTML = `
      <button id="inbox"><span class="wow-inbox-btn-count"></span></button>
      <div id="root" class="hidden"><div id="stage"></div></div>
      <div id="inbox-root" class="hidden"><div id="panel"></div></div>
    `;

    const orch = new UiOverlayOrchestrator();
    orch.request('onboarding', 'tip', () => undefined);

    const controller = new WowCelebrationController(
      document.getElementById('root')!,
      document.getElementById('stage')!,
      document.getElementById('inbox-root')!,
      document.getElementById('panel')!,
      document.getElementById('inbox') as HTMLButtonElement,
    );
    controller.setOverlayOrchestrator(orch);

    controller.enqueueMoment(buildMoment());
    expect(controller.isBlockingAdvance()).toBe(false);
    expect(orch.getActiveKind()).toBe('onboarding');

    orch.release('onboarding', 'tip');
    expect(controller.isBlockingAdvance()).toBe(true);
    expect(orch.getActiveKind()).toBe('wow');
    controller.destroy();
  });
});
