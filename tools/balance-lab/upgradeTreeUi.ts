/**
 * UI do editor da árvore de melhorias no Balance Lab.
 */
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import {
  parseRequirementsJson,
  renderDependencyEditor,
  sameDependencyDraft,
  selectedParentIds,
  type UpgradeDependencyDraft,
} from './upgradeDependencyEditor';

type FieldDef = { key: string; label: string; step: number };
type TextField = { key: string; label: string };

interface UpgradeRow {
  id: string;
  branch: string;
  feature: string;
  level: number;
  parents: string[];
  baseline: {
    name: string;
    description: string;
    cost: number;
    parents: string[];
    requirements: unknown[];
  };
  effective: {
    name: string;
    description: string;
    cost: number;
    parents: string[];
    requirements: unknown[];
  };
  hasOverride: boolean;
}

interface Payload {
  upgrades: UpgradeRow[];
  editFields: FieldDef[];
  textFields: TextField[];
  updatedAt: string | null;
  backups: Array<{ id: string; path: string }>;
}

let payload: Payload | null = null;
let filterBranch = '';
let filterQuery = '';
let statusMessage = '';
let statusError = false;

const dirtyIds = new Set<string>();
const draftNumbers = new Map<string, Record<string, number>>();
const draftTexts = new Map<string, { name: string; description: string }>();
const draftDependencies = new Map<string, UpgradeDependencyDraft>();

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('ut-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const json = (await response.json()) as T & { ok?: boolean; error?: string };
  if (!response.ok || json.ok === false) throw new Error(json.error || `HTTP ${response.status}`);
  return json;
}

function syncDraft(): void {
  dirtyIds.clear();
  draftNumbers.clear();
  draftTexts.clear();
  draftDependencies.clear();
  if (!payload) return;
  for (const row of payload.upgrades) {
    draftNumbers.set(row.id, { cost: row.effective.cost });
    draftTexts.set(row.id, { name: row.effective.name, description: row.effective.description });
    draftDependencies.set(row.id, {
      parents: [...row.effective.parents],
      requirements: structuredClone(row.effective.requirements),
    });
  }
}

export async function loadUpgradeTree(): Promise<void> {
  const data = await api<{ ok: boolean } & Payload>('/api/upgrades');
  payload = {
    upgrades: data.upgrades,
    editFields: data.editFields,
    textFields: data.textFields,
    updatedAt: data.updatedAt,
    backups: data.backups ?? [],
  };
  syncDraft();
}

function dirtyCount(): number {
  return dirtyIds.size;
}

function updateDirtyChrome(): void {
  const saveBtn = document.getElementById('ut-save') as HTMLButtonElement | null;
  const count = dirtyCount();
  if (saveBtn) {
    saveBtn.disabled = count === 0;
    saveBtn.textContent = count > 1 ? `Salvar tudo (${count})` : 'Salvar no sistema';
  }
  const el = document.getElementById('ut-dirty-count');
  if (el) el.textContent = count > 0 ? `${count} alteração(ões)` : '';
  setWorkspaceDirty('upgrades', count);
}

function markDirty(id: string, row: UpgradeRow): void {
  const nums = draftNumbers.get(id) ?? {};
  const texts = draftTexts.get(id) ?? { name: row.effective.name, description: row.effective.description };
  const effectiveDependencies = {
    parents: row.effective.parents,
    requirements: row.effective.requirements,
  };
  const dependencies = draftDependencies.get(id) ?? effectiveDependencies;
  const changed =
    Number(nums.cost) !== row.effective.cost ||
    texts.name !== row.effective.name ||
    texts.description !== row.effective.description ||
    !sameDependencyDraft(dependencies, effectiveDependencies);
  if (changed) dirtyIds.add(id);
  else dirtyIds.delete(id);
  document.querySelector(`[data-upgrade-id="${id}"]`)?.classList.toggle('is-dirty', dirtyIds.has(id));
  updateDirtyChrome();
}

