import { MassRefundPreviewDto } from '../../application/dto/MassRefundPreviewDto';
import { ImprovementResetUiCopy } from './ImprovementResetUiCopy';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderImprovementResetConfirmContent(
  heroName: string,
  preview: MassRefundPreviewDto,
): string {
  const attrLines =
    preview.attributeChanges.length > 0
      ? preview.attributeChanges
          .map(
            (change) =>
              `<li><strong>${ImprovementResetUiCopy.attributeLabel(change.key)}</strong> alocado: ${change.from} → ${change.to}</li>`,
          )
          .join('')
      : '<li>Nenhum atributo alocado acima do mínimo</li>';

  const warningBlock =
    preview.warnings.length > 0
      ? `<ul class="improvement-reset-confirm-warnings">${preview.warnings
          .map((warning) => `<li>${escapeHtml(warning)}</li>`)
          .join('')}</ul>`
      : '';

  const skillPointsTotal = preview.skillPoints + preview.ascensionSkillPoints;
  const skillsClearedTotal = preview.skillsCleared + preview.ascensionSkillsCleared;

  return `
    <div class="improvement-reset-confirm-body-inner">
      <p>Devolver o máximo possível de pontos de <strong>${escapeHtml(heroName)}</strong>?</p>
      <div class="improvement-reset-confirm-preview" aria-label="Prévia do reset">
        <p class="improvement-reset-confirm-total">
          Total a devolver: <strong>${preview.pointsRefunded}</strong> ponto(s) de aprimoramento
        </p>
        <ul class="improvement-reset-confirm-breakdown">
          <li>Skills (classe + evolução): <strong>${skillsClearedTotal}</strong> skill(s) · <strong>${skillPointsTotal}</strong> ponto(s)</li>
          <li>Atributos: <strong>${preview.attributePoints}</strong> ponto(s)</li>
        </ul>
        <p class="improvement-reset-confirm-section">Atributos alocados</p>
        <ul class="improvement-reset-confirm-attrs">${attrLines}</ul>
        ${warningBlock}
      </div>
      <p class="improvement-reset-confirm-hint">
        Skills de classe e de evolução são zeradas (exceto o mínimo exigido pela ascensão atual) e desequipadas. Tudo volta ao saldo de <strong>Aprimoramento</strong>. A <strong>classe/ascensão</strong> em si não é desfeita.
      </p>
    </div>
  `;
}
