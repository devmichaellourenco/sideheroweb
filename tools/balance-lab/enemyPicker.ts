/**
 * Seletor visual de inimigos com miniatura (Balance Lab).
 */
import { enemySpriteFallbackUrlForLab, enemySpriteUrlForLab } from './enemySprites';

export interface LabEnemyOption {
  id: string;
  name: string;
  tier?: number;
  powerTier?: number;
  rosterRole?: string;
  spriteUrl?: string;
}

type PickHandler = (enemyId: string) => void;

let pendingPick: PickHandler | null = null;
let dialogEl: HTMLDialogElement | null = null;
let cachedEnemies: LabEnemyOption[] = [];

function tierOf(enemy: LabEnemyOption): number {
  return enemy.powerTier ?? enemy.tier ?? 0;
}

export function spriteUrlOf(enemy: LabEnemyOption | undefined, enemyId: string): string {
  return enemy?.spriteUrl ?? enemySpriteUrlForLab(enemyId);
}

export function bindSpriteFallback(img: HTMLImageElement): void {
  img.addEventListener(
    'error',
    () => {
      const fallback = enemySpriteFallbackUrlForLab();
      if (img.src.endsWith(fallback) || img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      img.src = fallback;
    },
    { once: true },
  );
}

export function enemyThumbHtml(
  enemyId: string,
  enemies: readonly LabEnemyOption[],
  className = 'lab-enemy-thumb',
): string {
  const enemy = enemies.find((entry) => entry.id === enemyId);
  const src = spriteUrlOf(enemy, enemyId);
  const alt = enemy?.name ?? enemyId;
  return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" data-enemy-thumb="${enemyId}" />`;
}

function ensureDialog(): HTMLDialogElement {
  if (dialogEl && document.body.contains(dialogEl)) return dialogEl;

  dialogEl = document.createElement('dialog');
  dialogEl.id = 'lab-enemy-picker-dialog';
  dialogEl.className = 'lab-enemy-picker-dialog';
  dialogEl.innerHTML = `
    <form method="dialog" class="lab-enemy-picker-shell">
      <header class="lab-enemy-picker-head">
        <strong>Escolher inimigo</strong>
        <button type="submit" value="cancel" class="lab-enemy-picker-close" aria-label="Fechar">×</button>
      </header>
      <label class="lab-enemy-picker-search">
        Buscar
        <input type="search" id="lab-enemy-picker-q" placeholder="nome ou id" />
      </label>
      <div class="lab-enemy-picker-grid" id="lab-enemy-picker-grid"></div>
    </form>
  `;
  document.body.appendChild(dialogEl);

  dialogEl.addEventListener('close', () => {
    pendingPick = null;
  });

  const search = dialogEl.querySelector('#lab-enemy-picker-q') as HTMLInputElement | null;
  search?.addEventListener('input', () => {
    renderGrid(search.value, dialogEl?.dataset.selectedId ?? '');
  });

  return dialogEl;
}

function renderGrid(query: string, selectedId: string): void {
  const grid = document.getElementById('lab-enemy-picker-grid');
  if (!grid) return;
  const q = query.trim().toLowerCase();
  const list = cachedEnemies.filter((enemy) => {
    if (!q) return true;
    return (
      enemy.id.toLowerCase().includes(q) ||
      enemy.name.toLowerCase().includes(q) ||
      String(tierOf(enemy)).includes(q)
    );
  });

  grid.innerHTML = list
    .map((enemy) => {
      const active = enemy.id === selectedId ? ' is-selected' : '';
      const role = enemy.rosterRole ? ` · ${enemy.rosterRole}` : '';
      return `
        <button type="button" class="lab-enemy-picker-item${active}" data-pick-enemy="${enemy.id}">
          ${enemyThumbHtml(enemy.id, cachedEnemies, 'lab-enemy-picker-thumb')}
          <span class="lab-enemy-picker-name">${enemy.name}</span>
          <span class="lab-enemy-picker-meta">T${tierOf(enemy)}${role}</span>
        </button>
      `;
    })
    .join('');

  grid.querySelectorAll<HTMLImageElement>('img[data-enemy-thumb]').forEach(bindSpriteFallback);

  grid.querySelectorAll<HTMLButtonElement>('[data-pick-enemy]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.pickEnemy;
      if (!id || !pendingPick) return;
      const handler = pendingPick;
      pendingPick = null;
      dialogEl?.close();
      handler(id);
    });
  });
}

export function openEnemyPicker(params: {
  enemies: readonly LabEnemyOption[];
  selectedId: string;
  onPick: PickHandler;
}): void {
  cachedEnemies = [...params.enemies];
  const dialog = ensureDialog();
  dialog.dataset.selectedId = params.selectedId;
  pendingPick = params.onPick;
  const search = dialog.querySelector('#lab-enemy-picker-q') as HTMLInputElement | null;
  if (search) search.value = '';
  renderGrid('', params.selectedId);
  dialog.showModal();
  search?.focus();
}

export function enemyTriggerHtml(params: {
  enemyId: string;
  enemies: readonly LabEnemyOption[];
  openAction?: string;
}): string {
  const enemy = params.enemies.find((entry) => entry.id === params.enemyId);
  const name = enemy?.name ?? params.enemyId;
  const tier = enemy ? `T${tierOf(enemy)}` : '';
  const action = params.openAction ?? 'open-enemy-picker';
  return `
    <button type="button" class="lab-enemy-trigger" data-action="${action}" title="${name}">
      ${enemyThumbHtml(params.enemyId, params.enemies)}
      <span class="lab-enemy-trigger-text">
        <strong>${name}</strong>
        <small>${tier}</small>
      </span>
    </button>
  `;
}
