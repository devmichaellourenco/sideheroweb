/**
 * UI do editor de skills / identidade / passivas / evoluções no Balance Lab.
 */
import { openHeroInSimulator } from './navigation';
import { confirmChangeReview } from './changeReview';
import { registerWorkspaceSave, setWorkspaceDirty } from './workspaceState';
import { updateHashDeepLink } from './deepLinks';
import { bindHeroSpriteFallback } from './heroSprites';
import {
  bindLabArtFallback,
  labFieldStatIconUrl,
  labSkillIconFallbackUrl,
  labSkillIconUrl,
  labStatIconUrl,
} from './labAssetUrl';

type FieldDef = { key: string; label: string; step: number };

interface SkillRow {
  skillId: string;
  name: string;
  description: string;
  kind: string;
  branch: string;
  heroClass: string;
  pointType: string;
  hasDot: boolean;
  usesAttackStat?: boolean;
  iconUrl?: string;
  iconFallbackUrl?: string;
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
  iconUrl?: string;
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
  spriteUrl?: string;
  requirements: AscensionReqField[];
  impact: {
    skills: Array<{ id: string; name: string; iconUrl?: string; iconFallbackUrl?: string }>;
    passive: { id: string; name: string; iconUrl?: string } | null;
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
  roleLabel: string;
  dexNo: number;
  starter: boolean;
  spriteUrl: string;
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

type SelectedId = string | null;

let payload: Payload | null = null;
let selected: SelectedId = null;
let filterQuery = '';
const collapsedSheetSections = new Set<string>();
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
  if (!selected || selected === 'universal') return null;
  return payload?.heroes.find((hero) => hero.heroClass === selected) ?? null;
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

function openHero(id: string): void {
  selected = id;
  if (id === 'universal') updateHashDeepLink('heroes', 'class', 'universal');
  else updateHashDeepLink('heroes', 'class', id);
}

function closeSheet(): void {
  selected = null;
  updateHashDeepLink('heroes');
}

function sheetSequence(): string[] {
  const ids = (payload?.heroes ?? []).map((hero) => hero.heroClass);
  ids.push('universal');
  return ids;
}

function sheetNeighbor(delta: number): string | null {
  const ids = sheetSequence();
  if (ids.length === 0) return null;
  const current = selected ?? ids[0]!;
  const index = ids.indexOf(current);
  if (index < 0) return ids[0] ?? null;
  return ids[(index + delta + ids.length) % ids.length] ?? null;
}

function sheetEntryLabel(id: string): string {
  if (id === 'universal') return 'Universais';
  return payload?.heroes.find((hero) => hero.heroClass === id)?.name ?? id;
}

function renderSheetPager(title: string): string {
  const prevId = sheetNeighbor(-1);
  const nextId = sheetNeighbor(1);
  const prevName = prevId ? sheetEntryLabel(prevId) : '';
  const nextName = nextId ? sheetEntryLabel(nextId) : '';
  return `<nav class="hc-sheet-pager" aria-label="Trocar personagem">
    <button type="button" class="hc-sheet-step" data-hero-step="-1" title="${escapeHtml(
      prevName,
    )}" aria-label="Anterior: ${escapeHtml(prevName)}" ${prevId ? '' : 'disabled'}>&lt;</button>
    <p class="hc-sheet-pager-current">${escapeHtml(title)}</p>
    <button type="button" class="hc-sheet-step" data-hero-step="1" title="${escapeHtml(
      nextName,
    )}" aria-label="Próximo: ${escapeHtml(nextName)}" ${nextId ? '' : 'disabled'}>&gt;</button>
  </nav>`;
}

function rosterMaxes(): { attack: number; defense: number; health: number; aspd: number } {
  const zeros = { attack: 1, defense: 1, health: 1, aspd: 1 };
  if (!payload) return zeros;
  let attack = 1;
  let defense = 1;
  let health = 1;
  let aspd = 1;
  for (const hero of payload.heroes) {
    const stats = baseStatsDraft.get(hero.heroClass) ?? hero.baseStats.effective;
    const identity = identityDraft.get(hero.heroClass) ?? hero.identity.effective;
    attack = Math.max(attack, Number(stats.attack ?? 0));
    defense = Math.max(defense, Number(stats.defense ?? 0));
    health = Math.max(health, Number(stats.health ?? 0));
    aspd = Math.max(aspd, Number(identity.attackSpeedFactor ?? 0));
  }
  return { attack, defense, health, aspd };
}

function artImg(
  src: string | undefined,
  className: string,
  extras: { fallback?: string; thumb?: 'hero' | 'art'; alt?: string } = {},
): string {
  if (!src) return '';
  const fallback = extras.fallback && extras.fallback !== src
    ? ` data-fallback="${escapeHtml(extras.fallback)}"`
    : '';
  const thumb = extras.thumb === 'hero' ? ' data-hero-thumb' : extras.thumb === 'art' ? ' data-lab-art' : '';
  return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(extras.alt ?? '')}"${thumb}${fallback} loading="lazy" draggable="false" />`;
}

function picto(key: 'attack' | 'defense' | 'health' | 'attackSpeed' | 'dps' | 'cooldown' | 'castSpeed' | 'str'): string {
  return `<img class="hc-picto" src="${escapeHtml(labStatIconUrl(key))}" alt="" aria-hidden="true" data-lab-art />`;
}

function fieldCaption(field: FieldDef): string {
  const iconUrl = labFieldStatIconUrl(field.key);
  const icon = iconUrl
    ? `<img class="hc-picto" src="${escapeHtml(iconUrl)}" alt="" aria-hidden="true" data-lab-art />`
    : '';
  return `<span class="hc-field-caption">${icon}${escapeHtml(field.label)}</span>`;
}

function statBar(label: string, value: number, max: number, kind: string, iconKey: 'attack' | 'defense' | 'health' | 'attackSpeed'): string {
  const pct = Math.max(4, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `<div class="hc-bar hc-bar--${kind}">
    <span class="hc-bar-label">${picto(iconKey)}${label}</span>
    <span class="hc-bar-track" aria-hidden="true"><i style="width:${pct}%"></i></span>
    <strong class="hc-bar-value">${shown}</strong>
  </div>`;
}

function heroHasOverride(entry: HeroEntry): boolean {
  return (
    entry.identity.hasOverride ||
    entry.baseStats.hasOverride ||
    entry.skills.some((skill) => skill.hasOverride) ||
    entry.passives.some((passive) => passive.hasOverride) ||
    entry.ascensions.some((ascension) => ascension.hasOverride)
  );
}

function branchLabel(branch: string): string {
  if (branch === 'offense') return 'Ofensa';
  if (branch === 'defense') return 'Defesa';
  if (branch === 'utility') return 'Utilidade';
  return branch;
}

function skillKindLabel(kind: string): string {
  if (kind === 'damage') return 'Dano';
  if (kind === 'heal_ally') return 'Cura';
  if (kind === 'buff_attack') return 'Buff de ataque';
  if (kind === 'debuff_defense') return 'Debuff de defesa';
  return 'Skill';
}

function pointTypeLabel(pointType: string): string {
  if (pointType === 'improvement') return 'Aprimoramento';
  if (pointType === 'ascension') return 'Evolução';
  return 'Skill';
}

function overrideBadge(hasOverride: boolean): string {
  return hasOverride ? '<span class="xp-badge">alterado</span>' : '';
}

function passiveSourceLabel(source: string): string {
  if (source === 'classe') return 'Classe';
  for (const hero of payload?.heroes ?? []) {
    const row = hero.ascensions.find((ascension) => ascension.id === source);
    if (row) {
      const draft = ascensionDraft.get(row.id);
      return draft?.name ?? row.name;
    }
  }
  return 'Evolução';
}

function passiveEffectLabel(kind: string, fieldKey: string): string {
  const kinds: Record<string, string> = {
    max_health_percent_per_defense: 'Vida % por defesa',
    tree_damage_percent_per_level: 'Dano da árvore % por nível',
    ally_support_percent_per_int: 'Cura/buff % por INT',
    max_health_percent_per_level: 'Vida % por nível',
    tree_damage_percent_per_str: 'Dano da árvore % por FOR',
    tree_damage_percent_per_int: 'Dano da árvore % por INT',
    tree_damage_percent_per_dex: 'Dano da árvore % por DES',
    attack_percent_flat: 'Ataque %',
    defense_percent_flat: 'Defesa %',
    max_health_percent_flat: 'Vida %',
    ally_support_percent_flat: 'Cura/buff %',
    tree_damage_percent_flat: 'Dano da árvore %',
  };
  const fields: Record<string, string> = {
    percentPerPoint: 'por ponto',
    percentPerLevel: 'por nível',
    percent: 'valor',
  };
  const kindLabel = kinds[kind];
  if (kindLabel) return kindLabel;
  return fields[fieldKey] ?? 'Valor';
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
  setStatus('Salvo. Rebuild do jogo para aplicar no combate.');
  renderHeroCombat();
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

function extraSkillFields(values: Record<string, number>): FieldDef[] {
  const extras: FieldDef[] = [];
  if (values.healConditionThreshold !== undefined) {
    extras.push({ key: 'healConditionThreshold', label: 'Cura se HP <', step: 0.05 });
  }
  if (values.effectDurationTurns !== undefined) {
    extras.push({ key: 'effectDurationTurns', label: 'Duração (turnos)', step: 1 });
  }
  if (values.onHitDotDamagePerTurn !== undefined) {
    extras.push({ key: 'onHitDotDamagePerTurn', label: 'DOT por turno', step: 1 });
    extras.push({ key: 'onHitDotDurationTurns', label: 'Duração do DOT', step: 1 });
    extras.push({ key: 'onHitDotApplyChance', label: 'Chance do DOT', step: 0.05 });
  }
  return extras;
}

function skillHead(skill: SkillRow, meta: string, badge: string): string {
  return `<header class="hc-card-head">
      ${artImg(skill.iconUrl, 'hc-art hc-art--skill', {
        fallback: skill.iconFallbackUrl,
        thumb: 'art',
        alt: skill.name,
      })}
      <div class="hc-card-head-text">
        <strong>${escapeHtml(skill.name)}</strong> ${badge}
        ${meta ? `<span class="xp-muted">${escapeHtml(meta)}</span>` : ''}
      </div>
    </header>`;
}

function renderSkillCard(skill: SkillRow, fields: FieldDef[]): string {
  const draft = skillDraft.get(skill.skillId) ?? skill.effective;
  const dirty = dirtySkills.has(skill.skillId) ? ' is-dirty' : '';
  const badge = overrideBadge(skill.hasOverride);

  if (skill.usesAttackStat) {
    const ratioFields = (payload?.heroes ?? [])
      .map((hero) => {
        const values = identityDraft.get(hero.heroClass) ?? hero.identity.effective;
        const ratio = values.basicAttackDamageRatio ?? 0.5;
        const idDirty = dirtyIdentities.has(hero.heroClass) ? ' is-dirty' : '';
        return `<label class="${idDirty}"><span class="hc-field-caption">${picto('attack')}${escapeHtml(
          hero.name,
        )} · ataque básico × ATK</span>
          <input type="number" step="0.05" data-basic-ratio-class="${hero.heroClass}" value="${ratio}" />
        </label>`;
      })
      .join('');
    return `
    <article class="hc-card${dirty}" data-skill-id="${skill.skillId}">
      ${skillHead(skill, 'Ataque básico', badge)}
      ${
        skill.description
          ? `<p class="hc-skill-blurb">${escapeHtml(skill.description)}</p>`
          : ''
      }
      <p class="lab-hint">O dano é ATK × o fator de ataque básico da identidade de cada herói. Poder base e poder por rank não entram nesta skill.</p>
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
      ${skillHead(
        skill,
        `${branchLabel(skill.branch)} · ${pointTypeLabel(skill.pointType)}`,
        badge,
      )}
      ${
        skill.description
          ? `<p class="hc-skill-blurb">${escapeHtml(skill.description)}</p>`
          : ''
      }
      <p class="hc-skill-meta">${escapeHtml(skillKindLabel(skill.kind))} · CD ${
        draft.cooldownTurns ?? 0
      } turnos · poder/rank ${draft.powerPerRank ?? 0}</p>
      <div class="hc-fields">
        ${numberInputs([...fields, ...extraSkillFields(skill.baseline)], draft, 'skill-field')}
      </div>
      <button type="button" class="lab-btn--warn" data-reset-skill="${skill.skillId}">↺ baseline</button>
    </article>`;
}

function renderAscensionCard(row: AscensionRow): string {
  const draft = ascensionDraft.get(row.id) ?? toAscensionDraft(row);
  const dirty = dirtyAscensions.has(row.id) ? ' is-dirty' : '';
  const badge = overrideBadge(row.hasOverride);
  const impact = liveImpact(row);
  const skillList =
    row.impact.skills.length === 0
      ? '<li class="xp-muted">Nenhuma skill de evolução neste tier</li>'
      : row.impact.skills
          .map(
            (skill) =>
              `<li class="hc-impact-skill">${artImg(skill.iconUrl, 'hc-art hc-art--xs', {
                fallback: skill.iconFallbackUrl,
                thumb: 'art',
                alt: skill.name,
              })}<span>${escapeHtml(skill.name)}</span></li>`,
          )
          .join('');
  const passiveLine = row.impact.passive
    ? `<span class="hc-impact-skill">${artImg(row.impact.passive.iconUrl, 'hc-art hc-art--xs', {
        thumb: 'art',
        alt: row.impact.passive.name,
      })}<span>${escapeHtml(row.impact.passive.name)}</span></span>`
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
      <header class="hc-card-head">
        ${artImg(row.spriteUrl, 'hc-art hc-art--evo', { thumb: 'hero', alt: draft.name })}
        <div class="hc-card-head-text">
          <strong>T${row.tier} · ${escapeHtml(draft.name)}</strong> ${badge}
        </div>
      </header>
      <div class="hc-fields">
        <label>Nome
          <input type="text" data-ascension-text="name" value="${draft.name.replace(/"/g, '&quot;')}" />
        </label>
        <label>Caminho
          <input type="text" data-ascension-text="pathLabel" value="${draft.pathLabel.replace(/"/g, '&quot;')}" />
        </label>
        <label>Pontos concedidos
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

function renderToolbar(): string {
  const count = dirtyCount();
  const backups = payload?.backups ?? [];
  return `
    <div class="hc-toolbar">
      <button type="button" class="lab-btn--primary" id="hc-save" ${count === 0 ? 'disabled' : ''}>${
        count > 1 ? `Salvar tudo (${count})` : 'Salvar no sistema'
      }</button>
      <span id="hc-dirty-count" class="xp-dirty-count"></span>
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

function renderRosterCard(entry: HeroEntry): string {
  const pending = heroHasPendingDraft(entry.heroClass);
  const stats = baseStatsDraft.get(entry.heroClass) ?? entry.baseStats.effective;
  const marks = [
    pending ? '<span class="mb-badge mb-badge--dirty">rascunho</span>' : '',
    !pending && heroHasOverride(entry) ? '<span class="xp-badge">alterado</span>' : '',
    entry.starter ? '<span class="hc-tag hc-tag--starter">início</span>' : '',
  ]
    .filter(Boolean)
    .join('');
  return `
    <button type="button" class="hc-dex-card${pending ? ' is-dirty' : ''}" data-select-hero="${
      entry.heroClass
    }">
      <span class="hc-dex-no">${padDex(entry.dexNo)}</span>
      <img class="hc-dex-art" src="${escapeHtml(entry.spriteUrl)}" alt="" data-hero-thumb />
      <strong class="hc-dex-name">${escapeHtml(entry.name)}</strong>
      <span class="hc-dex-role">${escapeHtml(entry.classLabel)} · ${escapeHtml(entry.roleLabel)}</span>
      <span class="hc-dex-stats">
        <span class="res res--atk">${picto('attack')} ${stats.attack ?? 0}</span>
        <span class="res res--def">${picto('defense')} ${stats.defense ?? 0}</span>
        <span class="res res--hp">${picto('health')} ${stats.health ?? 0}</span>
      </span>
      <span class="hc-dex-marks">${marks}</span>
    </button>`;
}

function renderRoster(): string {
  const q = filterQuery.trim().toLowerCase();
  const heroes = (payload?.heroes ?? []).filter((entry) => {
    if (!q) return true;
    return [entry.name, entry.classLabel, entry.roleLabel, entry.heroClass]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
  const showUniversal =
    !q ||
    ['universais', 'universal'].some(
      (token) => token.startsWith(q) || (q.length >= 4 && token.includes(q)),
    );
  return `
    <div class="hc-dex">
      <header class="hc-dex-head">
        <div>
          <p class="hc-dex-kicker">Índice de heróis</p>
          <h2>Personagens</h2>
          <p class="lab-hint">Clique num herói para abrir a ficha (stats, skills, passivas e evoluções).</p>
        </div>
        <label class="hc-dex-search">Buscar
          <input type="search" id="hc-filter" value="${escapeHtml(filterQuery)}" placeholder="nome ou classe" />
        </label>
      </header>
      <div class="hc-dex-grid">
        ${heroes.map((entry) => renderRosterCard(entry)).join('')}
        ${
          showUniversal
            ? `<button type="button" class="hc-dex-card hc-dex-card--universal${
                universalHasPendingDraft() ? ' is-dirty' : ''
              }" data-select-hero="universal">
              <span class="hc-dex-no">NO.—</span>
              ${artImg(labSkillIconUrl('basic_attack'), 'hc-dex-art', {
                fallback: labSkillIconFallbackUrl('basic_attack'),
                thumb: 'art',
                alt: 'Universais',
              })}
              <strong class="hc-dex-name">Universais</strong>
              <span class="hc-dex-role">Todas as classes</span>
              <span class="hc-dex-stats">Ataque básico e skills compartilhadas</span>
              <span class="hc-dex-marks">${
                universalHasPendingDraft()
                  ? '<span class="mb-badge mb-badge--dirty">rascunho</span>'
                  : ''
              }</span>
            </button>`
            : ''
        }
      </div>
      ${heroes.length === 0 && !showUniversal ? '<p class="lab-hint">Nenhum herói neste filtro.</p>' : ''}
      ${renderToolbar()}
      <p id="hc-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
    </div>`;
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

function renderEvolutionTrack(hero: HeroEntry): string {
  const byPath = new Map<string, AscensionRow[]>();
  for (const row of hero.ascensions) {
    const label = ascensionDraft.get(row.id)?.pathLabel ?? row.pathLabel;
    const list = byPath.get(label) ?? [];
    list.push(row);
    byPath.set(label, list);
  }
  if (byPath.size === 0) {
    return '<p class="lab-hint">Esta classe ainda não tem árvore de evoluções no catálogo.</p>';
  }
  return [...byPath.entries()]
    .map(([pathLabel, rows]) => {
      const ordered = [...rows].sort((a, b) => a.tier - b.tier);
      return `
        <section class="hc-path">
          <h4>${escapeHtml(pathLabel)}</h4>
          <ol class="hc-evo">
            ${ordered
              .map((row) => {
                const draft = ascensionDraft.get(row.id) ?? toAscensionDraft(row);
                return `<li>${artImg(row.spriteUrl, 'hc-evo-art', {
                  thumb: 'hero',
                  alt: draft.name,
                })}<span class="hc-evo-tier">T${row.tier}</span> ${escapeHtml(draft.name)}</li>`;
              })
              .join('')}
          </ol>
          ${ordered.map((row) => renderAscensionCard(row)).join('')}
        </section>`;
    })
    .join('');
}

function renderPassives(hero: HeroEntry): string {
  if (hero.passives.length === 0) {
    return '<p class="lab-hint">Esta classe não tem passivas no catálogo.</p>';
  }
  return hero.passives
    .map((passive) => {
      const draft = passiveDraft.get(passive.id) ?? passive.effects.map((e) => e.fields);
      const dirty = dirtyPassives.has(passive.id) ? ' is-dirty' : '';
      const fields = passive.effects
        .map((effect, index) => {
          const defs = Object.keys(effect.fields).map((key) => ({
            key: `${index}.${key}`,
            label: passiveEffectLabel(effect.kind, key),
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
        <header class="hc-card-head">
          ${artImg(passive.iconUrl, 'hc-art hc-art--trait', { thumb: 'art', alt: passive.name })}
          <div class="hc-card-head-text">
            <strong>${escapeHtml(passive.name)}</strong> ${overrideBadge(passive.hasOverride)}
            <span class="xp-muted">${escapeHtml(passiveSourceLabel(passive.source))}</span>
          </div>
        </header>
        <p class="hc-skill-blurb">${escapeHtml(passive.description)}</p>
        <div class="hc-fields">${fields}</div>
        <button type="button" class="lab-btn--warn" data-reset-passive="${passive.id}">↺ baseline</button>
      </article>`;
    })
    .join('');
}

