/**
 * UI do editor de batalhas de missões no Balance Lab.
 */

import {
  bindSpriteFallback,
  enemyTriggerHtml,
  openEnemyPicker,
} from './enemyPicker';
import { confirmChangeReview } from './changeReview';
import { debounce } from './debounce';
import { enemySpriteUrlForLab } from './enemySprites';
import { withPreservedScroll } from './scrollPreserve';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import {
  getReferenceParty,
  renderPartyEditorHtml,
  bindPartyEditor,
  partyToQueryParam,
  partyLabel,
} from './referenceParty';
import { openEnemyInSimulator } from './navigation';
import {
  renderRunsSelectHtml,
  readRunsSelect,
  renderProfileSelectHtml,
  readProfileSelect,
  getRefPartyForApi,
  fetchCombatSim,
  renderSimResult,
} from './combatSimUi';
import {
  bindArenaControls,
  disposeArenaPlayback,
  renderArenaShellHtml,
  type ArenaDraftPayload,
} from './missionBattleArenaUi';
import { renderSweepPanelHtml, bindSweepPanel } from './combatSweepUi';
import {
  buildChapterTrack,
  computeTrackTipPosition,
  missionMatchesTrackFilters,
  type ChapterTrack,
  type TrackMissionEntry,
} from './missionChapterTrack';

type MissionKind = 'main' | 'side' | 'normal';

interface MissionListEntry {
  missionId: string;
  kind: MissionKind;
  mapId: string;
  name: string;
  phaseTemplateId: string;
  phaseNumber: number;
  chapterMainPhase: number;
  chapterMin: number;
  chapterMax: number;
  stars: number | null;
  hasOverride: boolean;
  waveCount: number;
  sharedMissionIds: string[];
  isSeed?: boolean;
  isCustom?: boolean;
  fromOverride?: boolean;
  hasChildren?: boolean;
  canDelete?: boolean;
  canChangeKind?: boolean;
}

interface ChapterOption {
  mainPhase: number;
  min: number;
  max: number;
  label: string;
}

interface EnemyOption {
  id: string;
  name: string;
  powerTier: number;
  rosterRole: string;
  spriteUrl?: string;
}

interface EnemySlotDraft {
  enemyType: string;
  role: 'trash' | 'elite' | 'boss';
  count: number;
  displayName?: string;
  level?: number;
}

interface WaveDraft {
  id: string;
  goldMultiplier?: number;
  slots: EnemySlotDraft[];
}

interface BattleDraft {
  displayName: string;
  statMultiplier: number;
  waves: WaveDraft[];
}

const ROLES: Array<EnemySlotDraft['role']> = ['trash', 'elite', 'boss'];

interface BackupEntry {
  id: string;
  path: string;
}

let enemies: EnemyOption[] = [];
let missions: MissionListEntry[] = [];
/** Catálogo do mapa ativo (sem kind/capítulo/q) — fonte da trilha. */
let trackMissions: MissionListEntry[] = [];
let chapters: ChapterOption[] = [];
let maps: string[] = [];
let phasesByMap: Record<string, string[]> = {};
let backups: BackupEntry[] = [];
let createModalOpen = false;
let selectedId: string | null = null;
let selectedMission: MissionListEntry | null = null;
let trackTipEl: HTMLElement | null = null;
let draft: BattleDraft | null = null;
/** Rascunhos por missão — sobrevivem à troca de item até salvar. */
const draftsByMissionId = new Map<string, BattleDraft>();
/** Snapshot JSON do que veio do servidor (para detectar dirty). */
const loadedSnapshotByMissionId = new Map<string, string>();
const dirtyMissionIds = new Set<string>();
let filterKind: '' | MissionKind = '';
let filterMap = '';
let filterChapter = '';
let filterQuery = '';
let statusMessage = '';
let statusError = false;

function cloneDraft(value: BattleDraft): BattleDraft {
  return JSON.parse(JSON.stringify(value)) as BattleDraft;
}

function snapshotDraft(value: BattleDraft): string {
  return JSON.stringify(value);
}

function dirtyMissionCount(): number {
  return dirtyMissionIds.size;
}

function updateMissionDirtyChrome(): void {
  const saveBtn = document.getElementById('mb-save') as HTMLButtonElement | null;
  const count = dirtyMissionCount();
  if (saveBtn) {
    saveBtn.disabled = count === 0;
    saveBtn.textContent =
      count > 1 ? `Salvar tudo (${count})` : count === 1 ? 'Salvar no sistema' : 'Salvar no sistema';
  }
  const el = document.getElementById('mb-dirty-count');
  if (el) el.textContent = count > 0 ? `${count} missão(ões) alterada(s)` : '';
}

function markCurrentMissionDirtyState(): void {
  if (!selectedId || !draft) return;
  draftsByMissionId.set(selectedId, cloneDraft(draft));
  const loaded = loadedSnapshotByMissionId.get(selectedId);
  if (!loaded || loaded !== snapshotDraft(draft)) dirtyMissionIds.add(selectedId);
  else dirtyMissionIds.delete(selectedId);
  updateMissionDirtyChrome();
}

/** Grava o editor atual no mapa de rascunhos antes de trocar de missão. */
function stashCurrentMissionDraft(root?: HTMLElement | null): void {
  if (!selectedId || !draft) return;
  const host = root ?? document.getElementById('lab-missions');
  if (host) readDraftFromDom(host);
  markCurrentMissionDirtyState();
}

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('missions-status');
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

function emptySlot(): EnemySlotDraft {
  return {
    enemyType: enemies[0]?.id ?? 'goblin_raider',
    role: 'trash',
    count: 1,
  };
}

function emptyWave(index: number): WaveDraft {
  return { id: `w${index + 1}`, goldMultiplier: 1, slots: [emptySlot()] };
}

function phaseToDraft(phase: {
  displayName: string;
  statMultiplier?: number;
  waves: WaveDraft[];
}): BattleDraft {
  return {
    displayName: phase.displayName,
    statMultiplier: phase.statMultiplier ?? 1,
    waves: phase.waves.map((wave, index) => ({
      id: wave.id || `w${index + 1}`,
      goldMultiplier: wave.goldMultiplier ?? 1,
      slots: wave.slots.map((slot) => ({
        enemyType: slot.enemyType,
        role: slot.role,
        count: slot.count,
        displayName: slot.displayName,
        level: slot.level,
      })),
    })),
  };
}

function starsLabel(stars: number | null): string {
  if (!stars) return '';
  return `★${stars}`;
}

function resolveTrackMapId(availableMaps: string[]): string {
  if (filterMap) return filterMap;
  return availableMaps[0] ?? maps[0] ?? '';
}

