/**
 * UI do editor de inimigos (identidade + skills de monstro) no Balance Lab.
 */
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import { openEnemyInSimulator } from './navigation';
import { updateHashDeepLink } from './deepLinks';
import { fetchCombatSim, renderSimResult } from './combatSimUi';
import { bindSpriteFallback } from './enemyPicker';
import { bindLabArtFallback, labFieldStatIconUrl, labStatIconUrl } from './labAssetUrl';

type FieldDef = { key: string; label: string; step: number };

interface IdentityRow {
  enemyType: string;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

interface MonsterSkillRow {
  skillId: string;
  name: string;
  description: string;
  kind: string;
  usesAttackStat?: boolean;
  iconUrl?: string;
  iconFallbackUrl?: string;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

interface EnemyEntry {
  enemyType: string;
  name: string;
  powerTier: number;
  rosterRole: string;
  roleLabel: string;
  dexNo: number;
  spriteUrl: string;
  skillIds: readonly string[];
  identity: IdentityRow;
  monsterSkills: MonsterSkillRow[];
}

interface Payload {
  enemies: EnemyEntry[];
  identityFields: FieldDef[];
  skillFields: FieldDef[];
  updatedAt: string | null;
  backups: Array<{ id: string; path: string }>;
}

let payload: Payload | null = null;
let selectedType: string | null = null;
let filterQuery = '';
let statusMessage = '';
let statusError = false;
const collapsedSheetSections = new Set<string>();

const dirtyIdentities = new Set<string>();
const dirtyMonsterSkills = new Set<string>();
const identityDraft = new Map<string, Record<string, number>>();
const monsterSkillDraft = new Map<string, Record<string, number>>();

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('ec-status');
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function padDex(n: number): string {
  return `NO.${String(n).padStart(3, '0')}`;
}

function numbersDiffer(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (Number(a[key] ?? 0) !== Number(b[key] ?? 0)) return true;
  }
  return false;
}

function diffAgainstBaseline(
  baseline: Record<string, number>,
  current: Record<string, number>,
): Record<string, number> | null {
  const next: Record<string, number> = {};
  for (const key of Object.keys(current)) {
    if (Number(current[key]) !== Number(baseline[key])) next[key] = Number(current[key]);
  }
  return Object.keys(next).length > 0 ? next : null;
}

function syncDraft(): void {
  dirtyIdentities.clear();
  dirtyMonsterSkills.clear();
  identityDraft.clear();
  monsterSkillDraft.clear();
  if (!payload) return;
  for (const enemy of payload.enemies) {
    identityDraft.set(enemy.enemyType, { ...enemy.identity.effective });
    for (const skill of enemy.monsterSkills) {
      monsterSkillDraft.set(skill.skillId, { ...skill.effective });
    }
  }
}

export async function loadEnemyCombat(): Promise<void> {
  const data = await api<{ ok: boolean } & Payload>('/api/enemy-combat');
  payload = {
    enemies: data.enemies,
    identityFields: data.identityFields,
    skillFields: data.skillFields,
    updatedAt: data.updatedAt,
    backups: data.backups ?? [],
  };
  syncDraft();
}

function dirtyCount(): number {
  return dirtyIdentities.size + dirtyMonsterSkills.size;
}

function updateDirtyChrome(): void {
  const saveBtn = document.getElementById('ec-save') as HTMLButtonElement | null;
  const count = dirtyCount();
  if (saveBtn) {
    saveBtn.disabled = count === 0;
    saveBtn.textContent = count > 1 ? `Salvar tudo (${count})` : 'Salvar no sistema';
  }
  const el = document.getElementById('ec-dirty-count');
  if (el) el.textContent = count > 0 ? `${count} alteração(ões)` : '';
  setWorkspaceDirty('enemies', count);
}

function selectedEnemy(): EnemyEntry | null {
  if (!selectedType) return null;
  return payload?.enemies.find((enemy) => enemy.enemyType === selectedType) ?? null;
}

function openEnemy(id: string): void {
  selectedType = id;
  updateHashDeepLink('enemies', 'id', id);
}

function closeSheet(): void {
  selectedType = null;
  updateHashDeepLink('enemies');
}

function sheetSequence(): string[] {
  return (payload?.enemies ?? []).map((enemy) => enemy.enemyType);
}

function sheetNeighbor(delta: number): string | null {
  const ids = sheetSequence();
  if (ids.length === 0) return null;
  const current = selectedType ?? ids[0]!;
  const index = ids.indexOf(current);
  if (index < 0) return ids[0] ?? null;
  return ids[(index + delta + ids.length) % ids.length] ?? null;
}

function sheetEntryLabel(id: string): string {
  return payload?.enemies.find((enemy) => enemy.enemyType === id)?.name ?? id;
}

function simRole(entry: EnemyEntry): 'trash' | 'elite' | 'boss' {
  if (entry.rosterRole === 'boss') return 'boss';
  if (entry.rosterRole === 'subboss' || entry.rosterRole === 'elite') return 'elite';
  return 'trash';
}

function skillKindLabel(kind: string): string {
  if (kind === 'damage') return 'Dano';
  if (kind === 'heal_ally') return 'Cura';
  if (kind === 'buff_attack') return 'Buff de ataque';
  if (kind === 'debuff_defense') return 'Debuff de defesa';
  return 'Skill';
}

function overrideBadge(hasOverride: boolean): string {
  return hasOverride ? '<span class="xp-badge">alterado</span>' : '';
}

function artImg(
  src: string | undefined,
  className: string,
  extras: { fallback?: string; thumb?: 'enemy' | 'art'; alt?: string } = {},
): string {
  if (!src) return '';
  const fallback =
    extras.fallback && extras.fallback !== src ? ` data-fallback="${escapeHtml(extras.fallback)}"` : '';
  const thumb =
    extras.thumb === 'enemy' ? ' data-enemy-thumb' : extras.thumb === 'art' ? ' data-lab-art' : '';
  return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(extras.alt ?? '')}"${thumb}${fallback} loading="lazy" draggable="false" />`;
}

