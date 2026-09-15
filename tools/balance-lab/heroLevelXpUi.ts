/**
 * UI da curva editável de XP por nível dos heróis no Balance Lab.
 */
import { withPreservedScroll } from './scrollPreserve';
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import { renderSparklinePair } from './sparkline';

interface LevelRow {
  level: number;
  segment: 'campaign' | 'legacy';
  baselineXp: number;
  xp: number;
  baselineCumulativeXp: number;
  cumulativeXp: number;
  growth: number;
  vsBaseline: number;
  hasOverride: boolean;
}

interface BandOption {
  min: number;
  max: number;
  label: string;
}

interface BackupEntry {
  id: string;
  path: string;
}

interface Payload {
  rows: LevelRow[];
  bands: BandOption[];
  totals: { baselineTotalXp: number; totalXp: number; overrideCount: number };
  knobs: { maxLevel: number; softCap: number; note: string };
  updatedAt: string | null;
  backups: BackupEntry[];
}

/** Rascunho local da XP por nível (mantido ao trocar de faixa). */
const draftXp = new Map<number, number>();
const dirtyLevels = new Set<number>();
/** Metadados de níveis já vistos — permite salvar dirty de outras faixas. */
const rowIndex = new Map<number, LevelRow>();

let payload: Payload | null = null;
let filterBand = '';
let statusMessage = '';
let statusError = false;

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('level-xp-status');
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

function syncDraftFromPayload(mode: 'merge' | 'replace'): void {
  if (mode === 'replace') {
    draftXp.clear();
    dirtyLevels.clear();
    rowIndex.clear();
  }
  for (const row of payload?.rows ?? []) {
    rowIndex.set(row.level, row);
    if (mode === 'merge' && dirtyLevels.has(row.level)) continue;
    draftXp.set(row.level, row.xp);
  }
}

