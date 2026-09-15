import { confirmChangeReview } from './changeReview';
import { debounce } from './debounce';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';

interface ShopEntry {
  id: string;
  name: string;
  unlockAfterMainId: string;
  catalogItemIds: string[];
  priceMultiplier: number;
  flatPriceAdjustment: number;
  canonical: boolean;
  hasOverride: boolean;
  progressionTier: number;
}

interface ShopItem {
  id: string;
  name: string;
  rarity: string;
  slot: string;
  basePrice: number;
  sprite: string;
  spriteUrl: string;
}

interface ShopPayload {
  shops: ShopEntry[];
  milestones: Array<{
    id: string;
    name: string;
    mapId: string;
    phaseId: string;
    mapIndex: number;
  }>;
  items: ShopItem[];
  deletedShopIds: string[];
  updatedAt: string | null;
  backups: Array<{ id: string; path: string }>;
}

type ItemSelectionFilter = 'all' | 'selected' | 'unselected';

let payload: ShopPayload | null = null;
let selectedId: string | null = null;
let draft: ShopEntry | null = null;
let isNew = false;
let query = '';
let mapFilter = 0;
let itemQuery = '';
let itemSelectionFilter: ItemSelectionFilter = 'all';
let shopDirty = false;
let status = '';
let statusError = false;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const json = (await response.json()) as T & { ok?: boolean; error?: string };
  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  return json;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setStatus(message: string, error = false): void {
  status = message;
  statusError = error;
  const element = document.getElementById('shop-status');
  if (element) {
    element.textContent = message;
    element.classList.toggle('is-error', error);
  }
}

async function loadShops(): Promise<void> {
  const data = await api<{ ok: boolean } & ShopPayload>('/api/shops');
  payload = data;
}

function uniqueShopId(base: string): string {
  const safe =
    base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'nova-loja';
  const used = new Set(payload?.shops.map((shop) => shop.id) ?? []);
  let id = safe;
  let suffix = 2;
  while (used.has(id)) id = `${safe}-${suffix++}`;
  return id;
}

function newDraft(source?: ShopEntry): ShopEntry {
  const milestone = source?.unlockAfterMainId ?? payload?.milestones[0]?.id ?? 'main:1-1';
  return {
    id: uniqueShopId(source ? `${source.id}-copia` : 'nova-loja'),
    name: source ? `${source.name} (cópia)` : 'Nova loja',
    unlockAfterMainId: milestone,
    catalogItemIds: [...(source?.catalogItemIds ?? [])],
    priceMultiplier: source?.priceMultiplier ?? 1,
    flatPriceAdjustment: source?.flatPriceAdjustment ?? 0,
    canonical: false,
    hasOverride: false,
    progressionTier: 0,
  };
}

function readDraft(): ShopEntry | null {
  if (!draft) return null;
  const host = document.getElementById('lab-shops');
  if (!host) return draft;
  draft.id = (host.querySelector<HTMLInputElement>('[data-shop-field="id"]')?.value ?? draft.id)
    .trim()
    .toLowerCase();
  draft.name =
    host.querySelector<HTMLInputElement>('[data-shop-field="name"]')?.value ?? draft.name;
  draft.unlockAfterMainId =
    host.querySelector<HTMLSelectElement>('[data-shop-field="unlock"]')?.value ??
    draft.unlockAfterMainId;
  draft.priceMultiplier = Number(
    host.querySelector<HTMLInputElement>('[data-shop-field="multiplier"]')?.value,
  );
  draft.flatPriceAdjustment = Number(
    host.querySelector<HTMLInputElement>('[data-shop-field="flat"]')?.value,
  );
  const visibleInputs = Array.from(
    host.querySelectorAll<HTMLInputElement>('[data-shop-item]'),
  );
  const visibleIds = new Set(visibleInputs.map((input) => input.dataset.shopItem!));
  draft.catalogItemIds = [
    ...draft.catalogItemIds.filter((id) => !visibleIds.has(id)),
    ...visibleInputs.filter((input) => input.checked).map((input) => input.dataset.shopItem!),
  ];
  return draft;
}

