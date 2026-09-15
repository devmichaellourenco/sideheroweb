/**
 * UI do editor de itens (gear) no Balance Lab.
 */
import { withPreservedScroll } from './scrollPreserve';
import { confirmChangeReview } from './changeReview';
import { debounce } from './debounce';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';

type GearSlot = 'weapon' | 'armor' | 'accessory';
type GearRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
type StatKey = string;

interface FieldDef {
  key: StatKey;
  label: string;
  step: number;
  group: string;
}

interface ListEntry {
  id: string;
  name: string;
  baselineName: string;
  slot: GearSlot;
  slotLabel: string;
  rarity: GearRarity;
  rarityLabel: string;
  sprite: string;
  spriteUrl: string;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  basePrice: number;
  minLevel: number;
  hasOverride: boolean;
  unique: boolean;
  namedLegendary: boolean;
  lootPool: boolean;
}

interface RequirementsDraft {
  minLevel: number;
  str: number;
  dex: number;
  int: number;
  heroId: string;
}

interface ItemDraft {
  name: string;
  basePrice: number;
  rarity: GearRarity;
  lootPool: boolean;
  unique: boolean;
  namedLegendary: boolean;
  salvageBlocked: boolean;
  exclusiveHeroId: string;
  requirements: RequirementsDraft;
  stats: Record<StatKey, number>;
}

interface DetailPayload {
  id: string;
  sprite: string;
  spriteId: string;
  spriteUrl: string;
  slot: GearSlot;
  slotLabel: string;
  baseline: Record<string, unknown> & {
    name: string;
    basePrice: number;
    rarity: GearRarity;
    lootPool?: boolean;
    unique?: boolean;
    namedLegendary?: boolean;
    salvageBlocked?: boolean;
    exclusiveHeroId?: string;
    requirements?: Partial<RequirementsDraft> & { heroId?: string };
  };
  effective: Record<string, unknown> & {
    name: string;
    basePrice: number;
    rarity: GearRarity;
    lootPool?: boolean;
    unique?: boolean;
    namedLegendary?: boolean;
    salvageBlocked?: boolean;
    exclusiveHeroId?: string;
    requirements?: Partial<RequirementsDraft> & { heroId?: string };
  };
  hasOverride: boolean;
}

interface ListPayload {
  items: ListEntry[];
  slots: Array<{ id: GearSlot; label: string }>;
  rarities: Array<{ id: GearRarity; label: string }>;
  statFields: FieldDef[];
  updatedAt: string | null;
  overrideCount: number;
  backups: Array<{ id: string; path: string }>;
}

const draftsById = new Map<string, ItemDraft>();
const loadedSnapshotById = new Map<string, string>();
const dirtyIds = new Set<string>();
const baselineById = new Map<string, DetailPayload['baseline']>();

let listPayload: ListPayload | null = null;
let selectedId: string | null = null;
let filterSlot = '';
let filterRarity = '';
let filterQuery = '';
let statusMessage = '';
let statusError = false;
let showAllStats = false;

const GROUP_LABEL: Record<string, string> = {
  primary: 'Primários',
  speed: 'Velocidade / CD',
  crit: 'Crítico',
  resist: 'Resistências %',
  element: 'Dano elemental %',
  flat: 'Flats elementais',
  percent: 'Percentuais',
  defense: 'Defesa extra',
};

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('gear-status');
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
  if (!response.ok || (json as { ok?: boolean }).ok === false) {
    throw new Error((json as { error?: string }).error || `HTTP ${response.status}`);
  }
  return json;
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function draftFromDetail(detail: DetailPayload, fields: FieldDef[]): ItemDraft {
  const item = detail.effective;
  const stats: Record<StatKey, number> = {};
  for (const field of fields) {
    stats[field.key] = num(item[field.key]);
  }
  return {
    name: item.name,
    basePrice: Math.max(1, Math.floor(num(item.basePrice, 1))),
    rarity: item.rarity,
    lootPool: item.lootPool !== false,
    unique: Boolean(item.unique),
    namedLegendary: Boolean(item.namedLegendary),
    salvageBlocked: Boolean(item.salvageBlocked),
    exclusiveHeroId: item.exclusiveHeroId ?? '',
    requirements: {
      minLevel: num(item.requirements?.minLevel, 1),
      str: num(item.requirements?.str),
      dex: num(item.requirements?.dex),
      int: num(item.requirements?.int),
      heroId: item.requirements?.heroId ?? '',
    },
    stats,
  };
}

