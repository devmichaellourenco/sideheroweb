// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { resolveUiClickSfx } from './resolveUiClickSfx';

describe('resolveUiClickSfx', () => {
  it('mapeia ícones de menu para menu', () => {
    document.body.innerHTML = `<button class="action-icon-btn">Heróis</button>`;
    const button = document.querySelector('button')!;
    expect(resolveUiClickSfx(button)).toBe('menu');
  });

  it('mapeia confirmar e fechar', () => {
    document.body.innerHTML = `
      <button class="primary-btn">Ok</button>
      <button data-modal-close>Fechar</button>
    `;
    expect(resolveUiClickSfx(document.querySelector('.primary-btn'))).toBe('confirm');
    expect(resolveUiClickSfx(document.querySelector('[data-modal-close]'))).toBe('back');
  });

  it('ignora battle strip e botões desabilitados', () => {
    document.body.innerHTML = `
      <section class="battle-strip"><button>Skill</button></section>
      <button class="filter-btn" disabled>Filtro</button>
    `;
    expect(resolveUiClickSfx(document.querySelector('.battle-strip button'))).toBeNull();
    expect(resolveUiClickSfx(document.querySelector('.filter-btn'))).toBeNull();
  });
});

describe('GameSfxController', () => {
  it('só toca após unlock e com SFX habilitado', async () => {
    const { GameSfxController } = await import('./GameSfxController');

    class MockAudio {
      src = '';
      volume = 1;
      preload = '';
      play = vi.fn(async () => undefined);
      addEventListener = vi.fn();
    }

    const created: MockAudio[] = [];
    const controller = new GameSfxController(() => {
      const audio = new MockAudio();
      created.push(audio);
      return audio as unknown as HTMLAudioElement;
    });

    controller.setPreferences({ enabled: true, volume: 0.5 });
    controller.play('menu');
    expect(created).toHaveLength(0);

    document.body.innerHTML = `<button id="unlock"></button>`;
    controller.bindUnlock(document.body);
    document.querySelector('#unlock')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    controller.play('confirm');
    expect(created).toHaveLength(1);
    expect(created[0]?.volume).toBe(0.5);
    expect(created[0]?.src).toContain('ui_click_confirm.ogg');

    controller.setPreferences({ enabled: false });
    controller.play('menu');
    expect(created).toHaveLength(1);
  });
});