export async function loadMissionBattlesList(): Promise<void> {
  const query = new URLSearchParams();
  if (filterKind) query.set('kind', filterKind);
  if (filterMap) query.set('mapId', filterMap);
  if (filterChapter) query.set('chapterMain', filterChapter);
  if (filterQuery.trim()) query.set('q', filterQuery.trim());
  const data = await api<{
    missions: MissionListEntry[];
    enemies: EnemyOption[];
    chapters?: ChapterOption[];
    maps?: string[];
    phasesByMap?: Record<string, string[]>;
    backups?: BackupEntry[];
  }>(`/api/mission-battles?${query.toString()}`);
  enemies = data.enemies;
  missions = data.missions;
  chapters = data.chapters ?? chapters;
  maps = data.maps ?? maps;
  phasesByMap = data.phasesByMap ?? phasesByMap;
  backups = data.backups ?? [];

  const trackMapId = resolveTrackMapId(maps);
  if (!trackMapId) {
    trackMissions = [];
    return;
  }
  if (filterMap && !filterKind && !filterChapter && !filterQuery.trim()) {
    trackMissions = missions;
    return;
  }
  const trackQuery = new URLSearchParams();
  trackQuery.set('mapId', trackMapId);
  const trackData = await api<{
    missions: MissionListEntry[];
    phasesByMap?: Record<string, string[]>;
  }>(`/api/mission-battles?${trackQuery.toString()}`);
  trackMissions = trackData.missions;
  if (trackData.phasesByMap) phasesByMap = trackData.phasesByMap;
}

export async function selectMission(missionId: string): Promise<void> {
  stashCurrentMissionDraft();
  const resolvedMissionId =
    missions.find(
      (mission) =>
        mission.missionId === missionId || mission.phaseTemplateId === missionId,
    )?.missionId ??
    trackMissions.find(
      (mission) =>
        mission.missionId === missionId || mission.phaseTemplateId === missionId,
    )?.missionId ??
    missionId;

  const data = await api<{
    mission: MissionListEntry;
    phase: { displayName: string; statMultiplier?: number; waves: WaveDraft[] };
  }>(`/api/mission-battles/${encodeURIComponent(resolvedMissionId)}`);
  selectedId = resolvedMissionId;
  selectedMission = data.mission;

  const cached = draftsByMissionId.get(resolvedMissionId);
  if (cached && dirtyMissionIds.has(resolvedMissionId)) {
    draft = cloneDraft(cached);
  } else {
    draft = phaseToDraft(data.phase);
    draftsByMissionId.set(resolvedMissionId, cloneDraft(draft));
    loadedSnapshotByMissionId.set(resolvedMissionId, snapshotDraft(draft));
    dirtyMissionIds.delete(resolvedMissionId);
  }

  const shared =
    data.mission.sharedMissionIds.length > 0
      ? ` · compartilhada com ${data.mission.sharedMissionIds.join(', ')}`
      : '';
  const pending =
    dirtyMissionCount() > 0 ? ` · ${dirtyMissionCount()} rascunho(s) pendente(s)` : '';
  setStatus(
    `Cap. ${data.mission.chapterMainPhase} (${data.mission.chapterMin}–${data.mission.chapterMax}) · ${data.mission.name} · ${data.mission.phaseTemplateId}${shared}${pending}`,
  );
}

async function saveAllDirty(): Promise<void> {
  stashCurrentMissionDraft();
  if (dirtyMissionIds.size === 0) {
    setStatus('Nada para salvar.');
    return;
  }

  const updates: Record<string, BattleDraft> = {};
  for (const missionId of dirtyMissionIds) {
    const pending = draftsByMissionId.get(missionId);
    if (!pending) continue;
    updates[missionId] = pending;
  }

  if (Object.keys(updates).length === 0) {
    setStatus('Nada para salvar.');
    return;
  }
  if (
    !(await confirmChangeReview('Salvar batalhas das missões', dirtyMissionIds.size, updates))
  ) {
    return;
  }

  const data = await api<{
    backupPath: string | null;
    saved: Array<{ missionId: string; phaseTemplateId: string }>;
  }>('/api/mission-battles', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });

  for (const missionId of Object.keys(updates)) {
    const savedDraft = updates[missionId]!;
    loadedSnapshotByMissionId.set(missionId, snapshotDraft(savedDraft));
    draftsByMissionId.set(missionId, cloneDraft(savedDraft));
    dirtyMissionIds.delete(missionId);
  }

  await loadMissionBattlesList();
  if (selectedId && draftsByMissionId.has(selectedId)) {
    draft = cloneDraft(draftsByMissionId.get(selectedId)!);
    const meta = missions.find((mission) => mission.missionId === selectedId);
    if (meta) selectedMission = meta;
  }

  setStatus(
    `Salvas ${data.saved.length} missão(ões) em phase-battle-overrides.json${
      data.backupPath ? ` · 1 backup` : ''
    }`,
  );
}

async function clearOverride(): Promise<void> {
  if (!selectedId) return;
  if (!confirm('Remover override e voltar ao baseline do catálogo?')) return;
  stashCurrentMissionDraft();
  await api(`/api/mission-battles/${encodeURIComponent(selectedId)}`, {
    method: 'DELETE',
  });
  dirtyMissionIds.delete(selectedId);
  draftsByMissionId.delete(selectedId);
  loadedSnapshotByMissionId.delete(selectedId);
  await selectMission(selectedId);
  await loadMissionBattlesList();
  setStatus('Override removido (baseline restaurado).');
}

async function resetToBaseline(): Promise<void> {
  if (!selectedId) return;
  const data = await api<{
    baselinePhase: { displayName: string; statMultiplier?: number; waves: WaveDraft[] };
  }>(`/api/mission-battles/${encodeURIComponent(selectedId)}`);
  draft = phaseToDraft(data.baselinePhase);
  draftsByMissionId.set(selectedId, cloneDraft(draft));
  dirtyMissionIds.add(selectedId);
  setStatus('Rascunho resetado para o baseline (ainda não salvo).');
  renderMissionsEditor();
}

async function restoreBackup(backupId: string): Promise<void> {
  if (!confirm(`Restaurar backup ${backupId}? O arquivo atual será backupado antes.`)) return;
  await api(`/api/mission-battles-backups/${encodeURIComponent(backupId)}/restore`, {
    method: 'POST',
    body: '{}',
  });
  draftsByMissionId.clear();
  loadedSnapshotByMissionId.clear();
  dirtyMissionIds.clear();
  await loadMissionBattlesList();
  if (selectedId) await selectMission(selectedId);
  setStatus(`Backup restaurado: ${backupId}`);
}

function renderEnemyField(selectedId: string, waveIndex: number, slotIndex: number): string {
  const withUrls = enemies.map((enemy) => ({
    ...enemy,
    spriteUrl: enemy.spriteUrl ?? enemySpriteUrlForLab(enemy.id),
  }));
  return `
    <div class="mb-enemy-field" data-wave="${waveIndex}" data-slot="${slotIndex}">
      <input type="hidden" data-field="enemyType" value="${selectedId}" />
      ${enemyTriggerHtml({ enemyId: selectedId, enemies: withUrls })}
    </div>
  `;
}

