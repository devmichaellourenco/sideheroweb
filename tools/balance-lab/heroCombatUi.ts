/**
 * UI do editor de skills / identidade / passivas / evoluções no Balance Lab.
 */
import { openHeroInSimulator } from './navigation';
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';

type FieldDef = { key: string; label: string; step: number };

interface SkillRow {
  skillId: string;
  name: string;
  kind: string;
  branch: string;
  heroClass: string;
  pointType: string;
  hasDot: boolean;
  usesAttackStat?: boolean;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

interface IdentityRow {
  heroClass: string;
  baseline: Record<string, number>;
  effective: Record<string, number>;
  hasOverride: boolean;
}

interface PassiveRow {
  id: string;
  name: string;
  description: string;
  source: string;
  effects: Array<{ kind: string; fields: Record<string, number> }>;
  baselineEffects: Array<{ kind: string; fields: Record<string, number> }>;
  hasOverride: boolean;
}

interface AscensionReqField {
  index: number;
  type: string;
  label: string;
  valueKey: 'min' | 'minRank';
  baselineValue: number;
  value: number;
}

interface AscensionRow {
  id: string;
  heroClass: string;
  name: string;
  baselineName: string;
  pathLabel: string;
  baselinePathLabel: string;
  description: string;
  baselineDescription: string;
  tier: number;
  prerequisiteAscensionId: string | null;
  pointsGranted: number;
  baselinePointsGranted: number;
  requirements: AscensionReqField[];
  impact: {
    skills: Array<{ id: string; name: string }>;
    passive: { id: string; name: string } | null;
    cumulativePoints: number;
    pathTotalPoints: number;
    pathSkillCount: number;
  };
  hasOverride: boolean;
}

interface AscensionDraft {
  name: string;
  pathLabel: string;
  description: string;
  pointsGranted: number;
  requirements: Array<{ index: number; valueKey: 'min' | 'minRank'; value: number }>;
}

interface HeroEntry {
  heroClass: string;
  name: string;
  classLabel: string;
  identity: IdentityRow;
  baseStats: IdentityRow;
  skills: SkillRow[];
  passives: PassiveRow[];
  ascensions: AscensionRow[];
}

interface Payload {
  heroes: HeroEntry[];
  universalSkills: SkillRow[];
  skillFields: FieldDef[];
  identityFields: FieldDef[];
  baseStatsFields: FieldDef[];
  updatedAt: string | null;
  backups: Array<{ id: string; path: string }>;
}

type SelectedId = string;

let payload: Payload | null = null;
let selected: SelectedId = 'sorcerer';
const dirtySkills = new Set<string>();
const dirtyIdentities = new Set<string>();
const dirtyBaseStats = new Set<string>();
const dirtyPassives = new Set<string>();
const dirtyAscensions = new Set<string>();
const skillDraft = new Map<string, Record<string, number>>();
const identityDraft = new Map<string, Record<string, number>>();
const baseStatsDraft = new Map<string, Record<string, number>>();
const passiveDraft = new Map<string, Array<Record<string, number>>>();
const ascensionDraft = new Map<string, AscensionDraft>();
let statusMessage = '';
let statusError = false;

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('hc-status');
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
  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  return json;
}

function toAscensionDraft(row: AscensionRow): AscensionDraft {
  return {
    name: row.name,
    pathLabel: row.pathLabel,
    description: row.description,
    pointsGranted: row.pointsGranted,
    requirements: row.requirements.map((req) => ({
      index: req.index,
      valueKey: req.valueKey,
      value: req.value,
    })),
  };
}

function syncDraft(): void {
  dirtySkills.clear();
  dirtyIdentities.clear();
  dirtyBaseStats.clear();
  dirtyPassives.clear();
  dirtyAscensions.clear();
  skillDraft.clear();
  identityDraft.clear();
  baseStatsDraft.clear();
  passiveDraft.clear();
  ascensionDraft.clear();
  if (!payload) return;
  for (const hero of payload.heroes) {
    identityDraft.set(hero.heroClass, { ...hero.identity.effective });
    baseStatsDraft.set(hero.heroClass, { ...hero.baseStats.effective });
    for (const skill of hero.skills) skillDraft.set(skill.skillId, { ...skill.effective });
    for (const passive of hero.passives) {
      passiveDraft.set(
        passive.id,
        passive.effects.map((effect) => ({ ...effect.fields })),
      );
    }
    for (const ascension of hero.ascensions) {
      ascensionDraft.set(ascension.id, toAscensionDraft(ascension));
    }
  }
  for (const skill of payload.universalSkills) {
    skillDraft.set(skill.skillId, { ...skill.effective });
  }
}

export async function loadHeroCombat(): Promise<void> {
  const data = await api<{ ok: boolean } & Payload>('/api/hero-combat');
  payload = {
    heroes: data.heroes,
    universalSkills: data.universalSkills,
    skillFields: data.skillFields,
    identityFields: data.identityFields,
    baseStatsFields: data.baseStatsFields ?? [
      { key: 'attack', label: 'ATK base', step: 1 },
      { key: 'defense', label: 'DEF base', step: 1 },
      { key: 'health', label: 'HP base', step: 1 },
    ],
    updatedAt: data.updatedAt,
    backups: data.backups ?? [],
  };
  syncDraft();
}