function snapshotDraft(draft: ItemDraft): string {
  return JSON.stringify(draft);
}

export async function loadGearItemsList(): Promise<void> {
  const query = new URLSearchParams();
  if (filterSlot) query.set('slot', filterSlot);
  if (filterRarity) query.set('rarity', filterRarity);
  if (filterQuery) query.set('q', filterQuery);
  const data = await api<{ ok: boolean } & ListPayload>(`/api/gear-items?${query}`);
  listPayload = {
    items: data.items,
    slots: data.slots,
    rarities: data.rarities,
    statFields: data.statFields,
    updatedAt: data.updatedAt,
    overrideCount: data.overrideCount,
    backups: data.backups ?? [],
  };
}

async function loadDetail(itemId: string): Promise<DetailPayload> {
  const data = await api<{ ok: boolean } & DetailPayload>(
    `/api/gear-items/${encodeURIComponent(itemId)}`,
  );
  baselineById.set(itemId, data.baseline);
  return data;
}

function updateDirtyChrome(): void {
  const saveBtn = document.getElementById('gear-save') as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.disabled = dirtyIds.size === 0;
    saveBtn.textContent =
      dirtyIds.size > 1 ? `Salvar tudo (${dirtyIds.size})` : 'Salvar no sistema';
  }
  const counter = document.getElementById('gear-dirty-count');
  if (counter) {
    counter.textContent =
      dirtyIds.size > 0 ? `${dirtyIds.size} alteração(ões)` : '';
  }
  setWorkspaceDirty('gear', dirtyIds.size);
}

function markCurrentDirtyFromDraft(): void {
  if (!selectedId) return;
  const draft = draftsById.get(selectedId);
  const loaded = loadedSnapshotById.get(selectedId);
  if (!draft || !loaded) return;
  if (snapshotDraft(draft) !== loaded) {
    dirtyIds.add(selectedId);
  } else {
    dirtyIds.delete(selectedId);
  }
  updateDirtyChrome();
}

function flushVisibleDraft(): void {
  if (!selectedId) return;
  const host = document.getElementById('lab-gear-items');
  const draft = draftsById.get(selectedId);
  if (!host || !draft) return;

  const name = host.querySelector<HTMLInputElement>('[data-field="name"]')?.value ?? draft.name;
  const rarity = (host.querySelector<HTMLSelectElement>('[data-field="rarity"]')?.value ??
    draft.rarity) as GearRarity;
  draft.name = name;
  draft.basePrice = Math.max(
    1,
    Math.floor(num(host.querySelector<HTMLInputElement>('[data-field="basePrice"]')?.value, 1)),
  );
  draft.rarity = rarity;
  draft.lootPool = Boolean(
    host.querySelector<HTMLInputElement>('[data-field="lootPool"]')?.checked,
  );
  draft.unique = Boolean(host.querySelector<HTMLInputElement>('[data-field="unique"]')?.checked);
  draft.namedLegendary = Boolean(
    host.querySelector<HTMLInputElement>('[data-field="namedLegendary"]')?.checked,
  );
  draft.salvageBlocked = Boolean(
    host.querySelector<HTMLInputElement>('[data-field="salvageBlocked"]')?.checked,
  );
  draft.exclusiveHeroId =
    host.querySelector<HTMLInputElement>('[data-field="exclusiveHeroId"]')?.value ?? '';
  draft.requirements.minLevel = Math.max(
    1,
    Math.floor(
      num(host.querySelector<HTMLInputElement>('[data-req="minLevel"]')?.value, 1),
    ),
  );
  draft.requirements.str = Math.max(
    0,
    Math.floor(num(host.querySelector<HTMLInputElement>('[data-req="str"]')?.value)),
  );
  draft.requirements.dex = Math.max(
    0,
    Math.floor(num(host.querySelector<HTMLInputElement>('[data-req="dex"]')?.value)),
  );
  draft.requirements.int = Math.max(
    0,
    Math.floor(num(host.querySelector<HTMLInputElement>('[data-req="int"]')?.value)),
  );
  draft.requirements.heroId =
    host.querySelector<HTMLInputElement>('[data-req="heroId"]')?.value ?? '';

  host.querySelectorAll<HTMLInputElement>('[data-stat]').forEach((input) => {
    const key = input.dataset.stat;
    if (!key) return;
    draft.stats[key] = num(input.value);
  });

  draftsById.set(selectedId, draft);
  markCurrentDirtyFromDraft();
}

