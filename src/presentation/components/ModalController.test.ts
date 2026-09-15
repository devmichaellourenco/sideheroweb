// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { ModalController } from './ModalController';

describe('ModalController title', () => {
  function mountModal(): {
    controller: ModalController;
    titleMain: HTMLElement;
  } {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="modal-root hidden">
        <button data-modal-close type="button">x</button>
        <div id="modal-title" class="modal-title">
          <div class="sheet-title-row">
            <div id="modal-title-main" class="modal-title-main"></div>
          </div>
        </div>
        <div id="modal-body"></div>
      </div>
    `;
    document.body.appendChild(root);
    const titleMain = root.querySelector('#modal-title-main') as HTMLElement;
    const controller = new ModalController(
      root.querySelector('.modal-root') as HTMLElement,
      titleMain,
      root.querySelector('#modal-body') as HTMLElement,
    );
    return { controller, titleMain };
  }

  it('escreve título em modal-title-main', () => {
    const { controller, titleMain } = mountModal();
    controller.open('Loja');
    expect(titleMain.textContent).toBe('Loja');

    controller.setTitleHtml('<span class="campaign-view-toggle">Campanha</span>');
    expect(titleMain.querySelector('.campaign-view-toggle')).toBeTruthy();
  });
});
