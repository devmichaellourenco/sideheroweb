/**
 * UI do editor de inimigos (identidade + skills de monstro) no Balance Lab.
 */
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import { openEnemyInSimulator } from './navigation';
import {
  fetchCombatSim,
  renderSimResult,
} from './combatSimUi';
import { bindSpriteFallback } from './enemyPicker';

type FieldDef = { key: string; label: string; step: number };

interface IdentityRow {
  enemyType: string;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

interface MonsterSkillRow {
  skillId: string;
  kind: string;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

interface EnemyEntry {
  enemyType: string;
  name: string;
  powerTier: number;
  rosterRole: string;
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
let selectedType = '';
let filterQuery = '';
let statusMessage = '';
let statusError = false;

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
  if (!selectedType && payload.enemies.length > 0) {
    selectedType = payload.enemies[0]!.enemyType;
  }
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
  return payload?.enemies.find((e) => e.enemyType === selectedType) ?? null;
}

function numberInputs(fields: FieldDef[], values: Record<string, number>, dataAttr: string): string {
  return fields
    .filter((field) => values[field.key] !== undefined)
    .map(
      (field) => `
      <label>${field.label}
        <input type="number" step="${field.step}" data-${dataAttr}="${field.key}" value="${values[field.key]}" />
      </label>`,
    )
    .join('');
}

export function renderEnemyCombat(): void {
  const host = document.getElementById('lab-enemy-combat');
  if (!host || !payload) return;
  setWorkspaceDirty('enemies', dirtyCount());

  const enemy = selectedEnemy();
  const identityValues = enemy
    ? (identityDraft.get(enemy.enemyType) ?? enemy.identity.effective)
    : {};

  const query = filterQuery.toLowerCase();
  const filtered = payload.enemies.filter(
    (e) =>
      !query ||
      e.name.toLowerCase().includes(query) ||
      e.enemyType.toLowerCase().includes(query),
  );

  const tierBadge = (tier: number): string => {
    const colors = ['', '#7cb87c', '#8ea8e8', '#c9a227', '#b07fd8', '#e0708f'];
    return `<span style="color:${colors[tier] ?? '#aaa'}">T${tier}</span>`;
  };

  host.innerHTML = `
    <div class="xp-layout">
      <aside class="xp-sidebar">
        <p class="lab-hint">Edite identidade e skills de monstro. Salva em <code>enemy-combat-overrides.json</code>.</p>
        <input type="text" id="ec-filter" placeholder="Filtrar inimigos…" value="${filterQuery}" class="lab-filter-input" />
        <ul class="hc-hero-list">
          ${filtered
            .map((e) => {
              const active = selectedType === e.enemyType ? ' is-active' : '';
              const dirty = dirtyIdentities.has(e.enemyType) ? ' is-dirty' : '';
              const badge = e.identity.hasOverride
                ? '<span class="xp-badge">override</span>'
                : '';
              return `<li><button type="button" class="hc-hero-btn ec-list-btn${active}${dirty}" data-select-enemy="${e.enemyType}">
                <img class="ec-list-thumb" src="${e.spriteUrl}" alt="" loading="lazy" data-enemy-thumb="${e.enemyType}" />
                <span class="ec-list-copy">
                  <strong>${e.name}</strong>
                  <span>${tierBadge(e.powerTier)} · ${e.rosterRole}</span>
                </span>
                ${badge}
              </button></li>`;
            })
            .join('')}
        </ul>
        <div class="xp-toolbar">
          <button type="button" class="lab-btn--primary" id="ec-save" ${dirtyCount() === 0 ? 'disabled' : ''}>
            ${dirtyCount() > 1 ? `Salvar tudo (${dirtyCount()})` : 'Salvar no sistema'}
          </button>
          <span id="ec-dirty-count" class="xp-dirty-count"></span>
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
        ${
          enemy
            ? `
          <section class="hc-card${dirtyIdentities.has(enemy.enemyType) ? ' is-dirty' : ''}"
                   data-identity="${enemy.enemyType}">
            <header class="ec-editor-head">
              <img class="ec-editor-thumb" src="${enemy.spriteUrl}" alt="" data-enemy-thumb="${enemy.enemyType}" />
              <div class="ec-editor-copy">
                <strong>${enemy.name}</strong>
                ${enemy.identity.hasOverride ? '<span class="xp-badge">override</span>' : ''}
                <span class="xp-muted">${enemy.enemyType} · Tier ${enemy.powerTier} · ${enemy.rosterRole}</span>
              </div>
              <div class="ec-editor-actions">
                <button type="button" class="lab-btn--info"
                  data-open-enemy-simulator="${enemy.enemyType}"
                  data-open-enemy-role="${enemy.rosterRole === 'boss' ? 'boss' : enemy.rosterRole === 'elite' ? 'elite' : 'trash'}"
                >Abrir no Simulador</button>
                <button type="button" class="lab-btn--info"
                  data-run-combat-sim="${enemy.enemyType}"
                  data-sim-tier="${enemy.powerTier}"
                  data-sim-role="${enemy.rosterRole === 'boss' ? 'boss' : enemy.rosterRole === 'subboss' ? 'elite' : 'trash'}"
                >▶️ Simular vs party</button>
              </div>
            </header>
            <div id="ec-sim-result-${enemy.enemyType}" class="ec-sim-result"></div>
            <p class="lab-hint">Identidade de combate — crescimento de stats e timing de skills.</p>
            <div class="hc-fields">
              ${numberInputs(payload.identityFields, identityValues, 'identity-field')}
            </div>
            <button type="button" class="lab-btn--warn" data-reset-identity="${enemy.enemyType}">↺ baseline</button>
          </section>

          <h3 class="hc-section">Skills de Monstro</h3>
          <div class="hc-skill-grid">
            ${enemy.monsterSkills
              .map((skill) => {
                const draft = monsterSkillDraft.get(skill.skillId) ?? skill.effective;
                const dirty = dirtyMonsterSkills.has(skill.skillId) ? ' is-dirty' : '';
                const badge = skill.hasOverride ? '<span class="xp-badge">override</span>' : '';
                return `<article class="hc-card${dirty}" data-skill-id="${skill.skillId}">
                  <header>
                    <strong>${skill.skillId}</strong> ${badge}
                    <span class="xp-muted">${skill.kind}</span>
                  </header>
                  <div class="hc-fields">
                    ${numberInputs(payload!.skillFields, draft, 'skill-field')}
                  </div>
                  <button type="button" class="lab-btn--warn" data-reset-skill="${skill.skillId}">↺ baseline</button>
                </article>`;
              })
              .join('')}
            ${enemy.monsterSkills.length === 0 ? '<p class="lab-hint">Nenhuma skill de monstro exclusiva.</p>' : ''}
          </div>`
            : '<p class="lab-hint">Selecione um inimigo para editar.</p>'
        }
        <p id="ec-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>`;

  updateDirtyChrome();
  bindEnemyCombat(host);
  host.querySelectorAll<HTMLImageElement>('[data-enemy-thumb]').forEach(bindSpriteFallback);
}

function markIdentityDirty(enemyType: string): void {
  const enemy = payload?.enemies.find((e) => e.enemyType === enemyType);
  const draft = identityDraft.get(enemyType);
  if (!enemy || !draft) return;
  if (numbersDiffer(draft, enemy.identity.effective)) dirtyIdentities.add(enemyType);
  else dirtyIdentities.delete(enemyType);
  updateDirtyChrome();
}

function markSkillDirty(skillId: string): void {
  const allSkills = payload?.enemies.flatMap((e) => e.monsterSkills) ?? [];
  const row = allSkills.find((s) => s.skillId === skillId);
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
    const enemy = payload?.enemies.find((e) => e.enemyType === enemyType);
    const draft = identityDraft.get(enemyType);
    if (!enemy || !draft) continue;
    const diff = diffAgainstBaseline(enemy.identity.baseline, draft);
    if (!diff) clearIdentities.push(enemyType);
    else identities[enemyType] = diff;
  }