export async function loadHeroLevelXp(options?: { resetDrafts?: boolean }): Promise<void> {
  const query = new URLSearchParams();
  if (filterBand) query.set('bandMin', filterBand);
  const data = await api<{ ok: boolean } & Payload>(`/api/hero-level-xp?${query.toString()}`);
  payload = {
    rows: data.rows,
    bands: data.bands,
    totals: data.totals,
    knobs: data.knobs,
    updatedAt: data.updatedAt,
    backups: data.backups ?? [],
  };
  syncDraftFromPayload(options?.resetDrafts ? 'replace' : 'merge');
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

function ratio(value: number): string {
  return `${value.toFixed(2)}×`;
}

/** Barra em escala log — a curva cresce de dezenas para bilhões. */
function barWidth(xp: number, maxXp: number): number {
  if (xp <= 0 || maxXp <= 1) return 2;
  const width = (Math.log10(1 + xp) / Math.log10(1 + maxXp)) * 100;
  return Math.max(2, Math.min(100, Math.round(width)));
}

function maxXpInView(rows: LevelRow[]): number {
  let max = 1;
  for (const row of rows) {
    const value = draftXp.get(row.level) ?? row.xp;
    if (value > max) max = value;
  }
  return max;
}

function buildLevelSparklines(rows: LevelRow[]): string {
  if (rows.length === 0) return '';
  const xpPerLevel = rows.map((r) => draftXp.get(r.level) ?? r.xp);
  const cumulativeXp = rows.map((r) => r.cumulativeXp);
  return renderSparklinePair(
    {
      values: xpPerLevel,
      caption: 'XP por nível (N→N+1)',
      color: 'var(--accent, #d4a850)',
    },
    {
      values: cumulativeXp,
      caption: 'XP acumulada total',
      color: 'var(--rar-rare, #4080d8)',
    },
  );
}

function updateDirtyChrome(): void {
  const saveBtn = document.getElementById('level-xp-save') as HTMLButtonElement | null;
  if (saveBtn) saveBtn.disabled = dirtyLevels.size === 0;
  const counter = document.getElementById('level-xp-dirty-count');
  if (counter) {
    counter.textContent =
      dirtyLevels.size > 0 ? `${dirtyLevels.size} alteração(ões)` : '';
  }
  setWorkspaceDirty('levels', dirtyLevels.size);
}

function markDirtyFromInput(level: number, tr: HTMLElement): void {
  const input = tr.querySelector<HTMLInputElement>('[data-field="xp"]');
  if (!input) return;
  const value = Math.max(0, Math.floor(Number(input.value) || 0));
  draftXp.set(level, value);
  if (value !== Number(tr.dataset.loadedXp)) {
    dirtyLevels.add(level);
    tr.classList.add('is-dirty');
  } else {
    dirtyLevels.delete(level);
    tr.classList.remove('is-dirty');
  }
  updateDirtyChrome();
}

function flushVisibleDrafts(): void {
  const host = document.getElementById('lab-level-xp');
  host?.querySelectorAll<HTMLElement>('tr[data-level]').forEach((tr) => {
    const level = Number(tr.dataset.level);
    if (!Number.isFinite(level)) return;
    markDirtyFromInput(level, tr);
  });
}

async function saveDirty(): Promise<void> {
  flushVisibleDrafts();

  const levels: Record<string, number> = {};
  const clear: number[] = [];

  for (const level of dirtyLevels) {
    const draft = draftXp.get(level);
    const row = rowIndex.get(level);
    if (draft === undefined || !row) continue;
    if (draft <= 0 || draft === Math.round(row.baselineXp)) {
      clear.push(level);
      continue;
    }
    levels[String(level)] = draft;
  }

  if (Object.keys(levels).length === 0 && clear.length === 0) {
    setStatus('Nada para salvar.');
    return;
  }
  if (
    !(await confirmChangeReview('Salvar curva de XP por nível', dirtyLevels.size, {
      levels,
      clear,
    }))
  ) {
    return;
  }

  await api('/api/hero-level-xp', {
    method: 'PUT',
    body: JSON.stringify({ levels, clear }),
  });
  await loadHeroLevelXp({ resetDrafts: true });
  setStatus(
    `Salvo em hero-level-xp-overrides.json (${Object.keys(levels).length} override(s), ${clear.length} limpo(s)). Rebuild da extensão para o jogo.`,
  );
  renderHeroLevelXp();
}

async function clearLevelOverride(level: number): Promise<void> {
  await api(`/api/hero-level-xp/${level}`, { method: 'DELETE' });
  dirtyLevels.delete(level);
  await loadHeroLevelXp({ resetDrafts: false });
  const row = rowIndex.get(level);
  if (row) draftXp.set(level, row.xp);
  setStatus(`Override removido: nível ${level}`);
  renderHeroLevelXp();
}

function resetRowToBaseline(level: number): void {
  const row = rowIndex.get(level);
  if (!row) return;
  draftXp.set(level, Math.round(row.baselineXp));
  dirtyLevels.add(level);
  renderHeroLevelXp();
  setStatus(`Nível ${level}: rascunho = baseline (salve para gravar/limpar override)`);
}

async function restoreBackup(backupId: string): Promise<void> {
  await api(`/api/hero-level-xp-backups/${encodeURIComponent(backupId)}/restore`, {
    method: 'POST',
  });
  await loadHeroLevelXp({ resetDrafts: true });
  setStatus(`Backup restaurado: ${backupId}`);
  renderHeroLevelXp();
}

function renderRows(rows: LevelRow[], maxXp: number): string {
  return rows
    .map((row) => {
      const draft = draftXp.get(row.level) ?? row.xp;
      const dirty = dirtyLevels.has(row.level) ? ' is-dirty' : '';
      const badge = row.hasOverride ? '<span class="xp-badge">override</span>' : '';
      const segment = row.segment === 'campaign' ? 'curva' : 'tabela';
      const cumulativeDelta = draft - row.xp;
      const cumulative = row.cumulativeXp + cumulativeDelta;
      return `
        <tr class="${dirty.trim()}" data-level="${row.level}"
            data-baseline-xp="${Math.round(row.baselineXp)}"
            data-loaded-xp="${row.xp}"
            data-has-override="${row.hasOverride ? '1' : '0'}">
          <td><strong class="xp-num--level">Lv ${row.level}</strong> → ${
            row.level + 1
          } ${badge}</td>
          <td class="xp-num xp-muted">${segment}</td>
          <td class="xp-num xp-muted">${fmt(row.baselineXp)}</td>
          <td>
            <input class="xp-input--xp" type="number" min="0" step="1" data-field="xp" value="${draft}" />
          </td>
          <td class="xp-bar-cell">
            <div class="xp-bar" title="${fmt(draft)} XP (escala log)">
              <span style="width:${barWidth(draft, maxXp)}%"></span>
            </div>
          </td>
          <td class="xp-num">${ratio(row.growth)}</td>
          <td class="xp-num">${
            row.baselineXp > 0 ? ratio(draft / row.baselineXp) : '—'
          }</td>
          <td class="xp-num xp-num--xp">${fmt(cumulative)}</td>
          <td class="xp-actions">
            <button type="button" class="lab-btn--warn lab-btn--icon" data-action="baseline" title="Rascunho = baseline">↺</button>
            <button type="button" class="mb-btn-danger lab-btn--icon" data-action="clear" title="Apagar override" ${
              row.hasOverride ? '' : 'disabled'
            }>×</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

export function renderHeroLevelXp(): void {
  const host = document.getElementById('lab-level-xp');
  if (!host) return;
  setWorkspaceDirty('levels', dirtyLevels.size);

  const rows = payload?.rows ?? [];
  const bands = payload?.bands ?? [];
  const backups = payload?.backups ?? [];
  const maxXp = maxXpInView(rows);

  withPreservedScroll(host, ['.xp-table-wrap', '.xp-sidebar'], () => {
    host.innerHTML = `
    <div class="xp-layout">
      <aside class="xp-sidebar">
        <p class="lab-hint">
          Edite a <strong>XP para subir</strong> de cada nível. O jogo usa a curva
          efetiva em <code>Experience</code> (barra do herói, level-up e nível
          projetado da aba XP por fase).
        </p>
        <div class="mb-filters">
          <label>Faixa
            <select id="level-xp-filter-band">
              <option value="" ${filterBand === '' ? 'selected' : ''}>Todos os níveis</option>
              ${bands
                .map(
                  (band) =>
                    `<option value="${band.min}" ${
                      filterBand === String(band.min) ? 'selected' : ''
                    }>${band.label}</option>`,
                )
                .join('')}
            </select>
          </label>
        </div>
        <div class="xp-toolbar">
          <button type="button" class="lab-btn--primary" id="level-xp-save" ${
            dirtyLevels.size === 0 ? 'disabled' : ''
          }>
            ${dirtyLevels.size > 1 ? `Salvar tudo (${dirtyLevels.size})` : 'Salvar no sistema'}
          </button>
          <span id="level-xp-dirty-count" class="xp-dirty-count">${
            dirtyLevels.size > 0
              ? `${dirtyLevels.size} alteração(ões) — inclusive de outras faixas`
              : ''
          }</span>
        </div>
        <p class="lab-hint">${payload?.knobs.note ?? ''}</p>
        <p class="lab-hint">
          XP total 1 → ${payload?.knobs.maxLevel ?? '—'}:
          <strong class="res res--xp">${fmt(payload?.totals.totalXp ?? 0)}</strong>
          ${
            payload && payload.totals.totalXp !== payload.totals.baselineTotalXp
              ? `<br/>baseline: <code>${fmt(payload.totals.baselineTotalXp)}</code>`
              : ''
          }
          <br/>overrides ativos: <strong>${payload?.totals.overrideCount ?? 0}</strong>
          ${payload?.updatedAt ? `<br/>arquivo: <code>${payload.updatedAt}</code>` : ''}
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
      </aside>
      <section class="xp-main">
        ${
          rows.length === 0
            ? '<p class="lab-hint">Nenhum nível nesta faixa.</p>'
            : buildLevelSparklines(rows) + `<section class="xp-map-block">
                <header class="xp-map-head">
                  <h2>Progressão de XP por nível</h2>
                  <p>
                    ${rows.length} nível(is) em tela · soft cap da curva de campanha
                    <strong>Lv ${payload?.knobs.softCap ?? '—'}</strong>
                    · nível máximo <strong>Lv ${payload?.knobs.maxLevel ?? '—'}</strong>
                  </p>
                </header>
                <div class="xp-table-wrap">
                  <table class="xp-table">
                    <thead>
                      <tr>
                        <th>Nível</th>
                        <th>Origem</th>
                        <th>XP base</th>
                        <th>XP p/ subir</th>
                        <th>Curva (log)</th>
                        <th>vs anterior</th>
                        <th>vs base</th>
                        <th>XP acum.</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>${renderRows(rows, maxXp)}</tbody>
                  </table>
                </div>
              </section>`
        }
        <p id="level-xp-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>
  `;
  });

  host.querySelector('#level-xp-filter-band')?.addEventListener('change', (event) => {
    flushVisibleDrafts();
    filterBand = (event.target as HTMLSelectElement).value;
    void loadHeroLevelXp()
      .then(() => {
        const label = filterBand ? `Faixa a partir do Lv ${filterBand}` : 'Todos os níveis';
        setStatus(
          dirtyLevels.size > 0
            ? `${label} · ${dirtyLevels.size} rascunho(s) pendente(s)`
            : label,
        );
        renderHeroLevelXp();
      })
      .catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelector('#level-xp-save')?.addEventListener('click', () => {
    void saveDirty().catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelectorAll<HTMLElement>('tr[data-level]').forEach((tr) => {
    const level = Number(tr.dataset.level);
    tr.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => markDirtyFromInput(level, tr));
      input.addEventListener('change', () => markDirtyFromInput(level, tr));
    });
    tr.querySelector('[data-action="baseline"]')?.addEventListener('click', () => {
      resetRowToBaseline(level);
    });
    tr.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      void clearLevelOverride(level).catch((error: Error) => setStatus(error.message, true));
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
}

export async function mountHeroLevelXpTab(): Promise<void> {
  registerWorkspaceSave('levels', saveDirty);
  await loadHeroLevelXp();
  renderHeroLevelXp();
  setStatus('Curva carregada — edite a XP por nível e salve no sistema.');
}