export function selectShopById(id: string): void {
  const shop = payload?.shops.find((entry) => entry.id === id);
  if (!shop) return;
  selectedId = id;
  draft = { ...shop, catalogItemIds: [...shop.catalogItemIds] };
  isNew = false;
  shopDirty = false;
  itemQuery = '';
  itemSelectionFilter = 'all';
  renderShops();
}

function startCreate(source?: ShopEntry): void {
  selectedId = null;
  draft = newDraft(source);
  isNew = true;
  shopDirty = true;
  itemQuery = '';
  itemSelectionFilter = 'all';
  renderShops();
}

async function saveDraft(): Promise<void> {
  const value = readDraft();
  if (!value) return;
  if (!(await confirmChangeReview(`Salvar loja “${value.name}”`, 1, value))) return;
  await api(`/api/shops/${encodeURIComponent(value.id)}`, {
    method: 'PUT',
    body: JSON.stringify(value),
  });
  await loadShops();
  selectedId = value.id;
  const saved = payload?.shops.find((shop) => shop.id === value.id);
  draft = saved ? { ...saved, catalogItemIds: [...saved.catalogItemIds] } : null;
  isNew = false;
  shopDirty = false;
  renderShops();
  setStatus(`Loja salva: ${value.id}`);
}

async function deleteSelected(): Promise<void> {
  if (!draft || isNew) return;
  if (!confirm(`Excluir a loja ${draft.name}?`)) return;
  const deletedId = draft.id;
  await api(`/api/shops/${encodeURIComponent(deletedId)}`, { method: 'DELETE' });
  await loadShops();
  const next = payload?.shops[0];
  selectedId = next?.id ?? null;
  draft = next ? { ...next, catalogItemIds: [...next.catalogItemIds] } : null;
  shopDirty = false;
  renderShops();
  setStatus(`Loja excluída: ${deletedId}`);
}

async function restoreBackup(backupId: string): Promise<void> {
  await api(`/api/shops-backups/${encodeURIComponent(backupId)}/restore`, {
    method: 'POST',
  });
  await loadShops();
  const next = payload?.shops.find((shop) => shop.id === selectedId) ?? payload?.shops[0];
  selectedId = next?.id ?? null;
  draft = next ? { ...next, catalogItemIds: [...next.catalogItemIds] } : null;
  isNew = false;
  shopDirty = false;
  renderShops();
  setStatus(`Backup restaurado: ${backupId}`);
}

function renderShopList(): string {
  const shops = (payload?.shops ?? []).filter((shop) => {
    const map = Number(shop.unlockAfterMainId.match(/^main:(\d+)-/)?.[1] ?? 0);
    return (
      (!mapFilter || map === mapFilter) &&
      (!query ||
        shop.id.toLowerCase().includes(query) ||
        shop.name.toLowerCase().includes(query))
    );
  });
  return `<ul class="mb-list">${shops
    .map(
      (shop) => `<li><button type="button" class="mb-list-item ${
        selectedId === shop.id ? 'is-active' : ''
      }" data-shop-select="${shop.id}">
        <strong>${escapeHtml(shop.name)}</strong>
        <span class="mb-list-meta">${shop.id} · ${shop.unlockAfterMainId} · ${
          shop.catalogItemIds.length
        } itens</span>
        <span>${
          shop.canonical ? '<span class="mb-badge mb-badge--canonical">canônica</span>' : ''
        }${shop.hasOverride ? '<span class="mb-badge">override</span>' : ''}</span>
      </button></li>`,
    )
    .join('')}</ul>`;
}

function renderItems(): string {
  if (!draft) return '';
  const selected = new Set(draft.catalogItemIds);
  const visible = (payload?.items ?? []).filter((item) => {
    const needle = itemQuery.toLowerCase();
    const matchesQuery =
      !needle ||
      item.id.toLowerCase().includes(needle) ||
      item.name.toLowerCase().includes(needle) ||
      item.rarity.toLowerCase().includes(needle) ||
      item.slot.toLowerCase().includes(needle);
    const isSelected = selected.has(item.id);
    const matchesSelection =
      itemSelectionFilter === 'all' ||
      (itemSelectionFilter === 'selected' && isSelected) ||
      (itemSelectionFilter === 'unselected' && !isSelected);
    return matchesQuery && matchesSelection;
  });
  return `<div class="shop-item-grid">${visible
    .map(
      (item) => `<label class="shop-item-card rarity--${item.rarity}">
        <input type="checkbox" data-shop-item="${item.id}" ${
          selected.has(item.id) ? 'checked' : ''
        } />
        <img class="shop-item-thumb" src="${escapeHtml(item.spriteUrl)}" alt="" loading="lazy" />
        <span><strong>${escapeHtml(item.name)}</strong>
        <small>${item.id} · <span class="rarity-tag">${item.rarity}</span> · ${
          item.slot
        } · <span class="res res--gold">${item.basePrice} ouro</span>
        · ${(payload?.shops ?? []).filter((shop) => shop.catalogItemIds.includes(item.id)).length} loja(s)
        </small></span>
      </label>`,
    )
    .join('')}</div>`;
}