  for (const skillId of dirtyMonsterSkills) {
    const allSkills = payload?.enemies.flatMap((e) => e.monsterSkills) ?? [];
    const row = allSkills.find((s) => s.skillId === skillId);
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
  setStatus('Salvo em enemy-combat-overrides.json. Rebuild da extensão para o jogo.');
  renderEnemyCombat();
}

function bindEnemyCombat(host: HTMLElement): void {
  host.querySelector<HTMLInputElement>('#ec-filter')?.addEventListener('input', (event) => {
    filterQuery = (event.target as HTMLInputElement).value;
    renderEnemyCombat();
  });

  host.querySelectorAll<HTMLButtonElement>('[data-select-enemy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.selectEnemy ?? '';
      renderEnemyCombat();
    });
  });

  host.querySelector<HTMLButtonElement>('[data-open-enemy-simulator]')?.addEventListener('click', (event) => {
    const btn = event.currentTarget as HTMLButtonElement;
    const enemyType = btn.dataset.openEnemySimulator ?? '';
    const role = (btn.dataset.openEnemyRole ?? 'trash') as 'trash' | 'elite' | 'boss';
    const enemy = payload?.enemies.find((e) => e.enemyType === enemyType);
    const level = enemy ? Math.max(1, enemy.powerTier * 5) : 1;
    openEnemyInSimulator(enemyType, level, role);
  });

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
      .then((data) => { if (container) renderSimResult(container, data, 1); })
      .catch((err: Error) => { if (container) container.innerHTML = `<p class="lab-hint is-error">Erro: ${err.message}</p>`; });
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
      const enemy = payload?.enemies.find((e) => e.enemyType === enemyType);
      if (!enemy) return;
      identityDraft.set(enemyType, { ...enemy.identity.baseline });
      dirtyIdentities.add(enemyType);
      renderEnemyCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-skill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const skillId = btn.dataset.resetSkill!;
      const allSkills = payload?.enemies.flatMap((e) => e.monsterSkills) ?? [];
      const row = allSkills.find((s) => s.skillId === skillId);
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
  setStatus('Inimigos carregados — edite identidade e skills de monstro e salve.');
}

/** Seleciona inimigo por tipo (para deep-link `#enemies?id=goblin_raider`). */
export function selectEnemyByType(enemyType: string): void {
  if (!payload) return;
  const found = payload.enemies.find((e) => e.enemyType === enemyType);
  if (found) {
    selectedType = found.enemyType;
    renderEnemyCombat();
  }
}