async function saveDirty(): Promise<void> {
  const invalidRequirements = Array.from(
    document.querySelectorAll<HTMLTextAreaElement>('[data-upgrade-requirements]'),
  ).find((textarea) => !textarea.checkValidity());
  if (invalidRequirements) {
    invalidRequirements.reportValidity();
    setStatus('Corrija o JSON de requisitos antes de salvar.', true);
    return;
  }

  const upgrades: Record<string, Record<string, unknown>> = {};
  const clearIds: string[] = [];

  for (const id of dirtyIds) {
    const row = payload?.upgrades.find((u) => u.id === id);
    if (!row) continue;
    const nums = draftNumbers.get(id) ?? {};
    const texts = draftTexts.get(id) ?? { name: row.effective.name, description: row.effective.description };
    const dependencies = draftDependencies.get(id) ?? {
      parents: row.effective.parents,
      requirements: row.effective.requirements,
    };
    const baselineDependencies = {
      parents: row.baseline.parents,
      requirements: row.baseline.requirements,
    };
    const patch: Record<string, unknown> = {};
    if (texts.name !== row.baseline.name) patch.name = texts.name;
    if (texts.description !== row.baseline.description) patch.description = texts.description;
    if (Number(nums.cost) !== row.baseline.cost) patch.cost = Math.max(0, Math.floor(Number(nums.cost)));
    if (!sameDependencyDraft(dependencies, baselineDependencies)) {
      if (JSON.stringify(dependencies.parents) !== JSON.stringify(row.baseline.parents)) {
        patch.parents = dependencies.parents;
      }
      if (JSON.stringify(dependencies.requirements) !== JSON.stringify(row.baseline.requirements)) {
        patch.requirements = dependencies.requirements;
      }
    }
    if (Object.keys(patch).length === 0) clearIds.push(id);
    else upgrades[id] = patch;
  }

  if (Object.keys(upgrades).length === 0 && clearIds.length === 0) {
    setStatus('Nada para salvar.');
    return;
  }

  const changes = { upgrades, clearIds };
  if (!(await confirmChangeReview('Salvar melhorias', dirtyCount(), changes))) return;

  await api('/api/upgrades', { method: 'PUT', body: JSON.stringify(changes) });
  await loadUpgradeTree();
  setStatus('Salvo em upgrade-overrides.json. Rebuild da extensão para o jogo.');
  renderUpgradeTree();
}