function allSkills(): SkillRow[] {
  if (!payload) return [];
  return [...payload.heroes.flatMap((hero) => hero.skills), ...payload.universalSkills];
}

function allAscensions(): AscensionRow[] {
  return payload?.heroes.flatMap((hero) => hero.ascensions) ?? [];
}

function selectedHero(): HeroEntry | null {
  return payload?.heroes.find((hero) => hero.heroClass === selected) ?? null;
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

function heroHasPendingDraft(heroClass: string): boolean {
  if (dirtyIdentities.has(heroClass) || dirtyBaseStats.has(heroClass)) return true;
  const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
  if (!hero) return false;
  if (hero.passives.some((passive) => dirtyPassives.has(passive.id))) return true;
  if (hero.ascensions.some((ascension) => dirtyAscensions.has(ascension.id))) return true;
  if (hero.skills.some((skill) => dirtySkills.has(skill.skillId))) return true;
  return false;
}

function universalHasPendingDraft(): boolean {
  return (payload?.universalSkills ?? []).some((skill) => dirtySkills.has(skill.skillId));
}

function flushVisibleHeroDrafts(host: HTMLElement): void {
  host.querySelectorAll<HTMLInputElement>('[data-skill-field]').forEach((input) => {
    const skillId = input.closest<HTMLElement>('[data-skill-id]')?.dataset.skillId;
    if (!skillId) return;
    const draft = skillDraft.get(skillId) ?? {};
    draft[input.dataset.skillField!] = Number(input.value);
    skillDraft.set(skillId, draft);
    markSkillDirty(skillId);
  });

  host.querySelectorAll<HTMLInputElement>('[data-identity-field]').forEach((input) => {
    const heroClass = input.closest<HTMLElement>('[data-identity]')?.dataset.identity;
    if (!heroClass) return;
    const draft = identityDraft.get(heroClass) ?? {};
    draft[input.dataset.identityField!] = Number(input.value);
    identityDraft.set(heroClass, draft);
    const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
    if (hero && numbersDiffer(draft, hero.identity.effective)) dirtyIdentities.add(heroClass);
    else dirtyIdentities.delete(heroClass);
  });

  host.querySelectorAll<HTMLInputElement>('[data-base-stats-field]').forEach((input) => {
    const heroClass = input.closest<HTMLElement>('[data-identity]')?.dataset.identity;
    if (!heroClass) return;
    const draft = baseStatsDraft.get(heroClass) ?? {};
    draft[input.dataset.baseStatsField!] = Number(input.value);
    baseStatsDraft.set(heroClass, draft);
    const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
    if (hero && numbersDiffer(draft, hero.baseStats.effective)) dirtyBaseStats.add(heroClass);
    else dirtyBaseStats.delete(heroClass);
  });

  host.querySelectorAll<HTMLInputElement>('[data-basic-ratio-class]').forEach((input) => {
    const heroClass = input.dataset.basicRatioClass;
    if (!heroClass) return;
    const draft = identityDraft.get(heroClass) ?? {};
    draft.basicAttackDamageRatio = Number(input.value);
    identityDraft.set(heroClass, draft);
    const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
    if (hero && numbersDiffer(draft, hero.identity.effective)) dirtyIdentities.add(heroClass);
    else dirtyIdentities.delete(heroClass);
  });

  host.querySelectorAll<HTMLInputElement>('[data-passive-field]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-passive-id]');
    const passiveId = card?.dataset.passiveId;
    if (!passiveId) return;
    const [indexRaw, key] = (input.dataset.passiveField ?? '').split('.');
    const index = Number(indexRaw);
    const draft = passiveDraft.get(passiveId) ?? [];
    draft[index] = { ...(draft[index] ?? {}), [key]: Number(input.value) };
    passiveDraft.set(passiveId, draft);
    const row = payload?.heroes.flatMap((hero) => hero.passives).find((passive) => passive.id === passiveId);
    const current = row?.effects.map((effect) => effect.fields) ?? [];
    const changed = current.some((fields, i) => numbersDiffer(fields, draft[i] ?? {}));
    if (changed) dirtyPassives.add(passiveId);
    else dirtyPassives.delete(passiveId);
  });

  host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-ascension-text]').forEach(
    (input) => {
      const id = input.closest<HTMLElement>('[data-ascension-id]')?.dataset.ascensionId;
      if (!id) return;
      const draft = ascensionDraft.get(id);
      if (!draft) return;
      const key = input.dataset.ascensionText as 'name' | 'pathLabel' | 'description';
      draft[key] = input.value;
      ascensionDraft.set(id, draft);
      markAscensionDirty(id);
    },
  );

  host.querySelectorAll<HTMLInputElement>('[data-ascension-points]').forEach((input) => {
    const id = input.closest<HTMLElement>('[data-ascension-id]')?.dataset.ascensionId;
    if (!id) return;
    const draft = ascensionDraft.get(id);
    if (!draft) return;
    draft.pointsGranted = Number(input.value);
    ascensionDraft.set(id, draft);
    markAscensionDirty(id);
  });

  host.querySelectorAll<HTMLInputElement>('[data-ascension-req]').forEach((input) => {
    const id = input.closest<HTMLElement>('[data-ascension-id]')?.dataset.ascensionId;
    if (!id) return;
    const draft = ascensionDraft.get(id);
    if (!draft) return;
    const index = Number(input.dataset.ascensionReq);
    const valueKey = (input.dataset.reqKey as 'min' | 'minRank') || 'min';
    const existing = draft.requirements.find((entry) => entry.index === index);
    if (existing) existing.value = Number(input.value);
    else draft.requirements.push({ index, valueKey, value: Number(input.value) });
    ascensionDraft.set(id, draft);
    markAscensionDirty(id);
  });

  updateDirtyChrome();
}

