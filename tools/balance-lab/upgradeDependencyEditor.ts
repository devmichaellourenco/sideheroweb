export interface UpgradeDependencyDraft {
  parents: string[];
  requirements: unknown[];
}

export interface UpgradeDependencyOption {
  id: string;
  name: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sameDependencyDraft(
  left: UpgradeDependencyDraft,
  right: UpgradeDependencyDraft,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function renderDependencyEditor(
  upgradeId: string,
  draft: UpgradeDependencyDraft,
  options: readonly UpgradeDependencyOption[],
): string {
  const parentOptions = options
    .filter((option) => option.id !== upgradeId)
    .map(
      (option) =>
        `<option value="${escapeHtml(option.id)}" ${
          draft.parents.includes(option.id) ? 'selected' : ''
        }>${escapeHtml(option.name)} · ${escapeHtml(option.id)}</option>`,
    )
    .join('');

  return `
    <details class="ut-dependencies">
      <summary>Dependências e requisitos</summary>
      <label>Pais no grafo <span class="lab-hint">(Ctrl/Cmd para múltiplos)</span>
        <select multiple size="6" data-upgrade-parents="${escapeHtml(upgradeId)}">
          ${parentOptions}
        </select>
      </label>
      <p class="lab-hint lab-hint--tight">Todos os pais selecionados precisam estar comprados.</p>
      <label>Requisitos adicionais (JSON)
        <textarea data-upgrade-requirements="${escapeHtml(upgradeId)}" rows="5" spellcheck="false">${escapeHtml(
          JSON.stringify(draft.requirements, null, 2),
        )}</textarea>
      </label>
    </details>`;
}

export function selectedParentIds(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, (option) => option.value);
}

export function parseRequirementsJson(raw: string): unknown[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Requisitos devem ser um array JSON.');
  return parsed;
}