async function selectItem(itemId: string): Promise<void> {
  flushVisibleDraft();
  selectedId = itemId;

  if (!draftsById.has(itemId)) {
    const detail = await loadDetail(itemId);
    const fields = listPayload?.statFields ?? [];
    const draft = draftFromDetail(detail, fields);
    draftsById.set(itemId, draft);
    loadedSnapshotById.set(itemId, snapshotDraft(draft));
  }

  renderGearItems();
}

function resetSelectedToBaseline(): void {
  if (!selectedId) return;
  const baseline = baselineById.get(selectedId);
  const fields = listPayload?.statFields ?? [];
  if (!baseline) return;
  const detail: DetailPayload = {
    id: selectedId,
    sprite: '',
    spriteId: '',
    spriteUrl: '',
    slot: 'weapon',
    slotLabel: '',
    baseline,
    effective: baseline,
    hasOverride: false,
  };
  const draft = draftFromDetail(detail, fields);
  draftsById.set(selectedId, draft);
  dirtyIds.add(selectedId);
  renderGearItems();
  setStatus(`${selectedId}: rascunho = baseline (salve para gravar/limpar override)`);
}

async function clearSelectedOverride(): Promise<void> {
  if (!selectedId) return;
  await api(`/api/gear-items/${encodeURIComponent(selectedId)}`, { method: 'DELETE' });
  dirtyIds.delete(selectedId);
  draftsById.delete(selectedId);
  loadedSnapshotById.delete(selectedId);
  await loadGearItemsList();
  const detail = await loadDetail(selectedId);
  const draft = draftFromDetail(detail, listPayload?.statFields ?? []);
  draftsById.set(selectedId, draft);
  loadedSnapshotById.set(selectedId, snapshotDraft(draft));
  setStatus(`Override removido: ${selectedId}`);
  renderGearItems();
}

async function saveAllDirty(): Promise<void> {
  flushVisibleDraft();
  const drafts: Record<string, ItemDraft> = {};
  for (const itemId of dirtyIds) {
    const draft = draftsById.get(itemId);
    if (draft) drafts[itemId] = draft;
  }

  if (Object.keys(drafts).length === 0) {
    setStatus('Nada para salvar.');
    return;
  }
  if (!(await confirmChangeReview('Salvar alterações dos itens', dirtyIds.size, drafts))) return;

  await api('/api/gear-items', {
    method: 'PUT',
    body: JSON.stringify({ drafts }),
  });

  dirtyIds.clear();
  draftsById.clear();
  loadedSnapshotById.clear();
  await loadGearItemsList();
  if (selectedId) {
    const detail = await loadDetail(selectedId);
    const draft = draftFromDetail(detail, listPayload?.statFields ?? []);
    draftsById.set(selectedId, draft);
    loadedSnapshotById.set(selectedId, snapshotDraft(draft));
  }
  setStatus(
    `Salvo em gear-item-overrides.json (${Object.keys(drafts).length} item(ns)). Rebuild da extensão para o jogo.`,
  );
  renderGearItems();
}

async function restoreBackup(backupId: string): Promise<void> {
  await api(`/api/gear-items-backups/${encodeURIComponent(backupId)}/restore`, {
    method: 'POST',
  });
  dirtyIds.clear();
  draftsById.clear();
  loadedSnapshotById.clear();
  await loadGearItemsList();
  if (selectedId) {
    const detail = await loadDetail(selectedId);
    const draft = draftFromDetail(detail, listPayload?.statFields ?? []);
    draftsById.set(selectedId, draft);
    loadedSnapshotById.set(selectedId, snapshotDraft(draft));
  }
  setStatus(`Backup restaurado: ${backupId}`);
  renderGearItems();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderList(items: ListEntry[]): string {
  if (items.length === 0) {
    return '<p class="lab-hint">Nenhum item neste filtro.</p>';
  }
  return `<ul class="mb-list gear-list">${items
    .map((item) => {
      const selected = item.id === selectedId ? ' is-active' : '';
      const dirty = dirtyIds.has(item.id) ? ' is-dirty' : '';
      const badges = [
        item.hasOverride ? '<span class="mb-badge">override</span>' : '',
        dirtyIds.has(item.id) ? '<span class="mb-badge mb-badge--dirty">rascunho</span>' : '',
        item.unique || item.namedLegendary
          ? '<span class="mb-badge mb-badge--unique">único</span>'
          : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `
        <li>
          <button type="button" class="mb-list-item gear-list-item rarity--${
            item.rarity
          }${selected}${dirty}" data-select-item="${item.id}">
            <img class="gear-list-thumb" src="${escapeHtml(item.spriteUrl)}" alt="" loading="lazy" />
            <span class="mb-list-main">
              <strong>${escapeHtml(item.name)}</strong>
              <span class="mb-list-meta">
                ${item.slotLabel} · <span class="rarity-tag">${item.rarityLabel}</span>
                · Lv ${item.minLevel}
                · <span class="res res--gold">${item.basePrice.toLocaleString('pt-BR')} ouro</span>
                · <span class="res res--atk">ATK ${item.attackBonus}</span>
                / <span class="res res--def">DEF ${item.defenseBonus}</span>
                / <span class="res res--hp">HP ${item.healthBonus}</span>
              </span>
            </span>
            <span class="mb-list-badges">${badges}</span>
          </button>
        </li>`;
    })
    .join('')}</ul>`;
}