function dirtyCount(): number {
  return (
    dirtySkills.size +
    dirtyIdentities.size +
    dirtyBaseStats.size +
    dirtyPassives.size +
    dirtyAscensions.size
  );
}

function updateDirtyChrome(): void {
  const saveBtn = document.getElementById('hc-save') as HTMLButtonElement | null;
  const count = dirtyCount();
  if (saveBtn) {
    saveBtn.disabled = count === 0;
    if (count > 1) saveBtn.textContent = `Salvar tudo (${count})`;
    else saveBtn.textContent = 'Salvar no sistema';
  }
  const el = document.getElementById('hc-dirty-count');
  if (el) el.textContent = count > 0 ? `${count} alteração(ões)` : '';
  setWorkspaceDirty('heroes', count);
}

function markSkillDirty(skillId: string): void {
  const row = allSkills().find((skill) => skill.skillId === skillId);
  const draft = skillDraft.get(skillId);
  if (!row || !draft) return;
  if (numbersDiffer(draft, row.effective)) dirtySkills.add(skillId);
  else dirtySkills.delete(skillId);
  document.querySelector(`[data-skill-id="${skillId}"]`)?.classList.toggle('is-dirty', dirtySkills.has(skillId));
  updateDirtyChrome();
}

function ascensionChanged(row: AscensionRow, draft: AscensionDraft): boolean {
  if (draft.name !== row.name) return true;
  if (draft.pathLabel !== row.pathLabel) return true;
  if (draft.description !== row.description) return true;
  if (draft.pointsGranted !== row.pointsGranted) return true;
  return row.requirements.some((req) => {
    const current = draft.requirements.find((entry) => entry.index === req.index);
    return Number(current?.value ?? req.value) !== Number(req.value);
  });
}

function markAscensionDirty(id: string): void {
  const row = allAscensions().find((ascension) => ascension.id === id);
  const draft = ascensionDraft.get(id);
  if (!row || !draft) return;
  if (ascensionChanged(row, draft)) dirtyAscensions.add(id);
  else dirtyAscensions.delete(id);
  document.querySelector(`[data-ascension-id="${id}"]`)?.classList.toggle('is-dirty', dirtyAscensions.has(id));
  updateDirtyChrome();
  refreshAscensionImpact(id);
}

function pathMembers(hero: HeroEntry, pathLabel: string): AscensionRow[] {
  return hero.ascensions.filter((row) => {
    const draft = ascensionDraft.get(row.id);
    return (draft?.pathLabel ?? row.pathLabel) === pathLabel;
  });
}

function liveImpact(row: AscensionRow): {
  cumulativePoints: number;
  pathTotalPoints: number;
  pointsDelta: number;
} {
  const hero = payload?.heroes.find((entry) => entry.heroClass === row.heroClass);
  if (!hero) {
    return {
      cumulativePoints: row.impact.cumulativePoints,
      pathTotalPoints: row.impact.pathTotalPoints,
      pointsDelta: 0,
    };
  }
  const draft = ascensionDraft.get(row.id);
  const pathLabel = draft?.pathLabel ?? row.pathLabel;
  const members = pathMembers(hero, pathLabel);
  const pathTotalPoints = members.reduce((sum, member) => {
    return sum + (ascensionDraft.get(member.id)?.pointsGranted ?? member.pointsGranted);
  }, 0);

  const chainIds = new Set<string>();
  let cursor: string | null = row.id;
  while (cursor) {
    chainIds.add(cursor);
    const current = hero.ascensions.find((ascension) => ascension.id === cursor);
    cursor = current?.prerequisiteAscensionId ?? null;
  }
  const cumulativePoints = hero.ascensions
    .filter((ascension) => chainIds.has(ascension.id))
    .reduce(
      (sum, ascension) =>
        sum + (ascensionDraft.get(ascension.id)?.pointsGranted ?? ascension.pointsGranted),
      0,
    );

  return {
    cumulativePoints,
    pathTotalPoints,
    pointsDelta: (draft?.pointsGranted ?? row.pointsGranted) - row.baselinePointsGranted,
  };
}

function refreshAscensionImpact(id: string): void {
  const row = allAscensions().find((ascension) => ascension.id === id);
  if (!row) return;
  const hero = payload?.heroes.find((entry) => entry.heroClass === row.heroClass);
  if (!hero) return;
  for (const member of pathMembers(hero, ascensionDraft.get(id)?.pathLabel ?? row.pathLabel)) {
    const impact = liveImpact(member);
    const card = document.querySelector(`[data-ascension-id="${member.id}"]`);
    const cum = card?.querySelector('[data-impact-cum]');
    const total = card?.querySelector('[data-impact-path]');
    const delta = card?.querySelector('[data-impact-delta]');
    if (cum) cum.textContent = String(impact.cumulativePoints);
    if (total) total.textContent = String(impact.pathTotalPoints);
    if (delta) {
      delta.textContent =
        impact.pointsDelta === 0
          ? 'igual ao baseline'
          : `${impact.pointsDelta > 0 ? '+' : ''}${impact.pointsDelta} vs baseline`;
    }
  }
}