function finalPrice(basePrice: number): number {
  if (!draft) return basePrice;
  const base = Math.max(1, Math.floor(basePrice));
  return Math.max(1, Math.floor(base * draft.priceMultiplier + draft.flatPriceAdjustment));
}

function renderPriceSummary(): string {
  if (!draft) return '';
  const selected = new Set(draft.catalogItemIds);
  const prices = (payload?.items ?? [])
    .filter((item) => selected.has(item.id))
    .map((item) => finalPrice(item.basePrice));
  if (prices.length === 0) {
    return `<p class="shop-price-summary">Sem itens no pool — nenhum preço para estimar.</p>`;
  }
  const total = prices.reduce((sum, price) => sum + price, 0);
  return `<p class="shop-price-summary">
      Preço final no pool:
      mín <strong class="res res--gold">${Math.min(...prices)}</strong>
      · médio <strong class="res res--gold">${Math.round(total / prices.length)}</strong>
      · máx <strong class="res res--gold">${Math.max(...prices)}</strong>
      · fórmula <code>base × ${draft.priceMultiplier} ${
        draft.flatPriceAdjustment >= 0 ? '+' : '−'
      } ${Math.abs(draft.flatPriceAdjustment)}</code>
    </p>`;
}

function renderEditor(): string {
  if (!draft) return '<p class="lab-hint">Crie ou selecione uma loja.</p>';
  return `<header class="shop-editor-head">
      <div><h2>${escapeHtml(draft.name)}</h2>
      <p class="lab-hint">${isNew ? 'Nova loja — o ID pode ser editado até salvar.' : 'ID estável após criação.'}</p></div>
      <div class="shop-actions">
        <button type="button" class="lab-btn--info" data-shop-action="duplicate">Duplicar</button>
        <button type="button" class="mb-btn-danger" data-shop-action="delete" ${
          isNew ? 'disabled' : ''
        }>Excluir</button>
      </div>
    </header>
    <div class="gear-stat-grid">
      <label class="lab-field">ID
        <input type="text" data-shop-field="id" value="${escapeHtml(draft.id)}" ${
          isNew ? '' : 'disabled'
        } />
      </label>
      <label class="lab-field">Nome
        <input type="text" data-shop-field="name" value="${escapeHtml(draft.name)}" />
      </label>
      <label class="lab-field">Desbloqueia após
        <select data-shop-field="unlock">${(payload?.milestones ?? [])
          .map(
            (milestone) =>
              `<option value="${milestone.id}" ${
                draft?.unlockAfterMainId === milestone.id ? 'selected' : ''
              }>Mapa ${milestone.mapIndex} · ${milestone.id} · ${escapeHtml(
                milestone.name,
              )}</option>`,
          )
          .join('')}</select>
      </label>
      <label class="lab-field lab-field--gold">Multiplicador global
        <input class="xp-input--gold" type="number" min="0" step="0.01" data-shop-field="multiplier" value="${
          draft.priceMultiplier
        }" />
      </label>
      <label class="lab-field lab-field--gold">Ajuste flat global
        <input class="xp-input--gold" type="number" step="1" data-shop-field="flat" value="${
          draft.flatPriceAdjustment
        }" />
      </label>
    </div>
    ${renderPriceSummary()}
    <details class="shop-preview-section">
      <summary>⚡ Prévia de estoque (por seed)</summary>
      <div class="shop-preview-controls">
        <label>Seed <input type="number" step="1" min="0" id="shop-preview-seed" value="0" /></label>
        <label>Tier <input type="number" step="1" min="1" id="shop-preview-tier" value="1" /></label>
        <button type="button" class="lab-btn--info" id="shop-preview-btn">Gerar prévia</button>
      </div>
      <div id="shop-preview-result"></div>
    </details>
    <section class="hc-subsection">
      <h3>Pool explícito (${draft.catalogItemIds.length} selecionados)</h3>
      <div class="shop-item-filters">
        <input type="search" id="shop-item-q" value="${escapeHtml(
          itemQuery,
        )}" placeholder="buscar por nome, id, raridade ou slot" />
        <label class="lab-field">Exibir
          <select id="shop-item-selection-filter">
            <option value="all" ${
              itemSelectionFilter === 'all' ? 'selected' : ''
            }>Todos</option>
            <option value="selected" ${
              itemSelectionFilter === 'selected' ? 'selected' : ''
            }>Selecionados</option>
            <option value="unselected" ${
              itemSelectionFilter === 'unselected' ? 'selected' : ''
            }>Deselecionados</option>
          </select>
        </label>
        <div class="shop-item-bulk-actions">
          <button type="button" class="lab-btn--create" data-shop-pool-action="select-visible">
            Selecionar visíveis
          </button>
          <button type="button" class="lab-btn--warn" data-shop-pool-action="unselect-visible">
            Desmarcar visíveis
          </button>
        </div>
      </div>
      ${renderItems()}
    </section>
    <div class="shop-actions"><button type="button" class="lab-btn--primary" data-shop-action="save">Salvar loja</button></div>
    <p id="shop-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${escapeHtml(
      status,
    )}</p>`;
}