export function renderUpgradeTree(): void {
  const host = document.getElementById('lab-upgrades');
  if (!host || !payload) return;
  setWorkspaceDirty('upgrades', dirtyCount());

  const query = filterQuery.toLowerCase();
  const filtered = payload.upgrades.filter((u) => {
    if (filterBranch && u.branch !== filterBranch) return false;
    return !query || u.id.includes(query) || u.effective.name.toLowerCase().includes(query);
  });

  const branches = [...new Set(payload.upgrades.map((u) => u.branch))].sort();

  host.innerHTML = `
    <div class="xp-layout">
      <aside class="xp-sidebar">
        <p class="lab-hint">Edite custo, textos, pais e requisitos. A árvore rejeita pais inexistentes, ciclos e múltiplas raízes.</p>
        <input type="text" id="ut-filter" placeholder="Filtrar melhorias…" value="${filterQuery}" class="lab-filter-input" />
        <div class="mb-filter-row">
          <select id="ut-branch">
            <option value="">Todos os ramos</option>
            ${branches.map((b) => `<option value="${b}" ${filterBranch === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
        <p class="lab-hint lab-hint--tight">${filtered.length} melhorias</p>
        <div class="xp-toolbar">
          <button type="button" class="lab-btn--primary" id="ut-save" ${dirtyCount() === 0 ? 'disabled' : ''}>
            ${dirtyCount() > 1 ? `Salvar tudo (${dirtyCount()})` : 'Salvar no sistema'}
          </button>
          <span id="ut-dirty-count" class="xp-dirty-count"></span>
        </div>
        <div class="mb-backups">
          <h3>Backups</h3>
          ${
            payload.backups.length === 0
              ? '<p class="lab-hint">Nenhum backup ainda.</p>'
              : `<ul class="xp-backup-list">${payload.backups
                  .slice(0, 12)
                  .map(
                    (b) =>
                      `<li><button type="button" class="lab-btn--info" data-restore-backup="${b.id}">${b.id}</button></li>`,
                  )
                  .join('')}</ul>`
          }
        </div>
      </aside>
      <section class="xp-main">
        <div class="hc-skill-grid">
          ${filtered
            .map((row) => {
              const nums = draftNumbers.get(row.id) ?? { cost: row.effective.cost };
              const texts = draftTexts.get(row.id) ?? { name: row.effective.name, description: row.effective.description };
              const dependencies = draftDependencies.get(row.id) ?? {
                parents: row.effective.parents,
                requirements: row.effective.requirements,
              };
              const dirty = dirtyIds.has(row.id) ? ' is-dirty' : '';
              const badge = row.hasOverride ? '<span class="xp-badge">override</span>' : '';
              return `<article class="hc-card${dirty}" data-upgrade-id="${row.id}">
                <header>
                  <strong>${texts.name}</strong> ${badge}
                  <span class="xp-muted">${row.id} · ${row.branch} · Lv.${row.level}</span>
                </header>
                <p class="lab-hint lab-hint--tight">Pais: ${row.parents.length > 0 ? row.parents.join(', ') : '— raiz —'}</p>
                <div class="hc-fields">
                  <label>Nome
                    <input type="text" data-upgrade-name="${row.id}" value="${texts.name.replace(/"/g, '&quot;')}" />
                  </label>
                  <label>Custo
                    <input type="number" step="50" data-upgrade-cost="${row.id}" value="${nums.cost}" />
                  </label>
                </div>
                <label class="hc-desc">Descrição
                  <textarea data-upgrade-desc="${row.id}" rows="2">${texts.description}</textarea>
                </label>
                ${renderDependencyEditor(
                  row.id,
                  dependencies,
                  payload.upgrades.map((upgrade) => ({
                    id: upgrade.id,
                    name: upgrade.effective.name,
                  })),
                )}
                <p class="lab-hint lab-hint--tight">Baseline: custo ${row.baseline.cost} · "${row.baseline.name}"</p>
                <button type="button" class="lab-btn--warn" data-reset-upgrade="${row.id}">↺ baseline</button>
              </article>`;
            })
            .join('')}
        </div>
        <p id="ut-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>`;

  updateDirtyChrome();
  bindUpgradeTree(host);
}

export function selectUpgradeById(id: string): void {
  if (!payload?.upgrades.some((upgrade) => upgrade.id === id)) return;
  filterBranch = '';
  filterQuery = id;
  renderUpgradeTree();
  const card = document.querySelector<HTMLElement>(`[data-upgrade-id="${CSS.escape(id)}"]`);
  card?.scrollIntoView({ block: 'center' });
  card?.focus({ preventScroll: true });
}

function bindUpgradeTree(host: HTMLElement): void {
  host.querySelector<HTMLInputElement>('#ut-filter')?.addEventListener('input', (event) => {
    filterQuery = (event.target as HTMLInputElement).value;
    renderUpgradeTree();
  });

  host.querySelector<HTMLSelectElement>('#ut-branch')?.addEventListener('change', (event) => {
    filterBranch = (event.target as HTMLSelectElement).value;
    renderUpgradeTree();
  });

  host.querySelector('#ut-save')?.addEventListener('click', () => {
    void saveDirty().catch((err: Error) => setStatus(err.message, true));
  });

  host.querySelectorAll<HTMLInputElement>('[data-upgrade-name]').forEach((input) => {
    const id = input.dataset.upgradeName!;
    input.addEventListener('input', () => {
      const texts = draftTexts.get(id) ?? { name: '', description: '' };
      texts.name = input.value;
      draftTexts.set(id, texts);
      const row = payload?.upgrades.find((u) => u.id === id);
      if (row) markDirty(id, row);
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-upgrade-cost]').forEach((input) => {
    const id = input.dataset.upgradeCost!;
    input.addEventListener('input', () => {
      const nums = draftNumbers.get(id) ?? {};
      nums.cost = Number(input.value);
      draftNumbers.set(id, nums);
      const row = payload?.upgrades.find((u) => u.id === id);
      if (row) markDirty(id, row);
    });
  });

  host.querySelectorAll<HTMLTextAreaElement>('[data-upgrade-desc]').forEach((textarea) => {
    const id = textarea.dataset.upgradeDesc!;
    textarea.addEventListener('input', () => {
      const texts = draftTexts.get(id) ?? { name: '', description: '' };
      texts.description = textarea.value;
      draftTexts.set(id, texts);
      const row = payload?.upgrades.find((u) => u.id === id);
      if (row) markDirty(id, row);
    });
  });

  host.querySelectorAll<HTMLSelectElement>('[data-upgrade-parents]').forEach((select) => {
    const id = select.dataset.upgradeParents!;
    select.addEventListener('change', () => {
      const current = draftDependencies.get(id) ?? { parents: [], requirements: [] };
      draftDependencies.set(id, { ...current, parents: selectedParentIds(select) });
      const row = payload?.upgrades.find((upgrade) => upgrade.id === id);
      if (row) markDirty(id, row);
    });
  });

  host.querySelectorAll<HTMLTextAreaElement>('[data-upgrade-requirements]').forEach((textarea) => {
    const id = textarea.dataset.upgradeRequirements!;
    textarea.addEventListener('input', () => {
      try {
        const requirements = parseRequirementsJson(textarea.value);
        textarea.setCustomValidity('');
        const current = draftDependencies.get(id) ?? { parents: [], requirements: [] };
        draftDependencies.set(id, { ...current, requirements });
        const row = payload?.upgrades.find((upgrade) => upgrade.id === id);
        if (row) markDirty(id, row);
      } catch (error) {
        textarea.setCustomValidity(error instanceof Error ? error.message : 'JSON inválido');
      }
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-upgrade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.resetUpgrade!;
      const row = payload?.upgrades.find((u) => u.id === id);
      if (!row) return;
      draftNumbers.set(id, { cost: row.baseline.cost });
      draftTexts.set(id, { name: row.baseline.name, description: row.baseline.description });
      draftDependencies.set(id, {
        parents: [...row.baseline.parents],
        requirements: structuredClone(row.baseline.requirements),
      });
      dirtyIds.add(id);
      renderUpgradeTree();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-restore-backup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.restoreBackup;
      if (!id || !confirm(`Restaurar backup ${id}?`)) return;
      void api(`/api/upgrades-backups/${encodeURIComponent(id)}/restore`, { method: 'POST' })
        .then(() => loadUpgradeTree())
        .then(() => {
          setStatus(`Backup restaurado: ${id}`);
          renderUpgradeTree();
        })
        .catch((err: Error) => setStatus(err.message, true));
    });
  });
}

export async function mountUpgradeTreeTab(): Promise<void> {
  registerWorkspaceSave('upgrades', saveDirty);
  await loadUpgradeTree();
  renderUpgradeTree();
  setStatus('Melhorias carregadas — edite custo, nome e descrição e salve.');
}