function buildAscensionOverride(
  row: AscensionRow,
  draft: AscensionDraft,
): Record<string, unknown> | null {
  const next: Record<string, unknown> = {};
  if (draft.name !== row.baselineName) next.name = draft.name;
  if (draft.pathLabel !== row.baselinePathLabel) next.pathLabel = draft.pathLabel;
  if (draft.description !== row.baselineDescription) next.description = draft.description;
  if (draft.pointsGranted !== row.baselinePointsGranted) {
    next.pointsGranted = draft.pointsGranted;
  }

  const maxIndex = Math.max(-1, ...row.requirements.map((req) => req.index));
  const requirements: Array<Record<string, number>> = Array.from(
    { length: maxIndex + 1 },
    () => ({}),
  );
  let hasReq = false;
  for (const req of row.requirements) {
    const current = draft.requirements.find((entry) => entry.index === req.index);
    const value = Number(current?.value ?? req.value);
    if (value !== req.baselineValue) {
      requirements[req.index] = { [req.valueKey]: value };
      hasReq = true;
    }
  }
  if (hasReq) next.requirements = requirements;
  return Object.keys(next).length > 0 ? next : null;
}

async function saveDirty(): Promise<void> {
  const skills: Record<string, Record<string, number>> = {};
  const identities: Record<string, Record<string, number>> = {};
  const baseStats: Record<string, Record<string, number>> = {};
  const passives: Record<string, { effects: Array<Record<string, number>> }> = {};
  const ascensions: Record<string, Record<string, unknown>> = {};
  const clearSkills: string[] = [];
  const clearIdentities: string[] = [];
  const clearBaseStats: string[] = [];
  const clearPassives: string[] = [];
  const clearAscensions: string[] = [];

  for (const skillId of dirtySkills) {
    const row = allSkills().find((skill) => skill.skillId === skillId);
    const draft = skillDraft.get(skillId);
    if (!row || !draft) continue;
    const diff = diffAgainstBaseline(row.baseline, draft);
    if (!diff) clearSkills.push(skillId);
    else skills[skillId] = diff;
  }

  for (const heroClass of dirtyIdentities) {
    const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
    const draft = identityDraft.get(heroClass);
    if (!hero || !draft) continue;
    const diff = diffAgainstBaseline(hero.identity.baseline, draft);
    if (!diff) clearIdentities.push(heroClass);
    else identities[heroClass] = diff;
  }

  for (const heroClass of dirtyBaseStats) {
    const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
    const draft = baseStatsDraft.get(heroClass);
    if (!hero || !draft) continue;
    const diff = diffAgainstBaseline(hero.baseStats.baseline, draft);
    if (!diff) clearBaseStats.push(heroClass);
    else baseStats[heroClass] = diff;
  }

  for (const passiveId of dirtyPassives) {
    const row = payload?.heroes.flatMap((hero) => hero.passives).find((passive) => passive.id === passiveId);
    const draft = passiveDraft.get(passiveId);
    if (!row || !draft) continue;
    const same = row.baselineEffects.every((effect, index) => !numbersDiffer(effect.fields, draft[index] ?? {}));
    if (same) clearPassives.push(passiveId);
    else passives[passiveId] = { effects: draft };
  }

  for (const ascensionId of dirtyAscensions) {
    const row = allAscensions().find((ascension) => ascension.id === ascensionId);
    const draft = ascensionDraft.get(ascensionId);
    if (!row || !draft) continue;
    const override = buildAscensionOverride(row, draft);
    if (!override) clearAscensions.push(ascensionId);
    else ascensions[ascensionId] = override;
  }

  if (
    Object.keys(skills).length === 0 &&
    Object.keys(identities).length === 0 &&
    Object.keys(baseStats).length === 0 &&
    Object.keys(passives).length === 0 &&
    Object.keys(ascensions).length === 0 &&
    clearSkills.length === 0 &&
    clearIdentities.length === 0 &&
    clearBaseStats.length === 0 &&
    clearPassives.length === 0 &&
    clearAscensions.length === 0
  ) {
    setStatus('Nada para salvar.');
    return;
  }

  const changes = {
    skills,
    identities,
    baseStats,
    passives,
    ascensions,
    clearSkills,
    clearIdentities,
    clearBaseStats,
    clearPassives,
    clearAscensions,
  };
  if (!(await confirmChangeReview('Salvar recursos dos personagens', dirtyCount(), changes))) {
    return;
  }

  await api('/api/hero-combat', {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
  await loadHeroCombat();
  setStatus('Salvo em hero-combat-overrides.json. Rebuild da extensão para o jogo.');
  renderHeroCombat();
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

function extraSkillFields(values: Record<string, number>): FieldDef[] {
  const extras: FieldDef[] = [];
  if (values.healConditionThreshold !== undefined) {
    extras.push({ key: 'healConditionThreshold', label: 'cura se HP <', step: 0.05 });
  }
  if (values.effectDurationTurns !== undefined) {
    extras.push({ key: 'effectDurationTurns', label: 'duração turns', step: 1 });
  }
  if (values.onHitDotDamagePerTurn !== undefined) {
    extras.push({ key: 'onHitDotDamagePerTurn', label: 'DOT dmg', step: 1 });
    extras.push({ key: 'onHitDotDurationTurns', label: 'DOT turns', step: 1 });
    extras.push({ key: 'onHitDotApplyChance', label: 'DOT chance', step: 0.05 });
  }
  return extras;
}

function renderSkillCard(skill: SkillRow, fields: FieldDef[]): string {
  const draft = skillDraft.get(skill.skillId) ?? skill.effective;
  const dirty = dirtySkills.has(skill.skillId) ? ' is-dirty' : '';
  const badge = skill.hasOverride ? '<span class="xp-badge">override</span>' : '';

  if (skill.usesAttackStat) {
    const ratioFields = (payload?.heroes ?? [])
      .map((hero) => {
        const values = identityDraft.get(hero.heroClass) ?? hero.identity.effective;
        const ratio = values.basicAttackDamageRatio ?? 0.5;
        const idDirty = dirtyIdentities.has(hero.heroClass) ? ' is-dirty' : '';
        return `<label class="${idDirty}">${hero.name} · básico ATK ×
          <input type="number" step="0.05" data-basic-ratio-class="${hero.heroClass}" value="${ratio}" />
        </label>`;
      })
      .join('');
    return `
    <article class="hc-card${dirty}" data-skill-id="${skill.skillId}">
      <header>
        <strong>${skill.name}</strong> ${badge}
        <span class="xp-muted">${skill.skillId} · ATK × identidade</span>
      </header>
      <p class="lab-hint">Dano real = <code>ATK × basicAttackDamageRatio</code> da identidade de cada herói — <code>basePower</code>/<code>powerPerRank</code> não afetam esta skill.</p>
      <div class="hc-fields">${ratioFields}</div>
      <div class="hc-fields">
        ${numberInputs(
          fields.filter((field) => !['basePower', 'powerPerRank', 'attributeFactor'].includes(field.key)),
          draft,
          'skill-field',
        )}
      </div>
      <button type="button" class="lab-btn--warn" data-reset-skill="${skill.skillId}">↺ baseline (timing)</button>
    </article>`;
  }

  return `
    <article class="hc-card${dirty}" data-skill-id="${skill.skillId}">
      <header>
        <strong>${skill.name}</strong> ${badge}
        <span class="xp-muted">${skill.skillId} · ${skill.kind} · ${skill.pointType}</span>
      </header>
      <div class="hc-fields">
        ${numberInputs([...fields, ...extraSkillFields(skill.baseline)], draft, 'skill-field')}
      </div>
      <button type="button" class="lab-btn--warn" data-reset-skill="${skill.skillId}">↺ baseline</button>
    </article>`;
}

function renderAscensionCard(row: AscensionRow): string {
  const draft = ascensionDraft.get(row.id) ?? toAscensionDraft(row);
  const dirty = dirtyAscensions.has(row.id) ? ' is-dirty' : '';
  const badge = row.hasOverride ? '<span class="xp-badge">override</span>' : '';
  const impact = liveImpact(row);
  const skillList =
    row.impact.skills.length === 0
      ? '<li class="xp-muted">Nenhuma skill de evolução neste tier</li>'
      : row.impact.skills
          .map((skill) => `<li><code>${skill.id}</code> — ${skill.name}</li>`)
          .join('');
  const passiveLine = row.impact.passive
    ? `<code>${row.impact.passive.id}</code> — ${row.impact.passive.name}`
    : '—';
  const reqInputs = row.requirements
    .map((req) => {
      const current =
        draft.requirements.find((entry) => entry.index === req.index)?.value ?? req.value;
      return `<label>${req.label}
        <input type="number" step="1" data-ascension-req="${req.index}" data-req-key="${req.valueKey}" value="${current}" />
      </label>`;
    })
    .join('');

  return `
    <article class="hc-card${dirty}" data-ascension-id="${row.id}">
      <header>
        <strong>T${row.tier} · ${draft.name}</strong> ${badge}
        <span class="xp-muted">${row.id}</span>
      </header>
      <div class="hc-fields">
        <label>Nome
          <input type="text" data-ascension-text="name" value="${draft.name.replace(/"/g, '&quot;')}" />
        </label>
        <label>Caminho
          <input type="text" data-ascension-text="pathLabel" value="${draft.pathLabel.replace(/"/g, '&quot;')}" />
        </label>
        <label>pointsGranted
          <input type="number" step="1" data-ascension-points value="${draft.pointsGranted}" />
        </label>
      </div>
      <label class="hc-desc">Descrição
        <textarea data-ascension-text="description" rows="2">${draft.description}</textarea>
      </label>
      <div class="hc-fields">${reqInputs}</div>
      <div class="hc-impact">
        <h4>Impacto deste tier</h4>
        <p>Passiva: ${passiveLine}</p>
        <p>Skills liberadas (${row.impact.skills.length}):</p>
        <ul>${skillList}</ul>
        <p>Pontos neste tier: <strong data-impact-delta>${
          impact.pointsDelta === 0
            ? 'igual ao baseline'
            : `${impact.pointsDelta > 0 ? '+' : ''}${impact.pointsDelta} vs baseline`
        }</strong></p>
        <p>Aprim. acumulado até aqui: <strong data-impact-cum>${impact.cumulativePoints}</strong></p>
        <p>Total do caminho: <strong data-impact-path>${impact.pathTotalPoints}</strong> pts · ${
          row.impact.pathSkillCount
        } skills no caminho</p>
      </div>
      <button type="button" class="lab-btn--warn" data-reset-ascension="${row.id}">↺ baseline</button>
    </article>`;
}

export function renderHeroCombat(): void {
  const host = document.getElementById('lab-hero-combat');
  if (!host || !payload) return;
  setWorkspaceDirty('heroes', dirtyCount());
  const hero = selectedHero();
  const skills = selected === 'universal' ? payload.universalSkills : (hero?.skills ?? []);
  const identity = hero?.identity;
  const identityValues = hero ? (identityDraft.get(hero.heroClass) ?? identity?.effective ?? {}) : {};
  const baseStatsValues = hero
    ? (baseStatsDraft.get(hero.heroClass) ?? hero.baseStats.effective)
    : {};
  const ascensionsByPath = new Map<string, AscensionRow[]>();
  for (const row of hero?.ascensions ?? []) {
    const label = ascensionDraft.get(row.id)?.pathLabel ?? row.pathLabel;
    const list = ascensionsByPath.get(label) ?? [];
    list.push(row);
    ascensionsByPath.set(label, list);
  }

  host.innerHTML = `
    <div class="xp-layout">
      <aside class="xp-sidebar">
        <p class="lab-hint">Edite identidade, skills, passivas e evoluções. Salva em <code>hero-combat-overrides.json</code>.</p>
        <ul class="hc-hero-list">
          ${payload.heroes
            .map((entry) => {
              const active = selected === entry.heroClass ? ' is-active' : '';
              const pending = heroHasPendingDraft(entry.heroClass);
              const mark = pending
                ? '<span class="mb-badge mb-badge--dirty">rascunho</span>'
                : entry.identity.hasOverride ||
                    entry.baseStats.hasOverride ||
                    entry.skills.some((s) => s.hasOverride) ||
                    entry.ascensions.some((a) => a.hasOverride)
                  ? '<span class="xp-badge">override</span>'
                  : '';
              return `<li><button type="button" class="hc-hero-btn${active}${
                pending ? ' is-dirty' : ''
              }" data-select-hero="${entry.heroClass}">
                <strong>${entry.name}</strong><span>${entry.classLabel}</span>${mark}
              </button></li>`;
            })
            .join('')}
          <li><button type="button" class="hc-hero-btn${selected === 'universal' ? ' is-active' : ''}${
            universalHasPendingDraft() ? ' is-dirty' : ''
          }" data-select-hero="universal">
            <strong>Universais</strong><span>todas as classes</span>${
              universalHasPendingDraft()
                ? '<span class="mb-badge mb-badge--dirty">rascunho</span>'
                : ''
            }
          </button></li>
        </ul>
        <div class="xp-toolbar">
          <button type="button" class="lab-btn--primary" id="hc-save" ${
            dirtyCount() === 0 ? 'disabled' : ''
          }>${
            dirtyCount() > 1 ? `Salvar tudo (${dirtyCount()})` : 'Salvar no sistema'
          }</button>
          <span id="hc-dirty-count" class="xp-dirty-count"></span>
        </div>
        <div class="mb-backups">
          <h3>Backups</h3>
          ${
            payload.backups.length === 0
              ? '<p class="lab-hint">Nenhum backup ainda.</p>'
              : `<ul class="xp-backup-list">${payload.backups
                  .slice(0, 12)
                  .map(
                    (backup) =>
                      `<li><button type="button" class="lab-btn--info" data-restore-backup="${backup.id}">${backup.id}</button></li>`,
                  )
                  .join('')}</ul>`
          }
        </div>
      </aside>
      <section class="xp-main">
        ${
          hero
            ? `<section class="hc-card${
                dirtyIdentities.has(hero.heroClass) || dirtyBaseStats.has(hero.heroClass)
                  ? ' is-dirty'
                  : ''
              }" data-identity="${hero.heroClass}">
                <header><strong>Stats base + identidade</strong> ${
                  hero.identity.hasOverride || hero.baseStats.hasOverride
                    ? '<span class="xp-badge">override</span>'
                    : ''
                }
                <button type="button" class="lab-btn--info" data-open-hero-simulator="${
                  hero.heroClass
                }">Abrir no Simulador</button></header>
                <p class="lab-hint">ATK/DEF/HP base (nível 1) + crescimento. Ataque básico = ATK × <strong>básico ATK ×</strong>.</p>
                <h4 class="hc-subsection">Stats base</h4>
                <div class="hc-fields">${numberInputs(payload.baseStatsFields, baseStatsValues, 'base-stats-field')}</div>
                <h4 class="hc-subsection">Identidade de combate</h4>
                <div class="hc-fields">${numberInputs(payload.identityFields, identityValues, 'identity-field')}</div>
                <button type="button" class="lab-btn--warn" data-reset-identity="${hero.heroClass}">↺ baseline</button>
              </section>
              <h3 class="hc-section">Evoluções</h3>
              ${
                hero.ascensions.length === 0
                  ? '<p class="lab-hint">Esta classe ainda não tem árvore de evoluções no catálogo.</p>'
                  : [...ascensionsByPath.entries()]
                      .map(
                        ([pathLabel, rows]) => `
                        <section class="hc-path">
                          <h4>${pathLabel}</h4>
                          ${rows
                            .sort((a, b) => a.tier - b.tier)
                            .map((row) => renderAscensionCard(row))
                            .join('')}
                        </section>`,
                      )
                      .join('')
              }
              <h3 class="hc-section">Passivas</h3>
              ${hero.passives
                .map((passive) => {
                  const draft = passiveDraft.get(passive.id) ?? passive.effects.map((e) => e.fields);
                  const dirty = dirtyPassives.has(passive.id) ? ' is-dirty' : '';
                  const fields = passive.effects
                    .map((effect, index) => {
                      const defs = Object.keys(effect.fields).map((key) => ({
                        key: `${index}.${key}`,
                        label: `${effect.kind} · ${key}`,
                        step: 0.1,
                      }));
                      const values: Record<string, number> = {};
                      for (const key of Object.keys(effect.fields)) {
                        values[`${index}.${key}`] = draft[index]?.[key] ?? effect.fields[key];
                      }
                      return numberInputs(defs, values, 'passive-field');
                    })
                    .join('');
                  return `<article class="hc-card${dirty}" data-passive-id="${passive.id}">
                    <header><strong>${passive.name}</strong> ${
                      passive.hasOverride ? '<span class="xp-badge">override</span>' : ''
                    }
                    <span class="xp-muted">${passive.source}</span></header>
                    <p class="lab-hint">${passive.description}</p>
                    <div class="hc-fields">${fields}</div>
                    <button type="button" class="lab-btn--warn" data-reset-passive="${passive.id}">↺ baseline</button>
                  </article>`;
                })
                .join('')}`
            : ''
        }
        <h3 class="hc-section">Skills</h3>
        <div class="hc-skill-grid">
          ${skills.map((skill) => renderSkillCard(skill, payload!.skillFields)).join('')}
        </div>
        <p id="hc-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>`;

  updateDirtyChrome();
  bindHeroCombat(host);
}