function picto(key: 'attack' | 'defense' | 'health' | 'attackSpeed'): string {
  return `<img class="hc-picto" src="${escapeHtml(labStatIconUrl(key))}" alt="" aria-hidden="true" data-lab-art />`;
}

function fieldCaption(field: FieldDef): string {
  const iconUrl = labFieldStatIconUrl(field.key);
  const icon = iconUrl
    ? `<img class="hc-picto" src="${escapeHtml(iconUrl)}" alt="" aria-hidden="true" data-lab-art />`
    : '';
  return `<span class="hc-field-caption">${icon}${escapeHtml(field.label)}</span>`;
}

function numberInputs(fields: FieldDef[], values: Record<string, number>, dataAttr: string): string {
  return fields
    .filter((field) => values[field.key] !== undefined)
    .map(
      (field) => `
      <label>${fieldCaption(field)}
        <input type="number" step="${field.step}" data-${dataAttr}="${field.key}" value="${values[field.key]}" />
      </label>`,
    )
    .join('');
}

function statBar(
  label: string,
  value: number,
  max: number,
  kind: string,
  iconKey: 'attack' | 'defense' | 'health' | 'attackSpeed',
): string {
  const pct = Math.max(4, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `<div class="hc-bar hc-bar--${kind}">
    <span class="hc-bar-label">${picto(iconKey)}${label}</span>
    <span class="hc-bar-track" aria-hidden="true"><i style="width:${pct}%"></i></span>
    <strong class="hc-bar-value">${shown}</strong>
  </div>`;
}

function rosterMaxes(): { attack: number; defense: number; health: number; aspd: number } {
  const zeros = { attack: 1, defense: 1, health: 1, aspd: 1 };
  if (!payload) return zeros;
  let attack = 1;
  let defense = 1;
  let health = 1;
  let aspd = 1;
  for (const enemy of payload.enemies) {
    const identity = identityDraft.get(enemy.enemyType) ?? enemy.identity.effective;
    attack = Math.max(attack, Number(identity.attackPerLevel ?? 0));
    defense = Math.max(defense, Number(identity.defensePerLevel ?? 0));
    health = Math.max(health, Number(identity.healthPerLevel ?? 0));
    aspd = Math.max(aspd, Number(identity.attackSpeedFactor ?? 0));
  }
  return { attack, defense, health, aspd };
}

function enemyHasOverride(entry: EnemyEntry): boolean {
  return entry.identity.hasOverride || entry.monsterSkills.some((skill) => skill.hasOverride);
}

function enemyHasPendingDraft(enemyType: string): boolean {
  if (dirtyIdentities.has(enemyType)) return true;
  const enemy = payload?.enemies.find((entry) => entry.enemyType === enemyType);
  return Boolean(enemy?.monsterSkills.some((skill) => dirtyMonsterSkills.has(skill.skillId)));
}

function renderSheetPager(title: string): string {
  const prevId = sheetNeighbor(-1);
  const nextId = sheetNeighbor(1);
  const prevName = prevId ? sheetEntryLabel(prevId) : '';
  const nextName = nextId ? sheetEntryLabel(nextId) : '';
  return `<nav class="hc-sheet-pager" aria-label="Trocar monstro">
    <button type="button" class="hc-sheet-step" data-enemy-step="-1" title="${escapeHtml(
      prevName,
    )}" aria-label="Anterior: ${escapeHtml(prevName)}" ${prevId ? '' : 'disabled'}>&lt;</button>
    <p class="hc-sheet-pager-current">${escapeHtml(title)}</p>
    <button type="button" class="hc-sheet-step" data-enemy-step="1" title="${escapeHtml(
      nextName,
    )}" aria-label="Próximo: ${escapeHtml(nextName)}" ${nextId ? '' : 'disabled'}>&gt;</button>
  </nav>`;
}

function renderSheetBlock(id: string, title: string, body: string, extraHead = ''): string {
  const collapsed = collapsedSheetSections.has(id);
  const action = collapsed ? 'Expandir' : 'Recolher';
  return `
    <section class="hc-block${collapsed ? ' is-collapsed' : ''}" data-sheet-section="${id}">
      <header class="hc-block-head">
        <h3>${escapeHtml(title)}</h3>
        ${extraHead}
        <button type="button" class="hc-block-toggle" data-toggle-section="${id}" title="${action}" aria-expanded="${
          collapsed ? 'false' : 'true'
        }" aria-label="${action} ${escapeHtml(title)}">${collapsed ? 'v' : '^'}</button>
      </header>
      <div class="hc-block-body">${body}</div>
    </section>`;
}

function renderToolbar(): string {
  const count = dirtyCount();
  const backups = payload?.backups ?? [];
  return `
    <div class="hc-toolbar">
      <button type="button" class="lab-btn--primary" id="ec-save" ${count === 0 ? 'disabled' : ''}>${
        count > 1 ? `Salvar tudo (${count})` : 'Salvar no sistema'
      }</button>
      <span id="ec-dirty-count" class="xp-dirty-count"></span>
      <div class="mb-backups hc-toolbar-backups">
        <h3>Backups</h3>
        ${
          backups.length === 0
            ? '<p class="lab-hint">Nenhum backup ainda.</p>'
            : `<ul class="xp-backup-list">${backups
                .slice(0, 8)
                .map(
                  (backup) =>
                    `<li><button type="button" class="lab-btn--info" data-restore-backup="${backup.id}">${backup.id}</button></li>`,
                )
                .join('')}</ul>`
        }
      </div>
    </div>`;
}

function renderSkillCard(skill: MonsterSkillRow, fields: FieldDef[]): string {
  const draft = monsterSkillDraft.get(skill.skillId) ?? skill.effective;
  const dirty = dirtyMonsterSkills.has(skill.skillId) ? ' is-dirty' : '';
  return `<article class="hc-card${dirty}" data-skill-id="${skill.skillId}">
    <header class="hc-card-head">
      ${artImg(skill.iconUrl, 'hc-art hc-art--skill', {
        fallback: skill.iconFallbackUrl,
        thumb: 'art',
        alt: skill.name,
      })}
      <div class="hc-card-head-text">
        <strong>${escapeHtml(skill.name)}</strong> ${overrideBadge(skill.hasOverride)}
        <span class="xp-muted">${escapeHtml(skillKindLabel(skill.kind))}</span>
      </div>
    </header>
    ${skill.description ? `<p class="hc-skill-blurb">${escapeHtml(skill.description)}</p>` : ''}
    <p class="hc-skill-meta">CD ${draft.cooldownTurns ?? 0} turnos · poder/rank ${draft.powerPerRank ?? 0}</p>
    <div class="hc-fields">${numberInputs(fields, draft, 'skill-field')}</div>
    <button type="button" class="lab-btn--warn" data-reset-skill="${skill.skillId}">↺ baseline</button>
  </article>`;
}

function renderRosterCard(entry: EnemyEntry): string {
  const pending = enemyHasPendingDraft(entry.enemyType);
  const identity = identityDraft.get(entry.enemyType) ?? entry.identity.effective;
  const marks = [
    pending ? '<span class="mb-badge mb-badge--dirty">rascunho</span>' : '',
    !pending && enemyHasOverride(entry) ? '<span class="xp-badge">alterado</span>' : '',
  ]
    .filter(Boolean)
    .join('');
  return `
    <button type="button" class="hc-dex-card${pending ? ' is-dirty' : ''}" data-select-enemy="${
      entry.enemyType
    }">
      <span class="hc-dex-no">${padDex(entry.dexNo)}</span>
      <img class="hc-dex-art" src="${escapeHtml(entry.spriteUrl)}" alt="" data-enemy-thumb />
      <strong class="hc-dex-name">${escapeHtml(entry.name)}</strong>
      <span class="hc-dex-role">T${entry.powerTier} · ${escapeHtml(entry.roleLabel)}</span>
      <span class="hc-dex-stats">
        <span class="res res--atk">${picto('attack')} ${identity.attackPerLevel ?? 0}</span>
        <span class="res res--def">${picto('defense')} ${identity.defensePerLevel ?? 0}</span>
        <span class="res res--hp">${picto('health')} ${identity.healthPerLevel ?? 0}</span>
      </span>
      <span class="hc-dex-marks">${marks}</span>
    </button>`;
}

function renderRoster(): string {
  const q = filterQuery.trim().toLowerCase();
  const enemies = (payload?.enemies ?? []).filter((entry) => {
    if (!q) return true;
    return [entry.name, entry.roleLabel, entry.rosterRole, entry.enemyType, `t${entry.powerTier}`]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
  return `
    <div class="hc-dex">
      <header class="hc-dex-head">
        <div>
          <p class="hc-dex-kicker">Índice de monstros</p>
          <h2>Inimigos</h2>
          <p class="lab-hint">Clique num monstro para abrir a ficha (stats e skills).</p>
        </div>
        <label class="hc-dex-search">Buscar
          <input type="search" id="ec-filter" value="${escapeHtml(filterQuery)}" placeholder="nome, papel ou tier" />
        </label>
      </header>
      <div class="hc-dex-grid">
        ${enemies.map((entry) => renderRosterCard(entry)).join('')}
      </div>
      ${enemies.length === 0 ? '<p class="lab-hint">Nenhum monstro neste filtro.</p>' : ''}
      ${renderToolbar()}
      <p id="ec-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
    </div>`;
}

function renderSheet(): string {
  const enemy = selectedEnemy();
  if (!enemy || !payload) return renderRoster();
  const identityValues = identityDraft.get(enemy.enemyType) ?? enemy.identity.effective;
  const maxes = rosterMaxes();
  const dirtyId = dirtyIdentities.has(enemy.enemyType);
  const role = simRole(enemy);

  return `
    <div class="hc-sheet">
      <nav class="hc-sheet-nav">
        <button type="button" class="lab-btn--info" data-dex-back>← Índice</button>
      </nav>
      ${renderSheetPager(enemy.name)}
      <header class="hc-sheet-head">
        <img class="hc-sheet-art" src="${escapeHtml(enemy.spriteUrl)}" alt="" data-enemy-thumb />
        <div class="hc-sheet-id">
          <span class="hc-dex-no">${padDex(enemy.dexNo)}</span>
          <h2>${escapeHtml(enemy.name)}</h2>
          <p class="hc-sheet-tag">T${enemy.powerTier} · ${escapeHtml(enemy.roleLabel)}</p>
        </div>
        <div class="ec-editor-actions">
          <button type="button" class="lab-btn--info" data-open-enemy-simulator="${enemy.enemyType}" data-open-enemy-role="${role}">Abrir no Simulador</button>
          <button type="button" class="lab-btn--info" data-run-combat-sim="${enemy.enemyType}" data-sim-tier="${enemy.powerTier}" data-sim-role="${role}">▶️ Simular vs party</button>
        </div>
      </header>
      <div id="ec-sim-result-${enemy.enemyType}" class="ec-sim-result"></div>

      ${renderSheetBlock(
        'overview',
        'Visão geral',
        `<div class="hc-bars">
          ${statBar('ATK/nv', Number(identityValues.attackPerLevel ?? 0), maxes.attack, 'atk', 'attack')}
          ${statBar('DEF/nv', Number(identityValues.defensePerLevel ?? 0), maxes.defense, 'def', 'defense')}
          ${statBar('HP/nv', Number(identityValues.healthPerLevel ?? 0), maxes.health, 'hp', 'health')}
          ${statBar('ASPD', Number(identityValues.attackSpeedFactor ?? 0), maxes.aspd, 'spd', 'attackSpeed')}
        </div>`,
      )}

      ${renderSheetBlock(
        'attributes',
        'Atributos',
        `<div class="hc-card${dirtyId ? ' is-dirty' : ''}" data-identity="${enemy.enemyType}">
          <p class="lab-hint">Crescimento e timing. O ataque básico é ATK × o fator de ataque básico.</p>
          <div class="hc-fields">${numberInputs(payload.identityFields, identityValues, 'identity-field')}</div>
          <button type="button" class="lab-btn--warn" data-reset-identity="${enemy.enemyType}">↺ baseline</button>
        </div>`,
        overrideBadge(enemy.identity.hasOverride),
      )}

      ${renderSheetBlock(
        'skills',
        'Skills',
        enemy.monsterSkills.length === 0
          ? '<p class="lab-hint">Nenhuma skill exclusiva neste monstro.</p>'
          : `<div class="hc-skill-grid">${enemy.monsterSkills
              .map((skill) => renderSkillCard(skill, payload!.skillFields))
              .join('')}</div>`,
      )}
      ${renderToolbar()}
      <p id="ec-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
    </div>`;
}

export function renderEnemyCombat(): void {
  const host = document.getElementById('lab-enemy-combat');
  if (!host || !payload) return;
  setWorkspaceDirty('enemies', dirtyCount());
  host.innerHTML = selectedType ? renderSheet() : renderRoster();
  updateDirtyChrome();
  bindEnemyCombat(host);
}

function markIdentityDirty(enemyType: string): void {
  const enemy = payload?.enemies.find((entry) => entry.enemyType === enemyType);
  const draft = identityDraft.get(enemyType);
  if (!enemy || !draft) return;
  if (numbersDiffer(draft, enemy.identity.effective)) dirtyIdentities.add(enemyType);
  else dirtyIdentities.delete(enemyType);
  updateDirtyChrome();
}

function markSkillDirty(skillId: string): void {
  const allSkills = payload?.enemies.flatMap((entry) => entry.monsterSkills) ?? [];
  const row = allSkills.find((skill) => skill.skillId === skillId);
  const draft = monsterSkillDraft.get(skillId);
  if (!row || !draft) return;
  if (numbersDiffer(draft, row.effective)) dirtyMonsterSkills.add(skillId);
  else dirtyMonsterSkills.delete(skillId);
  document
    .querySelector(`[data-skill-id="${skillId}"]`)
    ?.classList.toggle('is-dirty', dirtyMonsterSkills.has(skillId));
  updateDirtyChrome();
}

async function saveDirty(): Promise<void> {
  const identities: Record<string, Record<string, number>> = {};
  const monsterSkills: Record<string, Record<string, number>> = {};
  const clearIdentities: string[] = [];
  const clearMonsterSkills: string[] = [];

  for (const enemyType of dirtyIdentities) {
    const enemy = payload?.enemies.find((entry) => entry.enemyType === enemyType);
    const draft = identityDraft.get(enemyType);
    if (!enemy || !draft) continue;
    const diff = diffAgainstBaseline(enemy.identity.baseline, draft);
    if (!diff) clearIdentities.push(enemyType);
    else identities[enemyType] = diff;
  }

  for (const skillId of dirtyMonsterSkills) {
    const allSkills = payload?.enemies.flatMap((entry) => entry.monsterSkills) ?? [];
    const row = allSkills.find((skill) => skill.skillId === skillId);
    const draft = monsterSkillDraft.get(skillId);
    if (!row || !draft) continue;
    const diff = diffAgainstBaseline(row.baseline, draft);
    if (!diff) clearMonsterSkills.push(skillId);
    else monsterSkills[skillId] = diff;
  }

  if (
    Object.keys(identities).length === 0 &&
    Object.keys(monsterSkills).length === 0 &&
    clearIdentities.length === 0 &&
    clearMonsterSkills.length === 0
  ) {
    setStatus('Nada para salvar.');
    return;
  }

  const changes = { identities, monsterSkills, clearIdentities, clearMonsterSkills };
  if (!(await confirmChangeReview('Salvar inimigos', dirtyCount(), changes))) return;

  await api('/api/enemy-combat', { method: 'PUT', body: JSON.stringify(changes) });
  await loadEnemyCombat();
  setStatus('Salvo. Rebuild do jogo para aplicar no combate.');
  renderEnemyCombat();
}

function bindEnemyCombat(host: HTMLElement): void {
  host.querySelectorAll<HTMLImageElement>('[data-enemy-thumb]').forEach(bindSpriteFallback);
  host.querySelectorAll<HTMLImageElement>('[data-lab-art]').forEach(bindLabArtFallback);

  host.querySelector<HTMLInputElement>('#ec-filter')?.addEventListener('input', (event) => {
    filterQuery = (event.currentTarget as HTMLInputElement).value;
    renderEnemyCombat();
    const next = document.getElementById('ec-filter') as HTMLInputElement | null;
    next?.focus();
    next?.setSelectionRange(filterQuery.length, filterQuery.length);
  });

  host.querySelector('[data-dex-back]')?.addEventListener('click', () => {
    closeSheet();
    renderEnemyCombat();
  });

  host.querySelectorAll<HTMLButtonElement>('[data-toggle-section]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.toggleSection;
      if (!id) return;
      if (collapsedSheetSections.has(id)) collapsedSheetSections.delete(id);
      else collapsedSheetSections.add(id);
      renderEnemyCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-enemy-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextId = sheetNeighbor(Number(button.dataset.enemyStep));
      if (!nextId) return;
      openEnemy(nextId);
      renderEnemyCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-select-enemy]').forEach((button) => {
    button.addEventListener('click', () => {
      openEnemy(button.dataset.selectEnemy ?? '');
      renderEnemyCombat();
    });
  });

  host.querySelector<HTMLButtonElement>('[data-open-enemy-simulator]')?.addEventListener(
    'click',
    (event) => {
      const btn = event.currentTarget as HTMLButtonElement;
      const enemyType = btn.dataset.openEnemySimulator ?? '';
      const role = (btn.dataset.openEnemyRole ?? 'trash') as 'trash' | 'elite' | 'boss';
      const enemy = payload?.enemies.find((entry) => entry.enemyType === enemyType);
      const level = enemy ? Math.max(1, enemy.powerTier * 5) : 1;
      openEnemyInSimulator(enemyType, level, role);
    },
  );

  host.querySelector<HTMLButtonElement>('[data-run-combat-sim]')?.addEventListener('click', (event) => {
    const btn = event.currentTarget as HTMLButtonElement;
    const enemyType = btn.dataset.runCombatSim ?? '';
    const tier = parseInt(btn.dataset.simTier ?? '1', 10) || 1;
    const role = (btn.dataset.simRole ?? 'trash') as 'trash' | 'elite' | 'boss';
    const level = Math.max(1, tier * 5);
    const container = host.querySelector<HTMLElement>(`#ec-sim-result-${enemyType}`);
    if (container) container.innerHTML = '<p class="lab-hint">Simulando…</p>';
    void fetchCombatSim({
      slots: [{ enemyType, role, count: 3, level }],
      profile: 'geared',
      runs: 1,
      seed: 0,
    })
      .then((data) => {
        if (container) renderSimResult(container, data, 1);
      })
      .catch((err: Error) => {
        if (container) container.innerHTML = `<p class="lab-hint is-error">Erro: ${err.message}</p>`;
      });
  });

  host.querySelector('#ec-save')?.addEventListener('click', () => {
    void saveDirty().catch((err: Error) => setStatus(err.message, true));
  });

  host.querySelectorAll<HTMLInputElement>('[data-identity-field]').forEach((input) => {
    const enemyType = input.closest<HTMLElement>('[data-identity]')?.dataset.identity;
    if (!enemyType) return;
    input.addEventListener('input', () => {
      const draft = identityDraft.get(enemyType) ?? {};
      draft[input.dataset.identityField!] = Number(input.value);
      identityDraft.set(enemyType, draft);
      markIdentityDirty(enemyType);
      input.closest('.hc-card')?.classList.toggle('is-dirty', dirtyIdentities.has(enemyType));
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-skill-field]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-skill-id]');
    const skillId = card?.dataset.skillId;
    if (!skillId) return;
    input.addEventListener('input', () => {
      const draft = monsterSkillDraft.get(skillId) ?? {};
      draft[input.dataset.skillField!] = Number(input.value);
      monsterSkillDraft.set(skillId, draft);
      markSkillDirty(skillId);
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-identity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const enemyType = btn.dataset.resetIdentity!;
      const enemy = payload?.enemies.find((entry) => entry.enemyType === enemyType);
      if (!enemy) return;
      identityDraft.set(enemyType, { ...enemy.identity.baseline });
      dirtyIdentities.add(enemyType);
      renderEnemyCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-skill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const skillId = btn.dataset.resetSkill!;
      const allSkills = payload?.enemies.flatMap((entry) => entry.monsterSkills) ?? [];
      const row = allSkills.find((skill) => skill.skillId === skillId);
      if (!row) return;
      monsterSkillDraft.set(skillId, { ...row.baseline });
      dirtyMonsterSkills.add(skillId);
      renderEnemyCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-restore-backup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.restoreBackup;
      if (!id || !confirm(`Restaurar backup ${id}?`)) return;
      void api(`/api/enemy-combat-backups/${encodeURIComponent(id)}/restore`, { method: 'POST' })
        .then(() => loadEnemyCombat())
        .then(() => {
          setStatus(`Backup restaurado: ${id}`);
          renderEnemyCombat();
        })
        .catch((err: Error) => setStatus(err.message, true));
    });
  });
}

export async function mountEnemyCombatTab(): Promise<void> {
  registerWorkspaceSave('enemies', saveDirty);
  await loadEnemyCombat();
  renderEnemyCombat();
  setStatus('Índice de monstros — clique numa carta para abrir a ficha.');
}

/** Seleciona inimigo por tipo (para deep-link `#enemies?id=goblin_raider`). */
export function selectEnemyByType(enemyType: string): void {
  if (!payload) return;
  const found = payload.enemies.find((entry) => entry.enemyType === enemyType);
  if (found) {
    openEnemy(found.enemyType);
    renderEnemyCombat();
  }
}