function renderSheet(): string {
  const hero = selectedHero();
  const skills = selected === 'universal' ? (payload?.universalSkills ?? []) : (hero?.skills ?? []);
  const maxes = rosterMaxes();

  if (selected === 'universal') {
    return `
      <div class="hc-sheet">
        <nav class="hc-sheet-nav">
          <button type="button" class="lab-btn--info" data-dex-back>← Índice</button>
        </nav>
        ${renderSheetPager('Universais')}
        <header class="hc-sheet-head">
          ${artImg(labSkillIconUrl('basic_attack'), 'hc-sheet-art', {
            fallback: labSkillIconFallbackUrl('basic_attack'),
            thumb: 'art',
            alt: 'Universais',
          })}
          <div class="hc-sheet-id">
            <span class="hc-dex-no">NO.—</span>
            <h2>Universais</h2>
            <p class="hc-sheet-tag">Todas as classes</p>
          </div>
        </header>
        <p class="lab-hint">Skills compartilhadas. O ataque básico usa o ATK de cada herói.</p>
        ${renderSheetBlock(
          'skills',
          'Skills',
          `<div class="hc-skill-grid">${skills
            .map((skill) => renderSkillCard(skill, payload!.skillFields))
            .join('')}</div>`,
        )}
        ${renderToolbar()}
        <p id="hc-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </div>`;
  }

  if (!hero) return renderRoster();

  const identityValues = identityDraft.get(hero.heroClass) ?? hero.identity.effective;
  const baseStatsValues = baseStatsDraft.get(hero.heroClass) ?? hero.baseStats.effective;
  const dirtyId = dirtyIdentities.has(hero.heroClass) || dirtyBaseStats.has(hero.heroClass);

  return `
    <div class="hc-sheet">
      <nav class="hc-sheet-nav">
        <button type="button" class="lab-btn--info" data-dex-back>← Índice</button>
      </nav>
      ${renderSheetPager(hero.name)}
      <header class="hc-sheet-head">
        <img class="hc-sheet-art" src="${escapeHtml(hero.spriteUrl)}" alt="" data-hero-thumb />
        <div class="hc-sheet-id">
          <span class="hc-dex-no">${padDex(hero.dexNo)}</span>
          <h2>${escapeHtml(hero.name)}</h2>
          <p class="hc-sheet-tag">${escapeHtml(hero.classLabel)} · ${escapeHtml(hero.roleLabel)}${
            hero.starter ? ' · início' : ''
          }</p>
        </div>
        <button type="button" class="lab-btn--info" data-open-hero-simulator="${hero.heroClass}">Abrir no Simulador</button>
      </header>

      ${renderSheetBlock(
        'overview',
        'Visão geral',
        `<div class="hc-bars">
          ${statBar('ATK', Number(baseStatsValues.attack ?? 0), maxes.attack, 'atk', 'attack')}
          ${statBar('DEF', Number(baseStatsValues.defense ?? 0), maxes.defense, 'def', 'defense')}
          ${statBar('HP', Number(baseStatsValues.health ?? 0), maxes.health, 'hp', 'health')}
          ${statBar('ASPD', Number(identityValues.attackSpeedFactor ?? 0), maxes.aspd, 'spd', 'attackSpeed')}
        </div>`,
      )}

      ${renderSheetBlock(
        'attributes',
        'Atributos',
        `<div class="hc-card${dirtyId ? ' is-dirty' : ''}" data-identity="${hero.heroClass}">
          <p class="lab-hint">ATK/DEF/HP base (nível 1) + crescimento. O ataque básico é ATK × o fator de ataque básico.</p>
          <h4 class="hc-subsection">Stats base</h4>
          <div class="hc-fields">${numberInputs(payload!.baseStatsFields, baseStatsValues, 'base-stats-field')}</div>
          <h4 class="hc-subsection">Identidade de combate</h4>
          <div class="hc-fields">${numberInputs(payload!.identityFields, identityValues, 'identity-field')}</div>
          <button type="button" class="lab-btn--warn" data-reset-identity="${hero.heroClass}">↺ baseline</button>
        </div>`,
        overrideBadge(hero.identity.hasOverride || hero.baseStats.hasOverride),
      )}

      ${renderSheetBlock('evolution', 'Evolução', renderEvolutionTrack(hero))}

      ${renderSheetBlock('passives', 'Passivas', renderPassives(hero))}

      ${renderSheetBlock(
        'skills',
        'Skills',
        `<div class="hc-skill-grid">${skills
          .map((skill) => renderSkillCard(skill, payload!.skillFields))
          .join('')}</div>`,
      )}
      ${renderToolbar()}
      <p id="hc-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
    </div>`;
}