function bindHeroCombat(host: HTMLElement): void {
  host.querySelector<HTMLButtonElement>('[data-open-hero-simulator]')?.addEventListener(
    'click',
    (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      openHeroInSimulator(button.dataset.openHeroSimulator!);
    },
  );

  host.querySelectorAll<HTMLButtonElement>('[data-select-hero]').forEach((button) => {
    button.addEventListener('click', () => {
      flushVisibleHeroDrafts(host);
      selected = button.dataset.selectHero ?? 'sorcerer';
      renderHeroCombat();
    });
  });

  host.querySelector('#hc-save')?.addEventListener('click', () => {
    flushVisibleHeroDrafts(host);
    void saveDirty().catch((error: Error) => setStatus(error.message, true));
  });

  host.querySelectorAll<HTMLInputElement>('[data-skill-field]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-skill-id]');
    const skillId = card?.dataset.skillId;
    if (!skillId) return;
    input.addEventListener('input', () => {
      const draft = skillDraft.get(skillId) ?? {};
      draft[input.dataset.skillField!] = Number(input.value);
      skillDraft.set(skillId, draft);
      markSkillDirty(skillId);
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-basic-ratio-class]').forEach((input) => {
    const heroClass = input.dataset.basicRatioClass;
    if (!heroClass) return;
    input.addEventListener('input', () => {
      const draft = identityDraft.get(heroClass) ?? {};
      draft.basicAttackDamageRatio = Number(input.value);
      identityDraft.set(heroClass, draft);
      const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
      if (hero && numbersDiffer(draft, hero.identity.effective)) dirtyIdentities.add(heroClass);
      else dirtyIdentities.delete(heroClass);
      input.closest('label')?.classList.toggle('is-dirty', dirtyIdentities.has(heroClass));
      updateDirtyChrome();
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-identity-field]').forEach((input) => {
    const heroClass = input.closest<HTMLElement>('[data-identity]')?.dataset.identity;
    if (!heroClass) return;
    input.addEventListener('input', () => {
      const draft = identityDraft.get(heroClass) ?? {};
      draft[input.dataset.identityField!] = Number(input.value);
      identityDraft.set(heroClass, draft);
      const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
      if (hero && numbersDiffer(draft, hero.identity.effective)) dirtyIdentities.add(heroClass);
      else dirtyIdentities.delete(heroClass);
      input.closest('.hc-card')?.classList.toggle(
        'is-dirty',
        dirtyIdentities.has(heroClass) || dirtyBaseStats.has(heroClass),
      );
      updateDirtyChrome();
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-base-stats-field]').forEach((input) => {
    const heroClass = input.closest<HTMLElement>('[data-identity]')?.dataset.identity;
    if (!heroClass) return;
    input.addEventListener('input', () => {
      const draft = baseStatsDraft.get(heroClass) ?? {};
      draft[input.dataset.baseStatsField!] = Number(input.value);
      baseStatsDraft.set(heroClass, draft);
      const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
      if (hero && numbersDiffer(draft, hero.baseStats.effective)) dirtyBaseStats.add(heroClass);
      else dirtyBaseStats.delete(heroClass);
      input.closest('.hc-card')?.classList.toggle(
        'is-dirty',
        dirtyIdentities.has(heroClass) || dirtyBaseStats.has(heroClass),
      );
      updateDirtyChrome();
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-passive-field]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-passive-id]');
    const passiveId = card?.dataset.passiveId;
    if (!passiveId) return;
    input.addEventListener('input', () => {
      const [indexRaw, key] = (input.dataset.passiveField ?? '').split('.');
      const index = Number(indexRaw);
      const draft = passiveDraft.get(passiveId) ?? [];
      draft[index] = { ...(draft[index] ?? {}), [key]: Number(input.value) };
      passiveDraft.set(passiveId, draft);
      const row = payload?.heroes.flatMap((hero) => hero.passives).find((passive) => passive.id === passiveId);
      const current = row?.effects.map((effect) => effect.fields) ?? [];
      const changed = current.some((fields, i) => numbersDiffer(fields, draft[i] ?? {}));
      if (changed) dirtyPassives.add(passiveId);
      else dirtyPassives.delete(passiveId);
      card.classList.toggle('is-dirty', dirtyPassives.has(passiveId));
      updateDirtyChrome();
    });
  });

  host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-ascension-text]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-ascension-id]');
    const id = card?.dataset.ascensionId;
    if (!id) return;
    input.addEventListener('input', () => {
      const draft = ascensionDraft.get(id);
      const row = allAscensions().find((ascension) => ascension.id === id);
      if (!draft || !row) return;
      const key = input.dataset.ascensionText as 'name' | 'pathLabel' | 'description';
      draft[key] = input.value;
      ascensionDraft.set(id, draft);
      markAscensionDirty(id);
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-ascension-points]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-ascension-id]');
    const id = card?.dataset.ascensionId;
    if (!id) return;
    input.addEventListener('input', () => {
      const draft = ascensionDraft.get(id);
      if (!draft) return;
      draft.pointsGranted = Number(input.value);
      ascensionDraft.set(id, draft);
      markAscensionDirty(id);
    });
  });

  host.querySelectorAll<HTMLInputElement>('[data-ascension-req]').forEach((input) => {
    const card = input.closest<HTMLElement>('[data-ascension-id]');
    const id = card?.dataset.ascensionId;
    if (!id) return;
    input.addEventListener('input', () => {
      const draft = ascensionDraft.get(id);
      if (!draft) return;
      const index = Number(input.dataset.ascensionReq);
      const valueKey = (input.dataset.reqKey as 'min' | 'minRank') || 'min';
      const existing = draft.requirements.find((entry) => entry.index === index);
      if (existing) existing.value = Number(input.value);
      else draft.requirements.push({ index, valueKey, value: Number(input.value) });
      ascensionDraft.set(id, draft);
      markAscensionDirty(id);
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-skill]').forEach((button) => {
    button.addEventListener('click', () => {
      const skillId = button.dataset.resetSkill!;
      const row = allSkills().find((skill) => skill.skillId === skillId);
      if (!row) return;
      skillDraft.set(skillId, { ...row.baseline });
      dirtySkills.add(skillId);
      renderHeroCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-identity]').forEach((button) => {
    button.addEventListener('click', () => {
      const heroClass = button.dataset.resetIdentity!;
      const hero = payload?.heroes.find((entry) => entry.heroClass === heroClass);
      if (!hero) return;
      identityDraft.set(heroClass, { ...hero.identity.baseline });
      baseStatsDraft.set(heroClass, { ...hero.baseStats.baseline });
      dirtyIdentities.add(heroClass);
      dirtyBaseStats.add(heroClass);
      renderHeroCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-passive]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.resetPassive!;
      const row = payload?.heroes.flatMap((hero) => hero.passives).find((passive) => passive.id === id);
      if (!row) return;
      passiveDraft.set(id, row.baselineEffects.map((effect) => ({ ...effect.fields })));
      dirtyPassives.add(id);
      renderHeroCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-reset-ascension]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.resetAscension!;
      const row = allAscensions().find((ascension) => ascension.id === id);
      if (!row) return;
      ascensionDraft.set(id, {
        name: row.baselineName,
        pathLabel: row.baselinePathLabel,
        description: row.baselineDescription,
        pointsGranted: row.baselinePointsGranted,
        requirements: row.requirements.map((req) => ({
          index: req.index,
          valueKey: req.valueKey,
          value: req.baselineValue,
        })),
      });
      dirtyAscensions.add(id);
      renderHeroCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-restore-backup]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.restoreBackup;
      if (!id || !confirm(`Restaurar backup ${id}?`)) return;
      void api(`/api/hero-combat-backups/${encodeURIComponent(id)}/restore`, { method: 'POST' })
        .then(() => loadHeroCombat())
        .then(() => {
          setStatus(`Backup restaurado: ${id}`);
          renderHeroCombat();
        })
        .catch((error: Error) => setStatus(error.message, true));
    });
  });
}

export async function mountHeroCombatTab(): Promise<void> {
  registerWorkspaceSave('heroes', saveDirty);
  await loadHeroCombat();
  renderHeroCombat();
  setStatus('Personagens carregados — edite evoluções/skills/identidade/passivas e salve.');
}

/** Seleciona herói por classe (para deep-link `#heroes?class=knight`). */
export function selectHeroByClass(heroClass: string): void {
  if (!payload) return;
  const found = payload.heroes.find((h) => h.heroClass === heroClass);
  if (found) {
    selected = found.heroClass as typeof selected;
    renderHeroCombat();
  }
}