function renderStatGroups(draft: ItemDraft, fields: FieldDef[]): string {
  const groups = new Map<string, FieldDef[]>();
  for (const field of fields) {
    const list = groups.get(field.group) ?? [];
    list.push(field);
    groups.set(field.group, list);
  }

  return [...groups.entries()]
    .map(([group, groupFields]) => {
      const visibleFields = showAllStats
        ? groupFields
        : groupFields.filter((field) => (draft.stats[field.key] ?? 0) !== 0 || group === 'primary');
      if (visibleFields.length === 0) return '';
      return `
        <section class="hc-subsection">
          <h3>${GROUP_LABEL[group] ?? group}</h3>
          <div class="gear-stat-grid">
            ${visibleFields
              .map(
                (field) => `
              <label class="lab-field">
                ${field.label}
                <input type="number" step="${field.step}" data-stat="${field.key}"
                  value="${draft.stats[field.key] ?? 0}" />
              </label>`,
              )
              .join('')}
          </div>
        </section>`;
    })
    .join('');
}

function renderEditor(entry: ListEntry | undefined, draft: ItemDraft | undefined): string {
  if (!entry || !draft) {
    return '<p class="lab-hint">Selecione um item na lista.</p>';
  }
  const fields = listPayload?.statFields ?? [];
  const rarities = listPayload?.rarities ?? [];
  const dirty = dirtyIds.has(entry.id);

  return `
    <header class="gear-editor-head rarity--${draft.rarity}">
      <img class="gear-editor-thumb" src="${escapeHtml(entry.spriteUrl)}" alt="" />
      <div>
        <h2 class="rarity-tag">${escapeHtml(draft.name)}</h2>
        <p class="lab-hint">
          <code>${entry.id}</code> · ${entry.slotLabel} · sprite <code>${entry.sprite}</code>
          ${entry.hasOverride ? ' · <span class="xp-badge">override</span>' : ''}
          ${dirty ? ' · <span class="mb-badge mb-badge--dirty">rascunho</span>' : ''}
        </p>
      </div>
    </header>

    <section class="hc-subsection">
      <h3>Identidade</h3>
      <div class="gear-stat-grid">
        <label class="lab-field lab-field--full">
          Nome
          <input type="text" data-field="name" value="${escapeHtml(draft.name)}" />
        </label>
        <label class="lab-field">
          Raridade
          <select data-field="rarity">
            ${rarities
              .map(
                (rarity) =>
                  `<option value="${rarity.id}" ${
                    draft.rarity === rarity.id ? 'selected' : ''
                  }>${rarity.label}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label class="lab-field lab-field--gold">
          Preço base (ouro)
          <input class="xp-input--gold" type="number" min="1" step="1" data-field="basePrice"
            value="${draft.basePrice}" />
        </label>
        <label class="lab-field">
          Herói exclusivo (id)
          <input type="text" data-field="exclusiveHeroId" value="${escapeHtml(
            draft.exclusiveHeroId,
          )}" placeholder="vazio = nenhum" />
        </label>
      </div>
      <div class="gear-flag-row">
        <label><input type="checkbox" data-field="lootPool" ${
          draft.lootPool ? 'checked' : ''
        } /> loot pool</label>
        <label><input type="checkbox" data-field="unique" ${
          draft.unique ? 'checked' : ''
        } /> unique</label>
        <label><input type="checkbox" data-field="namedLegendary" ${
          draft.namedLegendary ? 'checked' : ''
        } /> named legendary</label>
        <label><input type="checkbox" data-field="salvageBlocked" ${
          draft.salvageBlocked ? 'checked' : ''
        } /> salvage blocked</label>
      </div>
    </section>

    <section class="hc-subsection">
      <h3>Requisitos</h3>
      <div class="gear-stat-grid">
        <label class="lab-field">Nível mín.
          <input type="number" min="1" step="1" data-req="minLevel" value="${
            draft.requirements.minLevel
          }" />
        </label>
        <label class="lab-field">STR
          <input type="number" min="0" step="1" data-req="str" value="${draft.requirements.str}" />
        </label>
        <label class="lab-field">DEX
          <input type="number" min="0" step="1" data-req="dex" value="${draft.requirements.dex}" />
        </label>
        <label class="lab-field">INT
          <input type="number" min="0" step="1" data-req="int" value="${draft.requirements.int}" />
        </label>
        <label class="lab-field lab-field--full">heroId (requisito)
          <input type="text" data-req="heroId" value="${escapeHtml(
            draft.requirements.heroId,
          )}" placeholder="vazio = nenhum" />
        </label>
      </div>
    </section>

    <div class="gear-stat-toolbar">
      <button type="button" class="lab-btn--ghost" id="gear-toggle-stats">
        ${showAllStats ? 'Mostrar só stats usados' : 'Mostrar todos os stats'}
      </button>
    </div>
    ${renderStatGroups(draft, fields)}

    <div class="xp-toolbar lab-danger-zone">
      <button type="button" class="lab-btn--warn" data-action="baseline">↺ Baseline</button>
      <button type="button" class="mb-btn-danger" data-action="clear" ${
        entry.hasOverride ? '' : 'disabled'
      }>Apagar override</button>
    </div>
  `;
}

export function renderGearItems(): void {
  const host = document.getElementById('lab-gear-items');
  if (!host) return;
  setWorkspaceDirty('gear', dirtyIds.size);

  const items = listPayload?.items ?? [];
  const slots = listPayload?.slots ?? [];
  const rarities = listPayload?.rarities ?? [];
  const backups = listPayload?.backups ?? [];
  const selected = items.find((item) => item.id === selectedId);
  const draft = selectedId ? draftsById.get(selectedId) : undefined;

  withPreservedScroll(host, ['.mb-sidebar', '.gear-editor'], () => {
    host.innerHTML = `
    <div class="xp-layout gear-layout">
      <aside class="xp-sidebar mb-sidebar">
        <p class="lab-hint">
          Edite nome, raridade, requisitos e stats dos <strong>${
            listPayload?.items.length ?? 0
          }</strong> itens filtrados
          (${listPayload?.overrideCount ?? 0} override(s) no arquivo).
          Novos drops usam o catálogo efetivo; itens já no save precisam de resync/rebuild.
        </p>
        <div class="mb-filters">
          <label>Slot
            <select id="gear-filter-slot">
              <option value="" ${filterSlot === '' ? 'selected' : ''}>Todos</option>
              ${slots
                .map(
                  (slot) =>
                    `<option value="${slot.id}" ${
                      filterSlot === slot.id ? 'selected' : ''
                    }>${slot.label}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Raridade
            <select id="gear-filter-rarity">
              <option value="" ${filterRarity === '' ? 'selected' : ''}>Todas</option>
              ${rarities
                .map(
                  (rarity) =>
                    `<option value="${rarity.id}" ${
                      filterRarity === rarity.id ? 'selected' : ''
                    }>${rarity.label}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label class="lab-field--full">Busca
            <input type="search" id="gear-filter-q" value="${escapeHtml(
              filterQuery,
            )}" placeholder="id ou nome" />
          </label>
        </div>
        <div class="xp-toolbar">
          <button type="button" class="lab-btn--primary" id="gear-save" ${
            dirtyIds.size === 0 ? 'disabled' : ''
          }>
            ${dirtyIds.size > 1 ? `Salvar tudo (${dirtyIds.size})` : 'Salvar no sistema'}
          </button>
          <span id="gear-dirty-count" class="xp-dirty-count">${
            dirtyIds.size > 0 ? `${dirtyIds.size} alteração(ões)` : ''
          }</span>
        </div>
        <p class="lab-hint">
          ${
            listPayload?.updatedAt
              ? `overrides: <code>${listPayload.updatedAt}</code>`
              : 'sem overrides salvos'
          }
        </p>
        <div class="mb-backups">
          <h3>Backups</h3>
          ${
            backups.length === 0
              ? '<p class="lab-hint">Nenhum backup ainda.</p>'
              : `<ul class="xp-backup-list">${backups
                  .slice(0, 12)
                  .map(
                    (backup) => `
                  <li>
                    <button type="button" class="lab-btn--info" data-restore-backup="${backup.id}">${backup.id}</button>
                  </li>`,
                  )
                  .join('')}</ul>`
          }
        </div>
        ${renderList(items)}
      </aside>
      <section class="xp-main gear-editor">
        ${renderEditor(selected, draft)}
        <p id="gear-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>
  `;
  });

  host.querySelector('#gear-filter-slot')?.addEventListener('change', (event) => {
    flushVisibleDraft();
    filterSlot = (event.target as HTMLSelectElement).value;
    void loadGearItemsList()
      .then(() => {
        renderGearItems();
        setStatus(`Filtro slot: ${filterSlot || 'todos'}`);
      })
      .catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelector('#gear-filter-rarity')?.addEventListener('change', (event) => {
    flushVisibleDraft();
    filterRarity = (event.target as HTMLSelectElement).value;
    void loadGearItemsList()
      .then(() => {
        renderGearItems();
        setStatus(`Filtro raridade: ${filterRarity || 'todas'}`);
      })
      .catch((error: Error) => setStatus(error.message, true));
  });

  const search = host.querySelector<HTMLInputElement>('#gear-filter-q');
  const applyGearSearch = debounce(() => {
    flushVisibleDraft();
    filterQuery = search?.value.trim() ?? '';
    void loadGearItemsList()
      .then(() => {
        renderGearItems();
        setStatus(filterQuery ? `Busca: ${filterQuery}` : 'Busca limpa');
      })
      .catch((error: Error) => setStatus(error.message, true));
  });
  search?.addEventListener('input', applyGearSearch);

  host.querySelector('#gear-save')?.addEventListener('click', () => {
    void saveAllDirty().catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelector('#gear-toggle-stats')?.addEventListener('click', () => {
    flushVisibleDraft();
    showAllStats = !showAllStats;
    renderGearItems();
  });

  host.querySelectorAll<HTMLButtonElement>('[data-select-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.selectItem;
      if (!id) return;
      void selectItem(id).catch((error: Error) => setStatus(error.message, true));
    });
  });

  host.querySelector('[data-action="baseline"]')?.addEventListener('click', () => {
    resetSelectedToBaseline();
  });
  host.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    void clearSelectedOverride().catch((error: Error) => setStatus(error.message, true));
  });

  host
    .querySelectorAll('input, select')
    .forEach((el) => {
      if ((el as HTMLElement).id?.startsWith('gear-filter')) return;
      el.addEventListener('change', () => {
        flushVisibleDraft();
        updateDirtyChrome();
        const row = host.querySelector(`[data-select-item="${selectedId}"]`);
        row?.classList.toggle('is-dirty', selectedId !== null && dirtyIds.has(selectedId));
      });
      el.addEventListener('input', () => {
        flushVisibleDraft();
        updateDirtyChrome();
      });
    });

  host.querySelectorAll<HTMLButtonElement>('[data-restore-backup]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.restoreBackup;
      if (!id) return;
      if (!confirm(`Restaurar backup ${id}?`)) return;
      void restoreBackup(id).catch((error: Error) => setStatus(error.message, true));
    });
  });

  updateDirtyChrome();
}

export async function mountGearItemsTab(): Promise<void> {
  registerWorkspaceSave('gear', saveAllDirty);
  await loadGearItemsList();
  if (!selectedId && listPayload?.items[0]) {
    await selectItem(listPayload.items[0].id);
  } else {
    renderGearItems();
  }
  setStatus('Catálogo de itens carregado — edite e salve no sistema.');
}

/** Seleciona item por id (para deep-link `#gear?id=iron_sword`). */
export function selectGearById(id: string): void {
  if (!listPayload) return;
  const found = listPayload.items.find((item) => item.id === id);
  if (found) {
    void selectItem(found.id).catch(() => undefined);
  }
}