function renderWaveEditor(wave: WaveDraft, waveIndex: number): string {
  const slots = wave.slots
    .map((slot, slotIndex) => {
      return `
        <div class="mb-slot" data-wave="${waveIndex}" data-slot="${slotIndex}">
          <label class="mb-slot-enemy">inimigo
            ${renderEnemyField(slot.enemyType, waveIndex, slotIndex)}
          </label>
          <label>role
            <select data-field="role">
              ${ROLES.map(
                (role) =>
                  `<option value="${role}" ${slot.role === role ? 'selected' : ''}>${role}</option>`,
              ).join('')}
            </select>
          </label>
          <label>qtd
            <input type="number" min="1" data-field="count" value="${slot.count}" />
          </label>
          <label>nome
            <input type="text" data-field="displayName" value="${slot.displayName ?? ''}" />
          </label>
          <label>level
            <input type="number" data-field="level" value="${slot.level ?? ''}" placeholder="auto" />
          </label>
          <button type="button" class="mb-btn-danger lab-btn--icon" data-action="remove-slot" title="Remover slot">×</button>
        </div>
      `;
    })
    .join('');

  const firstSlot = wave.slots[0];
  const openSimBtn = firstSlot
    ? `<button type="button" class="lab-btn--info"
         data-open-enemy-sim="${firstSlot.enemyType}"
         data-open-enemy-level="${firstSlot.level ?? 1}"
         data-open-enemy-role="${firstSlot.role}"
         title="${wave.slots.length > 1 ? 'Abre o 1º slot da wave' : ''}"
       >▶ Sim${wave.slots.length > 1 ? ' (1º slot)' : ''}</button>`
    : '';

  return `
    <section class="mb-wave" data-wave-index="${waveIndex}">
      <header class="mb-wave-head">
        <strong>Wave ${waveIndex + 1}</strong>
        <label>id <input type="text" data-field="id" value="${wave.id}" /></label>
        <label class="mb-field--gold">ouro × <input type="number" step="0.05" min="0" data-field="goldMultiplier" value="${wave.goldMultiplier ?? 1}" /></label>
        ${openSimBtn}
        <button type="button" class="lab-btn--create" data-action="add-slot">+ slot</button>
        <button type="button" class="mb-btn-danger" data-action="remove-wave">Remover wave</button>
      </header>
      <div class="mb-slots">${slots}</div>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kindShortLabel(kind: MissionKind): string {
  if (kind === 'main') return 'Main';
  if (kind === 'side') return 'Side';
  return 'Normal';
}

function ensureTrackTip(): HTMLElement {
  if (trackTipEl && document.body.contains(trackTipEl)) return trackTipEl;
  trackTipEl = document.createElement('div');
  trackTipEl.className = 'mb-track-tip';
  trackTipEl.hidden = true;
  trackTipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(trackTipEl);
  return trackTipEl;
}

function hideTrackTip(): void {
  if (!trackTipEl) return;
  trackTipEl.hidden = true;
  trackTipEl.innerHTML = '';
}

function showTrackTip(anchor: HTMLElement, mission: TrackMissionEntry): void {
  const tip = ensureTrackTip();
  const shared =
    mission.sharedMissionIds.length > 0
      ? `<div><span class="mb-track-tip-k">Shared</span> ${escapeHtml(mission.sharedMissionIds.join(', '))}</div>`
      : '';
  tip.innerHTML = `
    <div class="mb-track-tip-title">${escapeHtml(mission.name)}</div>
    <div class="mb-track-tip-row">
      <span class="mb-track-tip-kind mb-track-tip-kind--${mission.kind}">${kindShortLabel(mission.kind)}</span>
      <code>${escapeHtml(mission.phaseTemplateId)}</code>
    </div>
    <div><span class="mb-track-tip-k">Waves</span> ${mission.waveCount}</div>
    <div><span class="mb-track-tip-k">Stars</span> ${mission.stars ?? '—'}</div>
    <div><span class="mb-track-tip-k">Override</span> ${mission.hasOverride ? 'sim' : 'baseline'}</div>
    ${shared}
  `;
  tip.hidden = false;
  tip.style.left = '0px';
  tip.style.top = '0px';

  const anchorRect = anchor.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const pos = computeTrackTipPosition({
    anchor: {
      top: anchorRect.top,
      left: anchorRect.left,
      width: anchorRect.width,
      height: anchorRect.height,
    },
    tip: {
      top: 0,
      left: 0,
      width: tipRect.width,
      height: tipRect.height,
    },
    viewport: {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    margin: 8,
  });
  tip.style.left = `${pos.left}px`;
  tip.style.top = `${pos.top}px`;
  tip.dataset.placement = pos.placement;
}

function renderTrackNode(
  mission: TrackMissionEntry | null,
  opts: { role: 'main' | 'child'; selectedId: string | null; dimmed: boolean },
): string {
  if (!mission) {
    return `<span class="mb-track-node mb-track-node--empty" aria-hidden="true">—</span>`;
  }
  const selected = opts.selectedId === mission.missionId;
  const classes = [
    'mb-track-node',
    opts.role === 'main' ? 'mb-track-node--main' : 'mb-track-child',
    `mb-track-node--${mission.kind}`,
    selected ? 'is-selected' : '',
    mission.hasOverride ? 'has-override' : '',
    opts.dimmed ? 'is-dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label =
    opts.role === 'main'
      ? escapeHtml(mission.phaseTemplateId)
      : `${kindShortLabel(mission.kind)} ${escapeHtml(mission.phaseTemplateId)}`;

  return `
    <button
      type="button"
      class="${classes}"
      data-select-mission="${escapeHtml(mission.missionId)}"
      data-track-mission="${escapeHtml(mission.missionId)}"
      aria-pressed="${selected ? 'true' : 'false'}"
    >${label}${mission.hasOverride ? '<span class="mb-track-dot" title="override"></span>' : ''}</button>
  `;
}

function renderChapterTrack(): string {
  const mapOptions = maps.length > 0 ? maps : [...new Set(trackMissions.map((m) => m.mapId))].sort();
  const trackMapId = resolveTrackMapId(mapOptions);
  if (!trackMapId || chapters.length === 0) {
    return `
      <div class="mb-track mb-track--empty">
        <p class="lab-hint">Selecione um mapa para ver a trilha de capítulos.</p>
      </div>
    `;
  }

  const track: ChapterTrack = buildChapterTrack(trackMissions, trackMapId, chapters);
  const filters = { kind: filterKind || undefined, q: filterQuery || undefined };
  const focusChapter = filterChapter ? Number(filterChapter) : null;

  const columnsHtml = track.columns
    .map((column) => {
      const focused = focusChapter !== null && column.mainPhase === focusChapter;
      const mainDimmed = column.main
        ? !missionMatchesTrackFilters(column.main, filters)
        : false;
      const childrenHtml = column.children
        .map((child) =>
          renderTrackNode(child, {
            role: 'child',
            selectedId,
            dimmed: !missionMatchesTrackFilters(child, filters),
          }),
        )
        .join('');

      return `
        <div
          class="mb-track-col${focused ? ' is-chapter-focus' : ''}"
          data-chapter-main="${column.mainPhase}"
        >
          <div class="mb-track-main-row">
            ${renderTrackNode(column.main, {
              role: 'main',
              selectedId,
              dimmed: mainDimmed,
            })}
          </div>
          <div class="mb-track-children" role="list">
            ${childrenHtml || '<span class="mb-track-empty-kids">sem side/normal</span>'}
          </div>
        </div>
      `;
    })
    .join('');

  const mapNote = filterMap
    ? escapeHtml(trackMapId)
    : `${escapeHtml(trackMapId)} <span class="mb-track-map-hint">(primeiro mapa — filtre para outro)</span>`;

  return `
    <div class="mb-track" data-track-map="${escapeHtml(trackMapId)}">
      <div class="mb-track-head">
        <strong>Trilha de capítulos</strong>
        <span class="mb-track-map">${mapNote}</span>
      </div>
      <div class="mb-track-rail" role="navigation" aria-label="Marcos principais do mapa">
        ${columnsHtml}
      </div>
    </div>
  `;
}

function bindChapterTrack(root: HTMLElement): void {
  const tipMissions = new Map(trackMissions.map((mission) => [mission.missionId, mission]));

  root.querySelectorAll<HTMLElement>('[data-track-mission]').forEach((node) => {
    const missionId = node.dataset.trackMission;
    if (!missionId) return;
    const mission = tipMissions.get(missionId);
    if (!mission) return;

    node.addEventListener('mouseenter', () => showTrackTip(node, mission));
    node.addEventListener('mouseleave', () => hideTrackTip());
    node.addEventListener('focus', () => showTrackTip(node, mission));
    node.addEventListener('blur', () => hideTrackTip());
  });

  if (filterChapter) {
    const focusCol = root.querySelector<HTMLElement>(
      `.mb-track-col[data-chapter-main="${CSS.escape(filterChapter)}"]`,
    );
    focusCol?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function renderList(): string {
  if (missions.length === 0) {
    return `<p class="lab-hint">Nenhuma missão neste filtro. Ajuste capítulo / tipo / mapa / busca.</p>`;
  }
  return `
    <p class="mb-list-count">${missions.length} missão(ões)${
      dirtyMissionCount() > 0 ? ` · <strong>${dirtyMissionCount()} rascunho(s)</strong>` : ''
    }</p>
    <ul class="mb-list">
      ${missions
        .map((mission) => {
          const active = mission.missionId === selectedId ? ' is-active' : '';
          const dirty = dirtyMissionIds.has(mission.missionId)
            ? '<span class="mb-badge mb-badge--dirty">rascunho</span>'
            : '';
          const badge = mission.hasOverride ? '<span class="mb-badge">override</span>' : '';
          const shared =
            mission.sharedMissionIds.length > 0
              ? '<span class="mb-badge mb-badge--shared">shared</span>'
              : '';
          const stars = starsLabel(mission.stars);
          return `
            <li>
              <button type="button" class="mb-list-item${active}${
                dirtyMissionIds.has(mission.missionId) ? ' is-dirty' : ''
              }" data-select-mission="${mission.missionId}">
                <span class="mb-list-kind mb-list-kind--${mission.kind}">${mission.kind}${
                  stars ? ` · <span class="mb-stars">${stars}</span>` : ''
                }</span>
                <span class="mb-list-name">${mission.name}</span>
                <span class="mb-list-meta">${mission.phaseTemplateId} · cap.${mission.chapterMainPhase} · ${mission.waveCount}w ${dirty}${badge}${shared}</span>
              </button>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function renderSharedNotice(): string {
  if (!selectedMission || selectedMission.sharedMissionIds.length === 0) return '';
  return `
    <p class="mb-shared-note" role="note">
      Esta batalha é compartilhada pelo template <code>${selectedMission.phaseTemplateId}</code>.
      Alterar/salvar afeta também:
      <strong>${selectedMission.sharedMissionIds.join(', ')}</strong>
      (ex.: main e normal no mesmo marco).
    </p>
  `;
}

function phasesForChapter(mapId: string, chapterMainPhase: number): string[] {
  const band = chapters.find((chapter) => chapter.mainPhase === chapterMainPhase);
  const all = phasesByMap[mapId] ?? [];
  if (!band) return all;
  return all.filter((phaseId) => {
    const num = Number(phaseId.split('-')[1]);
    return Number.isFinite(num) && num >= band.min && num <= band.max;
  });
}

function renderIdentityPanel(): string {
  if (!selectedMission) return '';
  const canChangeKind = selectedMission.canChangeKind !== false;
  const canDelete = selectedMission.canDelete !== false;
  const kindDisabled = selectedMission.kind === 'main' && !canChangeKind;
  const phaseOptions = phasesForChapter(
    selectedMission.mapId,
    selectedMission.chapterMainPhase,
  );
  const badges = [
    selectedMission.isCustom ? '<span class="mb-badge mb-badge--unique">custom</span>' : '',
    selectedMission.isSeed ? '<span class="mb-badge mb-badge--canonical">seed</span>' : '',
    selectedMission.fromOverride ? '<span class="mb-badge">override</span>' : '',
    selectedMission.hasChildren
      ? '<span class="mb-badge mb-badge--shared">tem filhos</span>'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <section class="mb-identity" aria-label="Identidade da missão">
      <header class="mb-identity-head">
        <strong>Identidade</strong>
        <span class="mb-identity-badges">${badges}</span>
      </header>
      <div class="mb-identity-grid">
        <label>Nome
          <input type="text" id="mb-identity-name" value="${escapeHtml(selectedMission.name)}" />
        </label>
        <label>Tipo
          <select id="mb-identity-kind" ${kindDisabled ? 'disabled title="Main com filhos no capítulo"' : ''}>
            <option value="main" ${selectedMission.kind === 'main' ? 'selected' : ''} ${
              selectedMission.kind !== 'main' ? 'disabled' : ''
            }>Principal</option>
            <option value="side" ${selectedMission.kind === 'side' ? 'selected' : ''} ${
              !canChangeKind && selectedMission.kind === 'main' ? 'disabled' : ''
            }>Secundária</option>
            <option value="normal" ${selectedMission.kind === 'normal' ? 'selected' : ''} ${
              !canChangeKind && selectedMission.kind === 'main' ? 'disabled' : ''
            }>Normal</option>
          </select>
        </label>
        <label>Capítulo
          <select id="mb-identity-chapter">
            ${chapters
              .map(
                (chapter) =>
                  `<option value="${chapter.mainPhase}" ${
                    selectedMission!.chapterMainPhase === chapter.mainPhase ? 'selected' : ''
                  }>${chapter.label}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label>Fase (template)
          <select id="mb-identity-phase">
            ${phaseOptions
              .map(
                (phaseId) =>
                  `<option value="${phaseId}" ${
                    selectedMission!.phaseTemplateId === phaseId ? 'selected' : ''
                  }>${phaseId}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label>Stars
          <select id="mb-identity-stars">
            <option value="" ${selectedMission.stars == null ? 'selected' : ''}>—</option>
            ${[1, 2, 3, 4, 5]
              .map(
                (star) =>
                  `<option value="${star}" ${
                    selectedMission!.stars === star ? 'selected' : ''
                  }>${star}★</option>`,
              )
              .join('')}
          </select>
        </label>
        <label class="mb-identity-id">Id
          <code>${escapeHtml(selectedMission.missionId)}</code>
        </label>
      </div>
      <div class="mb-identity-actions">
        <button type="button" class="lab-btn--primary" id="mb-identity-save">Salvar identidade</button>
        <button type="button" class="mb-btn-danger" id="mb-identity-delete" ${
          canDelete ? '' : 'disabled title="Main com filhos no capítulo"'
        }>Excluir missão</button>
        ${
          selectedMission.kind === 'main' && selectedMission.hasChildren
            ? '<p class="lab-hint">Main com filhos: só edita nome/fase/stars — não troca tipo nem exclui.</p>'
            : ''
        }
      </div>
    </section>
  `;
}

function renderCreateModal(): string {
  if (!createModalOpen) return '';
  const mapId = filterMap || maps[0] || 'stendra';
  const chapterMain = chapters[1]?.mainPhase ?? chapters[0]?.mainPhase ?? 10;
  const phaseOptions = phasesForChapter(mapId, chapterMain);
  return `
    <div class="mb-modal" id="mb-create-modal" role="dialog" aria-modal="true" aria-label="Nova missão">
      <div class="mb-modal-card">
        <header>
          <strong>Nova missão</strong>
          <button type="button" class="lab-btn--icon" id="mb-create-close" aria-label="Fechar">×</button>
        </header>
        <div class="mb-identity-grid">
          <label>Tipo
            <select id="mb-create-kind">
              <option value="side">Secundária</option>
              <option value="normal">Normal custom</option>
            </select>
          </label>
          <label>Mapa
            <select id="mb-create-map">
              ${maps
                .map((id) => `<option value="${id}" ${id === mapId ? 'selected' : ''}>${id}</option>`)
                .join('')}
            </select>
          </label>
          <label>Capítulo
            <select id="mb-create-chapter">
              ${chapters
                .map(
                  (chapter) =>
                    `<option value="${chapter.mainPhase}" ${
                      chapter.mainPhase === chapterMain ? 'selected' : ''
                    }>${chapter.label}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Fase (template)
            <select id="mb-create-phase">
              ${phaseOptions
                .map((phaseId) => `<option value="${phaseId}">${phaseId}</option>`)
                .join('')}
            </select>
          </label>
          <label>Nome
            <input type="text" id="mb-create-name" placeholder="Nome exibido" />
          </label>
          <label>Slug (id)
            <input type="text" id="mb-create-slug" placeholder="ex.: stendra_new_side" />
          </label>
          <label>Stars
            <select id="mb-create-stars">
              <option value="1">1★</option>
              <option value="2" selected>2★</option>
              <option value="3">3★</option>
              <option value="4">4★</option>
              <option value="5">5★</option>
            </select>
          </label>
        </div>
        <p class="lab-hint">A batalha usa a fase escolhida (waves no editor abaixo após criar).</p>
        <div class="mb-identity-actions">
          <button type="button" class="lab-btn--primary" id="mb-create-submit">Criar</button>
          <button type="button" class="lab-btn--info" id="mb-create-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

async function saveMissionIdentity(): Promise<void> {
  if (!selectedMission) return;
  const name = (document.getElementById('mb-identity-name') as HTMLInputElement | null)?.value.trim();
  const kind = (document.getElementById('mb-identity-kind') as HTMLSelectElement | null)?.value as
    | MissionKind
    | undefined;
  const phaseTemplateId = (
    document.getElementById('mb-identity-phase') as HTMLSelectElement | null
  )?.value;
  const starsRaw = (document.getElementById('mb-identity-stars') as HTMLSelectElement | null)?.value;
  const stars = starsRaw === '' || starsRaw == null ? null : Number(starsRaw);

  const body: Record<string, unknown> = {
    name,
    phaseTemplateId,
    stars,
  };
  if (kind && kind !== selectedMission.kind) {
    body.kind = kind;
  }

  const data = await api<{
    missionId: string;
    previousId?: string | null;
  }>(`/api/missions/${encodeURIComponent(selectedMission.missionId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  await loadMissionBattlesList();
  await selectMission(data.missionId);
  setStatus(`Identidade salva: ${data.missionId}`);
}

async function deleteSelectedMission(): Promise<void> {
  if (!selectedMission) return;
  if (!selectedMission.canDelete) {
    setStatus('Não é possível excluir esta main (ainda tem filhos no capítulo).', true);
    return;
  }
  if (
    !confirm(
      `Excluir missão ${selectedMission.missionId}? Seed vai para deletedMissionIds; custom some do override.`,
    )
  ) {
    return;
  }
  await api(`/api/missions/${encodeURIComponent(selectedMission.missionId)}`, {
    method: 'DELETE',
  });
  selectedId = null;
  selectedMission = null;
  draft = null;
  await loadMissionBattlesList();
  setStatus('Missão excluída.');
}

async function createMissionFromModal(): Promise<void> {
  const kind = (document.getElementById('mb-create-kind') as HTMLSelectElement | null)?.value as
    | 'side'
    | 'normal';
  const mapId = (document.getElementById('mb-create-map') as HTMLSelectElement | null)?.value;
  const phaseTemplateId = (
    document.getElementById('mb-create-phase') as HTMLSelectElement | null
  )?.value;
  const name = (document.getElementById('mb-create-name') as HTMLInputElement | null)?.value.trim();
  const slug = (document.getElementById('mb-create-slug') as HTMLInputElement | null)?.value.trim();
  const stars = Number(
    (document.getElementById('mb-create-stars') as HTMLSelectElement | null)?.value ?? 2,
  );

  if (!kind || !mapId || !phaseTemplateId || !name) {
    setStatus('Preencha tipo, mapa, fase e nome.', true);
    return;
  }

  const data = await api<{ missionId: string }>('/api/missions', {
    method: 'POST',
    body: JSON.stringify({ kind, mapId, phaseTemplateId, name, slug, stars }),
  });
  createModalOpen = false;
  filterMap = mapId;
  await loadMissionBattlesList();
  await selectMission(data.missionId);
  setStatus(`Missão criada: ${data.missionId}`);
}

function refreshCreatePhaseOptions(root: HTMLElement): void {
  const mapId = (root.querySelector('#mb-create-map') as HTMLSelectElement | null)?.value ?? '';
  const chapterMain = Number(
    (root.querySelector('#mb-create-chapter') as HTMLSelectElement | null)?.value ?? 0,
  );
  const phaseSelect = root.querySelector('#mb-create-phase') as HTMLSelectElement | null;
  if (!phaseSelect) return;
  const options = phasesForChapter(mapId, chapterMain);
  phaseSelect.innerHTML = options
    .map((phaseId) => `<option value="${phaseId}">${phaseId}</option>`)
    .join('');
}

function refreshIdentityPhaseOptions(root: HTMLElement): void {
  if (!selectedMission) return;
  const chapterMain = Number(
    (root.querySelector('#mb-identity-chapter') as HTMLSelectElement | null)?.value ??
      selectedMission.chapterMainPhase,
  );
  const phaseSelect = root.querySelector('#mb-identity-phase') as HTMLSelectElement | null;
  if (!phaseSelect) return;
  const current = phaseSelect.value;
  const options = phasesForChapter(selectedMission.mapId, chapterMain);
  phaseSelect.innerHTML = options
    .map(
      (phaseId) =>
        `<option value="${phaseId}" ${phaseId === current ? 'selected' : ''}>${phaseId}</option>`,
    )
    .join('');
  if (!options.includes(phaseSelect.value) && options[0]) {
    phaseSelect.value = options[0];
  }
}

function renderEditor(): string {
  if (!draft || !selectedId || !selectedMission) {
    return `<p class="lab-hint">Selecione uma missão à esquerda para editar waves e monstros do capítulo.</p>`;
  }

  return `
    ${renderIdentityPanel()}
    <div class="mb-editor-meta">
      <div>
        <strong>${escapeHtml(selectedMission.name)}</strong>
        <span class="mb-editor-id">${escapeHtml(selectedMission.missionId)}</span>
      </div>
      <div class="mb-editor-chips">
        <span class="mb-chip mb-chip--kind">${selectedMission.kind}</span>
        <span class="mb-chip mb-chip--map">mapa ${selectedMission.mapId}</span>
        <span class="mb-chip mb-chip--chapter">cap. ${selectedMission.chapterMainPhase} (${selectedMission.chapterMin}–${selectedMission.chapterMax})</span>
        ${
          selectedMission.stars
            ? `<span class="mb-chip mb-chip--stars">${starsLabel(selectedMission.stars)}</span>`
            : ''
        }
      </div>
    </div>
    ${renderSharedNotice()}
    <div class="mb-editor-toolbar">
      <label>Nome da fase
        <input type="text" id="mb-display-name" value="${draft.displayName}" />
      </label>
      <label>statMultiplier
        <input type="number" id="mb-stat-mult" step="0.01" min="0.1" value="${draft.statMultiplier}" />
      </label>
      <button type="button" class="lab-btn--create" id="mb-add-wave">+ wave</button>
      <button type="button" class="lab-btn--primary" id="mb-save" ${
        dirtyMissionCount() === 0 ? 'disabled' : ''
      }>${
        dirtyMissionCount() > 1
          ? `Salvar tudo (${dirtyMissionCount()})`
          : 'Salvar no sistema'
      }</button>
      <span id="mb-dirty-count" class="xp-dirty-count">${
        dirtyMissionCount() > 0 ? `${dirtyMissionCount()} missão(ões) alterada(s)` : ''
      }</span>
      <button type="button" class="lab-btn--warn" id="mb-reset-baseline">Rascunho = baseline</button>
      <button type="button" class="mb-btn-danger" id="mb-clear-override">Apagar override</button>
    </div>
    <div class="mb-json-row">
      <label class="lab-field lab-field--full">JSON da batalha
        <textarea id="mb-json" rows="8" spellcheck="false">${JSON.stringify(draft, null, 2)}</textarea>
      </label>
      <button type="button" class="lab-btn--info" id="mb-apply-json">Aplicar JSON → formulário</button>
    </div>
    <div class="mb-waves">
      ${draft.waves.map((wave, index) => renderWaveEditor(wave, index)).join('')}
    </div>
    <div id="mb-wave-power" class="mb-wave-power">
      <div id="mb-party-editor-wrap">
        ${renderPartyEditorHtml(getReferenceParty())}
      </div>
      <div class="cs-action-row">
        <button type="button" class="lab-btn--info" id="mb-load-wave-power">⚡ Calcular poder das waves</button>
        <span class="cs-sep">·</span>
        ${renderProfileSelectHtml('mb-sim-profile', 'geared')}
        ${renderRunsSelectHtml('mb-sim-runs', 1)}
        <button type="button" class="lab-btn--info" id="mb-load-combat-sim">▶️ Simular combate (real)</button>
      </div>
    </div>
    ${renderArenaShellHtml()}
  `;
}

function readDraftFromDom(root: HTMLElement): void {
  if (!draft) return;
  const name = root.querySelector('#mb-display-name') as HTMLInputElement | null;
  const mult = root.querySelector('#mb-stat-mult') as HTMLInputElement | null;
  if (name) draft.displayName = name.value;
  if (mult) draft.statMultiplier = Number(mult.value) || 1;

  root.querySelectorAll<HTMLElement>('.mb-wave').forEach((waveEl) => {
    const wi = Number(waveEl.dataset.waveIndex);
    const wave = draft!.waves[wi];
    if (!wave) return;
    const idInput = waveEl.querySelector<HTMLInputElement>('header [data-field="id"]');
    const goldInput = waveEl.querySelector<HTMLInputElement>(
      'header [data-field="goldMultiplier"]',
    );
    if (idInput) wave.id = idInput.value || `w${wi + 1}`;
    if (goldInput) wave.goldMultiplier = Number(goldInput.value) || 1;

    waveEl.querySelectorAll<HTMLElement>('.mb-slot').forEach((slotEl) => {
      const si = Number(slotEl.dataset.slot);
      const slot = wave.slots[si];
      if (!slot) return;
      const enemyType = slotEl.querySelector<HTMLInputElement>('[data-field="enemyType"]');
      const role = slotEl.querySelector<HTMLSelectElement>('[data-field="role"]');
      const count = slotEl.querySelector<HTMLInputElement>('[data-field="count"]');
      const displayName = slotEl.querySelector<HTMLInputElement>('[data-field="displayName"]');
      const level = slotEl.querySelector<HTMLInputElement>('[data-field="level"]');
      if (enemyType) slot.enemyType = enemyType.value;
      if (role) slot.role = role.value as EnemySlotDraft['role'];
      if (count) slot.count = Math.max(1, Number(count.value) || 1);
      if (displayName) slot.displayName = displayName.value.trim() || undefined;
      if (level) {
        const n = Number(level.value);
        slot.level = Number.isFinite(n) && level.value !== '' ? n : undefined;
      }
    });
  });
}

function bindEditor(root: HTMLElement): void {
  const touchDraft = (): void => {
    readDraftFromDom(root);
    markCurrentMissionDirtyState();
  };

  root.querySelector('#mb-add-wave')?.addEventListener('click', () => {
    touchDraft();
    draft?.waves.push(emptyWave(draft.waves.length));
    markCurrentMissionDirtyState();
    renderMissionsEditor();
  });

  root.querySelector('#mb-save')?.addEventListener('click', () => {
    void saveAllDirty()
      .then(() => renderMissionsEditor())
      .catch((error: Error) => {
        setStatus(error.message, true);
      });
  });

  root.querySelector('#mb-clear-override')?.addEventListener('click', () => {
    void clearOverride()
      .then(() => renderMissionsEditor())
      .catch((error: Error) => {
        setStatus(error.message, true);
      });
  });

  root.querySelector('#mb-reset-baseline')?.addEventListener('click', () => {
    void resetToBaseline().catch((error: Error) => setStatus(error.message, true));
  });

  root.querySelector('#mb-apply-json')?.addEventListener('click', () => {
    const area = root.querySelector('#mb-json') as HTMLTextAreaElement | null;
    if (!area || !draft) return;
    try {
      const parsed = JSON.parse(area.value) as BattleDraft;
      draft = phaseToDraft(parsed);
      markCurrentMissionDirtyState();
      setStatus('JSON aplicado ao formulário.');
      renderMissionsEditor();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'JSON inválido', true);
    }
  });

  // Bind party editor dentro do painel de wave power
  const partyEditorWrap = root.querySelector<HTMLElement>('#mb-party-editor-wrap');
  if (partyEditorWrap) {
    const editorEl = partyEditorWrap.querySelector<HTMLElement>('#rp-editor');
    if (editorEl) bindPartyEditor(editorEl);
  }

  root.querySelector('#mb-load-wave-power')?.addEventListener('click', () => {
    const phaseId = selectedMission?.phaseTemplateId;
    if (!phaseId) return;
    const container = root.querySelector('#mb-wave-power');
    const resultsId = 'mb-wave-power-results';
    let resultsEl = root.querySelector<HTMLElement>(`#${resultsId}`);
    if (!resultsEl) {
      resultsEl = document.createElement('div');
      resultsEl.id = resultsId;
      container?.appendChild(resultsEl);
    }
    resultsEl.innerHTML = '<p class="lab-hint">Calculando…</p>';

    const party = getReferenceParty();
    const partyParam = partyToQueryParam(party);
    fetch(
      `/api/wave-power?phaseId=${encodeURIComponent(phaseId)}&party=${encodeURIComponent(partyParam)}`,
    )
      .then((res) => res.json())
      .then((data: {
        ok: boolean;
        phaseId: string;
        waves: Array<{ waveIndex: number; enemyCount: number; totalHp: number; totalAttack: number; estimatedEnemyBasicDps: number; referencePartyDps: number; estimatedClearSeconds: number; pressureRatio: number }>;
        phaseClearSeconds: number;
        totalHp: number;
        referencePartyDps: number;
      }) => {
        if (!resultsEl) return;
        if (!(data as { ok?: boolean }).ok) {
          resultsEl.innerHTML = `<p class="lab-hint is-error">Erro: ${(data as { error?: string }).error ?? 'desconhecido'}</p>`;
          return;
        }
        const partyLabelText = partyLabel(party);
        resultsEl.innerHTML = `
          <div class="mb-wave-power-summary">
            <h4>⚡ Poder da fase <code>${data.phaseId}</code></h4>
            <p class="lab-hint lab-hint--tight">Party: ${partyLabelText}</p>
            <div class="lab-totals-row">
              <div class="lab-stat lab-stat--compact lab-stat--hp"><strong>${Math.round(data.totalHp).toLocaleString('pt-BR')}</strong><span>HP total</span></div>
              <div class="lab-stat lab-stat--compact lab-stat--atk"><strong>${Math.round(data.referencePartyDps).toLocaleString('pt-BR')}</strong><span>DPS party</span></div>
              <div class="lab-stat lab-stat--compact lab-stat--speed"><strong>${data.phaseClearSeconds.toFixed(1)}s</strong><span>Limpar fase</span></div>
            </div>
            <table class="ea-table">
              <thead><tr><th>Wave</th><th>Inimigos</th><th>HP total</th><th>DPS inimigos</th><th>Limpar (s)</th><th>Pressão</th></tr></thead>
              <tbody>
                ${data.waves.map((w) => `<tr>
                  <td>${w.waveIndex + 1}</td>
                  <td>${w.enemyCount}</td>
                  <td>${Math.round(w.totalHp).toLocaleString('pt-BR')}</td>
                  <td>${Math.round(w.estimatedEnemyBasicDps).toLocaleString('pt-BR')}</td>
                  <td>${w.estimatedClearSeconds.toFixed(1)}</td>
                  <td>${(w.pressureRatio * 100).toFixed(0)}%</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
      })
      .catch((err: Error) => {
        if (resultsEl) resultsEl.innerHTML = `<p class="lab-hint">Erro ao calcular poder: ${err.message}</p>`;
      });
  });

  root.querySelector('#mb-load-combat-sim')?.addEventListener('click', () => {
    const phaseId = selectedMission?.phaseTemplateId;
    if (!phaseId || !draft) return;
    touchDraft();
    const container = root.querySelector<HTMLElement>('#mb-wave-power');
    const resultsId = 'mb-combat-sim-results';
    let resultsEl = root.querySelector<HTMLElement>(`#${resultsId}`);
    if (!resultsEl) {
      resultsEl = document.createElement('div');
      resultsEl.id = resultsId;
      container?.appendChild(resultsEl);
    }
    resultsEl.innerHTML = '<p class="lab-hint">Simulando…</p>';
    const runs = readRunsSelect(root, 'mb-sim-runs');
    const profile = readProfileSelect(root, 'mb-sim-profile');
    void fetchCombatSim({
      phaseId,
      draftPhase: {
        displayName: draft.displayName,
        statMultiplier: draft.statMultiplier,
        waves: draft.waves,
      },
      party: getRefPartyForApi(),
      profile,
      runs,
      seed: 1,
    })
      .then((data) => { if (resultsEl) renderSimResult(resultsEl, data, runs, phaseId); })
      .catch((err: Error) => { if (resultsEl) resultsEl.innerHTML = `<p class="lab-hint is-error">Erro: ${err.message}</p>`; });
  });

  bindArenaControls(root, (): ArenaDraftPayload | null => {
    if (!selectedMission || !draft) return null;
    touchDraft();
    return {
      phaseId: selectedMission.phaseTemplateId,
      draftPhase: {
        displayName: draft.displayName,
        statMultiplier: draft.statMultiplier,
        waves: draft.waves,
      },
      party: getRefPartyForApi(),
      profile: readProfileSelect(root, 'mb-sim-profile'),
      seed: 1,
    };
  });

  // Abrir primeiro inimigo de cada wave no Simulador
  root.querySelectorAll<HTMLButtonElement>('[data-open-enemy-sim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const enemyType = btn.dataset.openEnemySim ?? '';
      const level = parseInt(btn.dataset.openEnemyLevel ?? '1', 10) || 1;
      const role = (btn.dataset.openEnemyRole ?? 'trash') as 'trash' | 'elite' | 'boss';
      openEnemyInSimulator(enemyType, level, role);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="add-slot"]').forEach((button) => {
    button.addEventListener('click', () => {
      const wi = Number(button.closest<HTMLElement>('.mb-wave')?.dataset.waveIndex);
      touchDraft();
      draft?.waves[wi]?.slots.push(emptySlot());
      markCurrentMissionDirtyState();
      renderMissionsEditor();
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="remove-slot"]').forEach((button) => {
    button.addEventListener('click', () => {
      const slotEl = button.closest<HTMLElement>('.mb-slot');
      const wi = Number(slotEl?.dataset.wave);
      const si = Number(slotEl?.dataset.slot);
      touchDraft();
      const wave = draft?.waves[wi];
      if (!wave || wave.slots.length <= 1) return;
      wave.slots.splice(si, 1);
      markCurrentMissionDirtyState();
      renderMissionsEditor();
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="remove-wave"]').forEach((button) => {
    button.addEventListener('click', () => {
      touchDraft();
      if (!draft || draft.waves.length <= 1) return;
      const wi = Number(button.closest<HTMLElement>('.mb-wave')?.dataset.waveIndex);
      draft.waves.splice(wi, 1);
      markCurrentMissionDirtyState();
      renderMissionsEditor();
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="open-enemy-picker"]').forEach((button) => {
    button.addEventListener('click', () => {
      const field = button.closest<HTMLElement>('.mb-enemy-field');
      if (!field || !draft) return;
      const wi = Number(field.dataset.wave);
      const si = Number(field.dataset.slot);
      const slot = draft.waves[wi]?.slots[si];
      if (!slot) return;
      const withUrls = enemies.map((enemy) => ({
        ...enemy,
        spriteUrl: enemy.spriteUrl ?? enemySpriteUrlForLab(enemy.id),
      }));
      openEnemyPicker({
        enemies: withUrls,
        selectedId: slot.enemyType,
        onPick: (enemyId) => {
          readDraftFromDom(root);
          const current = draft?.waves[wi]?.slots[si];
          if (!current) return;
          current.enemyType = enemyId;
          markCurrentMissionDirtyState();
          renderMissionsEditor();
        },
      });
    });
  });

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    '#mb-display-name, #mb-stat-mult, #mb-json, .mb-wave input, .mb-wave select',
  ).forEach((input) => {
    input.addEventListener('input', () => touchDraft());
    input.addEventListener('change', () => touchDraft());
  });

  root.querySelectorAll<HTMLImageElement>('img[data-enemy-thumb]').forEach(bindSpriteFallback);
}

function reloadListAndRender(): void {
  stashCurrentMissionDraft();
  void loadMissionBattlesList()
    .then(() => renderMissionsEditor())
    .catch((error: Error) => setStatus(error.message, true));
}

export function renderMissionsEditor(): void {
  const host = document.getElementById('lab-missions');
  if (!host) return;
  setWorkspaceDirty('missions', dirtyMissionCount());
  withPreservedScroll(host, ['.mb-sidebar', '.mb-main'], () => renderMissionsEditorInto(host));
}

function renderMissionsEditorInto(host: HTMLElement): void {
  disposeArenaPlayback();
  const mapOptions = maps.length > 0 ? maps : [...new Set(missions.map((m) => m.mapId))].sort();

  const backupOptions =
    backups.length === 0
      ? '<option value="">(nenhum backup ainda)</option>'
      : backups
          .map((backup) => `<option value="${backup.id}">${backup.id}</option>`)
          .join('');

  host.innerHTML = `
    <div class="mb-layout">
      <aside class="mb-sidebar">
        <p class="lab-hint mb-intro">
          Filtre pelo <strong>capítulo da main</strong> (ex.: Cap. 10 = fases 2–10).
          Identidade grava em <code>mission-overrides.json</code>; waves em <code>phase-battle-overrides</code>.
        </p>
        <div class="mb-filters">
          <label>Capítulo
            <select id="mb-filter-chapter">
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
          <label>Tipo
            <select id="mb-filter-kind">
              <option value="" ${filterKind === '' ? 'selected' : ''}>Todos</option>
              <option value="main" ${filterKind === 'main' ? 'selected' : ''}>Principal</option>
              <option value="side" ${filterKind === 'side' ? 'selected' : ''}>Secundária</option>
              <option value="normal" ${filterKind === 'normal' ? 'selected' : ''}>Normal</option>
            </select>
          </label>
          <label>Mapa
            <select id="mb-filter-map">
              <option value="" ${filterMap === '' ? 'selected' : ''}>Todos</option>
              ${mapOptions
                .map(
                  (mapId) =>
                    `<option value="${mapId}" ${filterMap === mapId ? 'selected' : ''}>${mapId}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Busca
            <input type="search" id="mb-filter-q" placeholder="id, nome ou fase" value="${filterQuery.replace(/"/g, '&quot;')}" />
          </label>
          <button type="button" class="lab-btn--create" id="mb-open-create">+ Nova missão</button>
        </div>
        ${renderSweepPanelHtml(filterMap)}
        ${renderList()}
        <div class="mb-backups">
          <h3>Backups</h3>
          <p class="lab-hint">Salve várias missões de uma vez — gera 1 backup por save em lote.</p>
          <label>Arquivo
            <select id="mb-backup-select">${backupOptions}</select>
          </label>
          <button type="button" class="lab-btn--info" id="mb-restore-backup">Restaurar selecionado</button>
        </div>
      </aside>
      <section class="mb-main">
        ${renderChapterTrack()}
        ${renderEditor()}
        <p id="missions-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>
    ${renderCreateModal()}
  `;

  host.querySelector('#mb-filter-kind')?.addEventListener('change', (event) => {
    filterKind = (event.target as HTMLSelectElement).value as '' | MissionKind;
    reloadListAndRender();
  });

  host.querySelector('#mb-filter-map')?.addEventListener('change', (event) => {
    filterMap = (event.target as HTMLSelectElement).value;
    reloadListAndRender();
  });

  host.querySelector('#mb-filter-chapter')?.addEventListener('change', (event) => {
    filterChapter = (event.target as HTMLSelectElement).value;
    reloadListAndRender();
  });

  const searchInput = host.querySelector('#mb-filter-q') as HTMLInputElement | null;
  const applySearch = debounce(() => {
    filterQuery = searchInput?.value ?? '';
    reloadListAndRender();
  });
  searchInput?.addEventListener('input', applySearch);
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      filterQuery = searchInput.value;
      reloadListAndRender();
    }
  });

  host.querySelector('#mb-open-create')?.addEventListener('click', () => {
    createModalOpen = true;
    renderMissionsEditor();
  });

  host.querySelector('#mb-create-close')?.addEventListener('click', () => {
    createModalOpen = false;
    renderMissionsEditor();
  });
  host.querySelector('#mb-create-cancel')?.addEventListener('click', () => {
    createModalOpen = false;
    renderMissionsEditor();
  });
  host.querySelector('#mb-create-map')?.addEventListener('change', () => refreshCreatePhaseOptions(host));
  host.querySelector('#mb-create-chapter')?.addEventListener('change', () => refreshCreatePhaseOptions(host));
  host.querySelector('#mb-create-submit')?.addEventListener('click', () => {
    void createMissionFromModal()
      .then(() => renderMissionsEditor())
      .catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelector('#mb-identity-chapter')?.addEventListener('change', () => {
    refreshIdentityPhaseOptions(host);
  });
  host.querySelector('#mb-identity-save')?.addEventListener('click', () => {
    void saveMissionIdentity()
      .then(() => renderMissionsEditor())
      .catch((error: Error) => setStatus(error.message, true));
  });
  host.querySelector('#mb-identity-delete')?.addEventListener('click', () => {
    void deleteSelectedMission()
      .then(() => renderMissionsEditor())
      .catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelectorAll<HTMLButtonElement>('[data-select-mission]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.selectMission;
      if (!id) return;
      hideTrackTip();
      void selectMission(id)
        .then(() => renderMissionsEditor())
        .catch((error: Error) => setStatus(error.message, true));
    });
  });

  host.querySelector('#mb-restore-backup')?.addEventListener('click', () => {
    const select = host.querySelector('#mb-backup-select') as HTMLSelectElement | null;
    const id = select?.value;
    if (!id) {
      setStatus('Selecione um backup.', true);
      return;
    }
    void restoreBackup(id)
      .then(() => renderMissionsEditor())
      .catch((error: Error) => setStatus(error.message, true));
  });

  bindSweepPanel(host, () => filterMap);
  bindChapterTrack(host);

  bindEditor(host);
}

export async function mountMissionsTab(): Promise<void> {
  registerWorkspaceSave('missions', saveAllDirty);
  await loadMissionBattlesList();
  renderMissionsEditor();
}