export function renderHeroCombat(): void {
  const host = document.getElementById('lab-hero-combat');
  if (!host || !payload) return;
  setWorkspaceDirty('heroes', dirtyCount());
  host.innerHTML = selected ? renderSheet() : renderRoster();
  updateDirtyChrome();
  bindHeroCombat(host);
}

function bindHeroCombat(host: HTMLElement): void {
  host.querySelectorAll<HTMLImageElement>('[data-hero-thumb]').forEach(bindHeroSpriteFallback);
  host.querySelectorAll<HTMLImageElement>('[data-lab-art]').forEach(bindLabArtFallback);

  host.querySelector<HTMLInputElement>('#hc-filter')?.addEventListener('input', (event) => {
    filterQuery = (event.currentTarget as HTMLInputElement).value;
    renderHeroCombat();
    const next = document.getElementById('hc-filter') as HTMLInputElement | null;
    next?.focus();
    next?.setSelectionRange(filterQuery.length, filterQuery.length);
  });

  host.querySelector('[data-dex-back]')?.addEventListener('click', () => {
    flushVisibleHeroDrafts(host);
    closeSheet();
    renderHeroCombat();
  });

  host.querySelectorAll<HTMLButtonElement>('[data-toggle-section]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.toggleSection;
      if (!id) return;
      flushVisibleHeroDrafts(host);
      if (collapsedSheetSections.has(id)) collapsedSheetSections.delete(id);
      else collapsedSheetSections.add(id);
      renderHeroCombat();
    });
  });

  host.querySelectorAll<HTMLButtonElement>('[data-hero-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextId = sheetNeighbor(Number(button.dataset.heroStep));
      if (!nextId) return;
      flushVisibleHeroDrafts(host);
      openHero(nextId);
      renderHeroCombat();
    });
  });

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
      openHero(button.dataset.selectHero ?? 'sorcerer');
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
  setStatus('Índice de heróis — clique numa carta para abrir a ficha.');
}

/** Seleciona herói por classe (para deep-link `#heroes?class=knight`). */
export function selectHeroByClass(heroClass: string): void {
  if (!payload) return;
  if (heroClass === 'universal') {
    openHero('universal');
    renderHeroCombat();
    return;
  }
  const found = payload.heroes.find((h) => h.heroClass === heroClass);
  if (found) {
    openHero(found.heroClass);
    renderHeroCombat();
  }
}
