/**
 * UI da distribuição editável de XP/ouro por fase no Balance Lab.
 */
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import { renderSparklinePair } from './sparkline';

interface PhaseRewardOverride {
  displayName?: string;
  targetXp?: number;
  targetGold?: number;
}

interface PhaseRewardRow {
  phaseId: string;
  phaseNumber: number;
  chapterMainPhase: number;
  displayName: string;
  baselineDisplayName: string;
  difficultyTier: number;
  waveCount: number;
  enemyCount: number;
  baselineXp: number;
  baselineGold: number;
  xpTotal: number;
  goldTotal: number;
  xpScale: number;
  earlyBoost: number;
  xpCumulative: number;
  goldCumulative: number;
  heroLevelAfter: number;
  hasOverride: boolean;
  override: PhaseRewardOverride | null;
}

interface PhaseRewardsMapSummary {
  mapId: string;
  mapName: string;
  mapIndex: number;
  phases: PhaseRewardRow[];
  xpTotal: number;
  goldTotal: number;
  heroLevelAtEnd: number;
}

interface ChapterOption {
  mainPhase: number;
  min: number;
  max: number;
  label: string;
}

interface BackupEntry {
  id: string;
  path: string;
}

interface PhaseRewardsPayload {
  maps: PhaseRewardsMapSummary[];
  chapters: ChapterOption[];
  knobs: { campaignXpKillMultiplier: number; note: string };
  updatedAt: string | null;
  backups: BackupEntry[];
}

/** Rascunho local dos alvos editáveis (por phaseId). */
const draftTargets = new Map<
  string,
  { displayName: string; targetXp: number; targetGold: number }
>();
const dirtyIds = new Set<string>();
/** Metadados de fases já vistas — permite salvar dirty de outro mapa/capítulo. */
const phaseIndex = new Map<string, PhaseRewardRow>();

let payload: PhaseRewardsPayload | null = null;
let filterMap = 'stendra';
let filterChapter = '';
let statusMessage = '';
let statusError = false;

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('xp-rewards-status');
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

function syncDraftFromPayload(mode: 'merge' | 'replace' = 'merge'): void {
  if (mode === 'replace') {
    draftTargets.clear();
    dirtyIds.clear();
    phaseIndex.clear();
  }
  for (const map of payload?.maps ?? []) {
    for (const phase of map.phases) {
      phaseIndex.set(phase.phaseId, phase);
      if (mode === 'merge' && dirtyIds.has(phase.phaseId)) continue;
      draftTargets.set(phase.phaseId, {
        displayName: phase.displayName,
        targetXp: phase.xpTotal,
        targetGold: phase.goldTotal,
      });
    }
  }
}

