// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { ImprovementResetConfirmDialog } from './ImprovementResetConfirmDialog';
import { renderImprovementResetConfirmContent } from './ImprovementResetConfirmPresentation';
import { MassRefundPreviewDto } from '../../application/dto/MassRefundPreviewDto';

function samplePreview(overrides: Partial<MassRefundPreviewDto> = {}): MassRefundPreviewDto {
  return {
    skillPoints: 2,
    ascensionSkillPoints: 1,
    attributePoints: 3,
    pointsRefunded: 6,
    skillsCleared: 1,
    ascensionSkillsCleared: 1,
    attributeChanges: [{ key: 'str', from: 5, to: 2 }],
    warnings: ['Reset parcial: a ascensão Capitão exige STR ≥ 16 e não pode ser desfeita. Pontos acima desse mínimo foram devolvidos.'],
    ...overrides,
  };
}

describe('ImprovementResetConfirmPresentation', () => {
  it('mostra prévia com total, skills e attrs', () => {
    const html = renderImprovementResetConfirmContent('Galneon', samplePreview());
    expect(html).toContain('Total a devolver');
    expect(html).toContain('6');
    expect(html).toContain('Skills (classe + evolução)');
    expect(html).toContain('STR');
    expect(html).toContain('5 → 2');
    expect(html).toContain('Capitão');
    expect(html).toContain('Aprimoramento');
  });
});

describe('ImprovementResetConfirmDialog', () => {
  it('cancela sem confirmar e resolve false', async () => {
    const root = document.createElement('div');
    root.classList.add('hidden');
    root.innerHTML = `
      <button data-improvement-reset-confirm-cancel>Cancelar</button>
      <h2 id="title"></h2>
      <div id="body"></div>
      <button data-improvement-reset-confirm-accept>Ok</button>
    `;
    const dialog = new ImprovementResetConfirmDialog(
      root,
      root.querySelector('#title') as HTMLElement,
      root.querySelector('#body') as HTMLElement,
      root.querySelector('[data-improvement-reset-confirm-accept]') as HTMLButtonElement,
    );

    const promise = dialog.open('Galneon', samplePreview());
    expect(dialog.isOpen()).toBe(true);
    expect(root.innerHTML).toContain('Total a devolver');
    (root.querySelector('[data-improvement-reset-confirm-cancel]') as HTMLButtonElement).click();
    await expect(promise).resolves.toBe(false);
    expect(dialog.isOpen()).toBe(false);
  });

  it('desabilita confirmar quando não há pontos', async () => {
    const root = document.createElement('div');
    root.classList.add('hidden');
    root.innerHTML = `
      <button data-improvement-reset-confirm-cancel>Cancelar</button>
      <h2 id="title"></h2>
      <div id="body"></div>
      <button data-improvement-reset-confirm-accept>Ok</button>
    `;
    const accept = root.querySelector(
      '[data-improvement-reset-confirm-accept]',
    ) as HTMLButtonElement;
    const dialog = new ImprovementResetConfirmDialog(
      root,
      root.querySelector('#title') as HTMLElement,
      root.querySelector('#body') as HTMLElement,
      accept,
    );

    void dialog.open(
      'Galneon',
      samplePreview({
        pointsRefunded: 0,
        skillPoints: 0,
        ascensionSkillPoints: 0,
        attributePoints: 0,
        skillsCleared: 0,
        ascensionSkillsCleared: 0,
        attributeChanges: [],
        warnings: [],
      }),
    );
    expect(accept.disabled).toBe(true);
    (root.querySelector('[data-improvement-reset-confirm-cancel]') as HTMLButtonElement).click();
  });
});