export function renderShops(): void {
  const host = document.getElementById('lab-shops');
  if (!host) return;
  setWorkspaceDirty('shops', shopDirty ? 1 : 0);
  const maps = [...new Set(payload?.milestones.map((entry) => entry.mapIndex) ?? [])];
  host.innerHTML = `<div class="xp-layout shop-layout">
    <aside class="xp-sidebar">
      <button type="button" class="lab-btn--create" data-shop-action="create">+ Criar loja</button>
      <label class="lab-field">Busca
        <input type="search" id="shop-q" value="${escapeHtml(query)}" placeholder="id ou nome" />
      </label>
      <label class="lab-field">Mapa
        <select id="shop-map"><option value="0">Todos</option>${maps
          .map(
            (map) =>
              `<option value="${map}" ${mapFilter === map ? 'selected' : ''}>Mapa ${map}</option>`,
          )
          .join('')}</select>
      </label>
      ${renderShopList()}
      <div class="mb-backups"><h3>Backups</h3><ul class="xp-backup-list">${(
        payload?.backups ?? []
      )
        .slice(0, 12)
        .map(
          (backup) =>
            `<li><button type="button" class="lab-btn--info" data-shop-restore="${backup.id}">${backup.id}</button></li>`,
        )
        .join('')}</ul></div>
    </aside>
    <section class="xp-main shop-editor">${renderEditor()}</section>
  </div>`;

  host.querySelector('[data-shop-action="create"]')?.addEventListener('click', () => startCreate());
  host.querySelector('[data-shop-action="duplicate"]')?.addEventListener('click', () => {
    const current = readDraft();
    if (current) startCreate(current);
  });
  host.querySelector('[data-shop-action="save"]')?.addEventListener('click', () => {
    void saveDraft().catch((error: Error) => setStatus(error.message, true));
  });
  host.querySelector('[data-shop-action="delete"]')?.addEventListener('click', () => {
    void deleteSelected().catch((error: Error) => setStatus(error.message, true));
  });
  host.querySelectorAll<HTMLButtonElement>('[data-shop-select]').forEach((button) => {
    button.addEventListener('click', () => selectShopById(button.dataset.shopSelect!));
  });
  host.querySelectorAll<HTMLButtonElement>('[data-shop-restore]').forEach((button) => {
    button.addEventListener('click', () => {
      if (confirm(`Restaurar backup ${button.dataset.shopRestore}?`)) {
        void restoreBackup(button.dataset.shopRestore!).catch((error: Error) =>
          setStatus(error.message, true),
        );
      }
    });
  });
  const shopQueryInput = host.querySelector<HTMLInputElement>('#shop-q');
  shopQueryInput?.addEventListener(
    'input',
    debounce(() => {
      query = shopQueryInput.value.trim().toLowerCase();
      renderShops();
    }),
  );
  host.querySelector<HTMLSelectElement>('#shop-map')?.addEventListener('change', (event) => {
    mapFilter = Number((event.target as HTMLSelectElement).value);
    renderShops();
  });
  const itemQueryInput = host.querySelector<HTMLInputElement>('#shop-item-q');
  itemQueryInput?.addEventListener(
    'input',
    debounce(() => {
      readDraft();
      itemQuery = itemQueryInput.value.trim();
      renderShops();
    }),
  );
  host
    .querySelector<HTMLSelectElement>('#shop-item-selection-filter')
    ?.addEventListener('change', (event) => {
      readDraft();
      itemSelectionFilter = (event.target as HTMLSelectElement).value as ItemSelectionFilter;
      renderShops();
    });
  host
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-shop-field], [data-shop-item]')
    .forEach((field) => {
      field.addEventListener('change', () => {
        shopDirty = true;
        setWorkspaceDirty('shops', 1);
      });
      if (field instanceof HTMLInputElement && field.type !== 'checkbox') {
        field.addEventListener('input', () => {
          shopDirty = true;
          setWorkspaceDirty('shops', 1);
        });
      }
    });
  host.querySelectorAll<HTMLButtonElement>('[data-shop-pool-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const checked = button.dataset.shopPoolAction === 'select-visible';
      host.querySelectorAll<HTMLInputElement>('[data-shop-item]').forEach((input) => {
        input.checked = checked;
      });
      readDraft();
      shopDirty = true;
      renderShops();
    });
  });

  host.querySelector('#shop-preview-btn')?.addEventListener('click', () => {
    const seedInput = host.querySelector<HTMLInputElement>('#shop-preview-seed');
    const tierInput = host.querySelector<HTMLInputElement>('#shop-preview-tier');
    const result = host.querySelector<HTMLElement>('#shop-preview-result');
    if (!draft || !result) return;
    const seed = Number(seedInput?.value ?? 0);
    const tier = Number(tierInput?.value ?? 1);
    result.innerHTML = '<p class="lab-hint">Carregando…</p>';
    const params = new URLSearchParams({ seed: String(seed), tier: String(tier) });
    fetch(`/api/shops/${encodeURIComponent(draft.id)}/stock-preview?${params}`)
      .then((res) => res.json())
      .then((data: {
        ok: boolean;
        shopId: string;
        shopName: string;
        seed: number;
        tier: number;
        refreshCost: number;
        offers: Array<{ catalogItemId: string; name: string; rarity: string; basePrice: number; effectivePrice: number }>;
        error?: string;
      }) => {
        if (!data.ok) { result.innerHTML = `<p class="lab-hint">Erro: ${data.error ?? 'desconhecido'}</p>`; return; }
        const rarityColors: Record<string, string> = {
          common: 'var(--rar-common)', uncommon: 'var(--rar-uncommon)', rare: 'var(--rar-rare)',
          epic: 'var(--rar-epic)', legendary: 'var(--rar-legendary)', mythic: 'var(--rar-mythic)',
        };
        result.innerHTML = `
          <p class="lab-hint lab-hint--tight">Seed ${data.seed} · Tier ${data.tier} · Renovar: <strong class="res res--gold">${data.refreshCost}</strong> ouro</p>
          <div class="shop-item-grid">
            ${data.offers.map((offer) => `
              <div class="shop-preview-offer rarity--${offer.rarity}">
                <strong>${escapeHtml(offer.name)}</strong>
                <small style="color:${rarityColors[offer.rarity] ?? 'inherit'}">${offer.rarity}</small>
                <span class="res res--gold">${offer.effectivePrice} ouro</span>
                <small class="xp-muted">${escapeHtml(offer.catalogItemId)}</small>
              </div>`).join('')}
          </div>`;
      })
      .catch((err: Error) => { result.innerHTML = `<p class="lab-hint">Erro: ${err.message}</p>`; });
  });
}

export async function mountShopsTab(): Promise<void> {
  registerWorkspaceSave('shops', saveDraft);
  await loadShops();
  const first = payload?.shops[0];
  if (first) selectShopById(first.id);
  else renderShops();
  setStatus('Catálogo de lojas carregado.');
}