export async function loadPhaseRewards(options?: { resetDrafts?: boolean }): Promise<void> {
  const query = new URLSearchParams();
  if (filterMap) query.set('mapId', filterMap);
  if (filterChapter) query.set('chapterMain', filterChapter);
  const data = await api<{ ok: boolean } & PhaseRewardsPayload>(
    `/api/phase-rewards?${query.toString()}`,
  );
  payload = {
    maps: data.maps,
    chapters: data.chapters,
    knobs: data.knobs,
    updatedAt: data.updatedAt,
    backups: data.backups ?? [],
  };
  syncDraftFromPayload(options?.resetDrafts ? 'replace' : 'merge');
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

function buildPhaseSparklines(maps: PhaseRewardsMapSummary[]): string {
  const phases = maps.flatMap((m) => m.phases);
  if (phases.length === 0) return '';

  const xpValues = phases.map((p) => p.xpCumulative);
  const levelValues = phases.map((p) => p.heroLevelAfter);

  return renderSparklinePair(
    {
      values: xpValues,
      caption: 'XP acumulado por fase',
      color: 'var(--accent, #d4a850)',
    },
    {
      values: levelValues,
      caption: 'Nível projetado por fase',
      color: 'var(--rar-rare, #4080d8)',
    },
  );
}

function maxXpInView(maps: PhaseRewardsMapSummary[]): number {
  let max = 1;
  for (const map of maps) {
    for (const phase of map.phases) {
      const draft = draftTargets.get(phase.phaseId)?.targetXp ?? phase.xpTotal;
      if (draft > max) max = draft;
    }
  }
  return max;
}

function findPhaseRow(phaseId: string): PhaseRewardRow | null {
  const indexed = phaseIndex.get(phaseId);
  if (indexed) return indexed;
  for (const map of payload?.maps ?? []) {
    const row = map.phases.find((phase) => phase.phaseId === phaseId);
    if (row) return row;
  }
  return null;
}

function flushVisibleXpDrafts(): void {
  const host = document.getElementById('lab-xp-rewards');
  host?.querySelectorAll<HTMLElement>('tr[data-phase-id]').forEach((row) => {
    const phaseId = row.dataset.phaseId;
    if (!phaseId) return;
    markDirtyFromInput(phaseId, row);
  });
}

function markDirtyFromInput(phaseId: string, row: HTMLElement): void {
  const nameInput = row.querySelector<HTMLInputElement>('[data-field="displayName"]');
  const xpInput = row.querySelector<HTMLInputElement>('[data-field="targetXp"]');
  const goldInput = row.querySelector<HTMLInputElement>('[data-field="targetGold"]');
  if (!nameInput || !xpInput || !goldInput) return;
  const displayName = nameInput.value.trim();
  const targetXp = Math.max(0, Math.floor(Number(xpInput.value) || 0));
  const targetGold = Math.max(0, Math.floor(Number(goldInput.value) || 0));
  draftTargets.set(phaseId, { displayName, targetXp, targetGold });
  if (
    displayName !== (row.dataset.loadedName ?? '') ||
    targetXp !== Number(row.dataset.loadedXp) ||
    targetGold !== Number(row.dataset.loadedGold)
  ) {
    dirtyIds.add(phaseId);
    row.classList.add('is-dirty');
  } else {
    dirtyIds.delete(phaseId);
    row.classList.remove('is-dirty');
  }
  const saveBtn = document.getElementById('xp-save') as HTMLButtonElement | null;
  if (saveBtn) saveBtn.disabled = dirtyIds.size === 0;
  const el = document.getElementById('xp-dirty-count');
  if (el) el.textContent = dirtyIds.size > 0 ? `${dirtyIds.size} alteração(ões)` : '';
  setWorkspaceDirty('xp', dirtyIds.size);
}

async function saveDirty(): Promise<void> {
  flushVisibleXpDrafts();

  const overrides: Record<string, PhaseRewardOverride> = {};
  const clear: string[] = [];

  for (const phaseId of dirtyIds) {
    const draft = draftTargets.get(phaseId);
    if (!draft) continue;
    const row = findPhaseRow(phaseId);
    if (!row) continue;
    const baselineXp = Math.round(row.baselineXp);
    const baselineGold = Math.round(row.baselineGold);
    const effectiveName = draft.displayName.trim() || row.baselineDisplayName;
    const nameMatchesBaseline = effectiveName === row.baselineDisplayName;
    const rewardsMatchBaseline =
      draft.targetXp === baselineXp && draft.targetGold === baselineGold;
    if (nameMatchesBaseline && rewardsMatchBaseline) {
      clear.push(phaseId);
      continue;
    }
    const next: PhaseRewardOverride = {};
    if (!nameMatchesBaseline) {
      next.displayName = effectiveName;
    }
    if (draft.targetXp !== baselineXp) {
      next.targetXp = draft.targetXp;
    }
    if (draft.targetGold !== baselineGold) {
      next.targetGold = draft.targetGold;
    }
    overrides[phaseId] = next;
  }

  if (Object.keys(overrides).length === 0 && clear.length === 0) {
    setStatus('Nada para salvar.');
    return;
  }
  if (
    !(await confirmChangeReview('Salvar distribuição de XP e ouro', dirtyIds.size, {
      overrides,
      clear,
    }))
  ) {
    return;
  }

  await api('/api/phase-rewards', {
    method: 'PUT',
    body: JSON.stringify({ overrides, clear }),
  });
  await loadPhaseRewards({ resetDrafts: true });
  setStatus(
    `Salvo em phase-reward-overrides.json (${Object.keys(overrides).length} override(s), ${clear.length} limpo(s)). Rebuild da extensão para o jogo.`,
  );
  renderPhaseRewards();
}

async function clearPhaseOverride(phaseId: string): Promise<void> {
  await api(`/api/phase-rewards/${encodeURIComponent(phaseId)}`, { method: 'DELETE' });
  dirtyIds.delete(phaseId);
  await loadPhaseRewards({ resetDrafts: false });
  const row = findPhaseRow(phaseId);
  if (row) {
    draftTargets.set(phaseId, {
      displayName: row.displayName,
      targetXp: row.xpTotal,
      targetGold: row.goldTotal,
    });
  }
  setStatus(`Override removido: ${phaseId}`);
  renderPhaseRewards();
}

async function resetRowToBaseline(phaseId: string): Promise<void> {
  const row = findPhaseRow(phaseId);
  if (!row) return;
  draftTargets.set(phaseId, {
    displayName: row.baselineDisplayName,
    targetXp: Math.round(row.baselineXp),
    targetGold: Math.round(row.baselineGold),
  });
  dirtyIds.add(phaseId);
  renderPhaseRewards();
  setStatus(`${phaseId}: rascunho = baseline (salve para gravar/limpar override)`);
}

async function restoreBackup(backupId: string): Promise<void> {
  await api(`/api/phase-rewards-backups/${encodeURIComponent(backupId)}/restore`, {
    method: 'POST',
  });
  await loadPhaseRewards({ resetDrafts: true });
  setStatus(`Backup restaurado: ${backupId}`);
  renderPhaseRewards();
}

function renderTable(map: PhaseRewardsMapSummary, maxXp: number): string {
  const rows = map.phases
    .map((phase) => {
      const draft = draftTargets.get(phase.phaseId) ?? {
        displayName: phase.displayName,
        targetXp: phase.xpTotal,
        targetGold: phase.goldTotal,
      };
      const width = Math.max(2, Math.round((draft.targetXp / maxXp) * 100));
      const dirty = dirtyIds.has(phase.phaseId) ? ' is-dirty' : '';
      const badge = phase.hasOverride ? '<span class="xp-badge">override</span>' : '';
      const escapedName = draft.displayName
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
      return `
        <tr class="${dirty.trim()}" data-phase-id="${phase.phaseId}"
            data-baseline-xp="${phase.baselineXp}" data-baseline-gold="${phase.baselineGold}"
            data-loaded-xp="${phase.xpTotal}" data-loaded-gold="${phase.goldTotal}"
            data-loaded-name="${phase.displayName.replace(/"/g, '&quot;')}"
            data-has-override="${phase.hasOverride ? '1' : '0'}">
          <td><code>${phase.phaseId}</code> ${badge}</td>
          <td>
            <input type="text" class="xp-name-input" data-field="displayName" value="${escapedName}" />
          </td>
          <td class="xp-num">${phase.waveCount}</td>
          <td class="xp-num">${phase.enemyCount}</td>
          <td class="xp-num xp-muted">${fmt(phase.baselineXp)}</td>
          <td>
            <input class="xp-input--xp" type="number" min="0" step="1" data-field="targetXp" value="${
              draft.targetXp
            }" />
          </td>
          <td class="xp-bar-cell">
            <div class="xp-bar" title="${fmt(draft.targetXp)} XP">
              <span style="width:${width}%"></span>
            </div>
          </td>
          <td class="xp-num xp-muted">${fmt(phase.baselineGold)}</td>
          <td>
            <input class="xp-input--gold" type="number" min="0" step="1" data-field="targetGold" value="${
              draft.targetGold
            }" />
          </td>
          <td class="xp-num xp-num--xp">${fmt(phase.xpCumulative)}</td>
          <td class="xp-num xp-num--level">Lv ${phase.heroLevelAfter}</td>
          <td class="xp-actions">
            <button type="button" class="lab-btn--warn lab-btn--icon" data-action="baseline" title="Rascunho = baseline">↺</button>
            <button type="button" class="mb-btn-danger lab-btn--icon" data-action="clear" title="Apagar override" ${
              phase.hasOverride ? '' : 'disabled'
            }>×</button>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <section class="xp-map-block">
      <header class="xp-map-head">
        <h2>${map.mapName} <span class="xp-muted">(${map.mapId})</span></h2>
        <p>
          Total XP efetivo <strong class="res res--xp">${fmt(map.xpTotal)}</strong>
          · Ouro <strong class="res res--gold">${fmt(map.goldTotal)}</strong>
          · Nível ao limpar filtro <strong class="xp-num--level">Lv ${map.heroLevelAtEnd}</strong>
        </p>
      </header>
      <div class="xp-table-wrap">
        <table class="xp-table">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Nome</th>
              <th>Waves</th>
              <th>Inimigos</th>
              <th>XP base</th>
              <th>XP alvo</th>
              <th>Curva</th>
              <th>Ouro base</th>
              <th>Ouro alvo</th>
              <th>XP acum.</th>
              <th>Nível</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderPhaseRewards(): void {
  const host = document.getElementById('lab-xp-rewards');
  if (!host) return;
  setWorkspaceDirty('xp', dirtyIds.size);

  const maps = payload?.maps ?? [];
  const chapters = payload?.chapters ?? [];
  const backups = payload?.backups ?? [];
  const mapOptions = [
    { id: 'stendra', name: 'Stendra' },
    { id: 'gruftall', name: 'Gruftall' },
    { id: 'valdris', name: 'Valdris' },
    { id: 'morthaven', name: 'Morthaven' },
  ];
  const maxXp = maxXpInView(maps);

  host.innerHTML = `
    <div class="xp-layout">
      <aside class="xp-sidebar">
        <p class="lab-hint">
          Edite <strong>nome</strong>, <strong>XP alvo</strong> e <strong>Ouro alvo</strong> e
          salve como nas missões. O jogo usa o nome na UI e escala os kills para o alvo.
        </p>
        <div class="mb-filters">
          <label>Mapa
            <select id="xp-filter-map">
              ${mapOptions
                .map(
                  (map) =>
                    `<option value="${map.id}" ${filterMap === map.id ? 'selected' : ''}>${map.name}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Capítulo
            <select id="xp-filter-chapter">
              <option value="" ${filterChapter === '' ? 'selected' : ''}>Todos</option>
              ${chapters
                .map(
                  (chapter) =>
                    `<option value="${chapter.mainPhase}" ${
                      filterChapter === String(chapter.mainPhase) ? 'selected' : ''
                    }>${chapter.label}</option>`,
                )
                .join('')}
            </select>
          </label>
        </div>
        <div class="xp-toolbar">
          <button type="button" class="lab-btn--primary" id="xp-save" ${
            dirtyIds.size === 0 ? 'disabled' : ''
          }>
            ${
              dirtyIds.size > 1
                ? `Salvar tudo (${dirtyIds.size})`
                : 'Salvar no sistema'
            }
          </button>
          <span id="xp-dirty-count" class="xp-dirty-count">${
            dirtyIds.size > 0 ? `${dirtyIds.size} alteração(ões) — inclusive de outros mapas` : ''
          }</span>
        </div>
        <p class="lab-hint">${payload?.knobs.note ?? ''}</p>
        <p class="lab-hint">
          <code>CAMPAIGN_XP_KILL_MULTIPLIER</code> =
          <strong>${payload?.knobs.campaignXpKillMultiplier ?? '—'}</strong>
          ${
            payload?.updatedAt
              ? `<br/>overrides: <code>${payload.updatedAt}</code>`
              : ''
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
      </aside>
      <section class="xp-main">
        ${
          maps.length === 0
            ? '<p class="lab-hint">Nenhuma fase neste filtro.</p>'
            : buildPhaseSparklines(maps) + maps.map((map) => renderTable(map, maxXp)).join('')
        }
        <p id="xp-rewards-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>
  `;

  host.querySelector('#xp-filter-map')?.addEventListener('change', (event) => {
    flushVisibleXpDrafts();
    filterMap = (event.target as HTMLSelectElement).value;
    void loadPhaseRewards()
      .then(() => {
        setStatus(
          dirtyIds.size > 0
            ? `Mapa: ${filterMap} · ${dirtyIds.size} rascunho(s) pendente(s)`
            : `Mapa: ${filterMap}`,
        );
        renderPhaseRewards();
      })
      .catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelector('#xp-filter-chapter')?.addEventListener('change', (event) => {
    flushVisibleXpDrafts();
    filterChapter = (event.target as HTMLSelectElement).value;
    void loadPhaseRewards()
      .then(() => {
        const label = filterChapter ? `Capítulo ${filterChapter}` : 'Todos os capítulos';
        setStatus(
          dirtyIds.size > 0 ? `${label} · ${dirtyIds.size} rascunho(s) pendente(s)` : label,
        );
        renderPhaseRewards();
      })
      .catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelector('#xp-save')?.addEventListener('click', () => {
    void saveDirty().catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelectorAll<HTMLElement>('tr[data-phase-id]').forEach((row) => {
    const phaseId = row.dataset.phaseId!;
    row.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => markDirtyFromInput(phaseId, row));
      input.addEventListener('change', () => markDirtyFromInput(phaseId, row));
    });
    row.querySelector('[data-action="baseline"]')?.addEventListener('click', () => {
      void resetRowToBaseline(phaseId);
    });
    row.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      void clearPhaseOverride(phaseId).catch((error: Error) => setStatus(error.message, true));
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

export async function mountPhaseRewardsTab(): Promise<void> {
  registerWorkspaceSave('xp', saveDirty);
  await loadPhaseRewards();
  renderPhaseRewards();
  setStatus('Distribuição carregada — edite alvos e salve no sistema.');
}
