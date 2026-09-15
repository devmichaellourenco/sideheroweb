import { GameStateDto, GearDto, HeroDto } from '../../application/dto/GameStateDto';
import { GearUpgradeHintDto } from '../../application/dto/GearUpgradeHintDto';
import { EquippedGearDto, GEAR_SLOT_LABELS, GearSlotKey, getHeroEquipment } from './GearPresentation';

export type GearStatTone = 'better' | 'worse' | 'equal';

export interface GearStatDelta {
  key: string;
  label: string;
  delta: number;
  tone: GearStatTone;
  /** Texto compacto: `ATK +7`, `DEF -2`, `HP =`. */
  text: string;
}

export interface GearStatComparison {
  attack: string;
  defense: string;
  health: string;
}

export interface BestHeroRecommendation {
  heroId: string;
  heroName: string;
  equipped: EquippedGearDto | null;
  totalGain: number;
}

export type GearUpgradeStatus = GearUpgradeHintDto['status'];

export interface GearUpgradeInfo {
  status: GearUpgradeStatus;
  gain: number;
  recommendation: BestHeroRecommendation | null;
}

type GearStatBag = 'int' | 'percent' | 'chance';

type GearStatReader = (gear: EquippedGearDto | GearDto) => number;

interface GearStatDef {
  key: string;
  label: string;
  format: GearStatFormat;
  /** Stats principais: sempre listados ao comparar com item equipado. */
  primary?: boolean;
  read: GearStatReader;
}

const EMPTY_STATS: EquippedGearDto = {
  id: '',
  name: '',
  templateId: '',
  slot: '',
  rarity: '',
  attackBonus: 0,
  defenseBonus: 0,
  healthBonus: 0,
};

const GEAR_STAT_DEFS: readonly GearStatDef[] = [
  { key: 'attack', label: 'ATK', format: 'int', primary: true, read: (g) => g.attackBonus },
  { key: 'defense', label: 'DEF', format: 'int', primary: true, read: (g) => g.defenseBonus },
  { key: 'health', label: 'HP', format: 'int', primary: true, read: (g) => g.healthBonus },
  {
    key: 'attackPercent',
    label: 'ATK%',
    format: 'percent',
    read: (g) => g.attackPercentBonus ?? 0,
  },
  {
    key: 'defensePercent',
    label: 'DEF%',
    format: 'percent',
    read: (g) => g.defensePercentBonus ?? 0,
  },
  {
    key: 'healthPercent',
    label: 'HP%',
    format: 'percent',
    read: (g) => g.healthPercentBonus ?? 0,
  },
  {
    key: 'physicalDamagePercent',
    label: 'Dano Fís.',
    format: 'percent',
    read: (g) => g.physicalDamagePercentBonus ?? 0,
  },
  {
    key: 'attackSpeed',
    label: 'ASPD',
    format: 'int',
    read: (g) => g.attackSpeedBonus ?? 0,
  },
  {
    key: 'castSpeed',
    label: 'Cast',
    format: 'int',
    read: (g) => g.castSpeedBonus ?? 0,
  },
  {
    key: 'cooldownReduction',
    label: 'Red. CD',
    format: 'percent',
    read: (g) => g.cooldownReductionBonus ?? 0,
  },
  {
    key: 'critChance',
    label: 'Crít',
    format: 'chance',
    read: (g) => g.critChanceBonus ?? 0,
  },
  {
    key: 'critDamage',
    label: 'Crít Dmg',
    format: 'chance',
    read: (g) => g.critDamageBonus ?? 0,
  },
  {
    key: 'dodge',
    label: 'Esquiva',
    format: 'chance',
    read: (g) => g.dodgeChanceBonus ?? 0,
  },
  {
    key: 'block',
    label: 'Bloqueio',
    format: 'chance',
    read: (g) => g.blockChanceBonus ?? 0,
  },
  {
    key: 'damageReduction',
    label: 'Red. Dano',
    format: 'chance',
    read: (g) => g.damageReductionBonus ?? 0,
  },
  { key: 'fireResist', label: 'Res. Fogo', format: 'percent', read: (g) => g.fireResistBonus ?? 0 },
  { key: 'coldResist', label: 'Res. Gelo', format: 'percent', read: (g) => g.coldResistBonus ?? 0 },
  {
    key: 'lightningResist',
    label: 'Res. Raio',
    format: 'percent',
    read: (g) => g.lightningResistBonus ?? 0,
  },
  { key: 'airResist', label: 'Res. Ar', format: 'percent', read: (g) => g.airResistBonus ?? 0 },
  {
    key: 'allElementalResist',
    label: 'Res. Elem.',
    format: 'percent',
    read: (g) => g.allElementalResistBonus ?? 0,
  },
  {
    key: 'fireResistFlat',
    label: 'Res. Fogo',
    format: 'int',
    read: (g) => g.fireResistFlat ?? 0,
  },
  {
    key: 'coldResistFlat',
    label: 'Res. Gelo',
    format: 'int',
    read: (g) => g.coldResistFlat ?? 0,
  },
  {
    key: 'lightningResistFlat',
    label: 'Res. Raio',
    format: 'int',
    read: (g) => g.lightningResistFlat ?? 0,
  },
  { key: 'airResistFlat', label: 'Res. Ar', format: 'int', read: (g) => g.airResistFlat ?? 0 },
  {
    key: 'fireDamage',
    label: 'Dano Fogo',
    format: 'percent',
    read: (g) => g.fireDamageBonus ?? 0,
  },
  {
    key: 'fireResistPenetration',
    label: 'Ignora Res. Fogo',
    format: 'percent',
    read: (g) => g.fireResistPenetrationBonus ?? 0,
  },
  {
    key: 'coldDamage',
    label: 'Dano Gelo',
    format: 'percent',
    read: (g) => g.coldDamageBonus ?? 0,
  },
  {
    key: 'lightningDamage',
    label: 'Dano Raio',
    format: 'percent',
    read: (g) => g.lightningDamageBonus ?? 0,
  },
  {
    key: 'airDamage',
    label: 'Dano Ar',
    format: 'percent',
    read: (g) => g.airDamageBonus ?? 0,
  },
  {
    key: 'allElementalDamage',
    label: 'Dano Elem.',
    format: 'percent',
    read: (g) => g.allElementalDamageBonus ?? 0,
  },
  { key: 'fireDamageFlat', label: 'Dano Fogo', format: 'int', read: (g) => g.fireDamageFlat ?? 0 },
  { key: 'coldDamageFlat', label: 'Dano Gelo', format: 'int', read: (g) => g.coldDamageFlat ?? 0 },
  {
    key: 'lightningDamageFlat',
    label: 'Dano Raio',
    format: 'int',
    read: (g) => g.lightningDamageFlat ?? 0,
  },
  { key: 'airDamageFlat', label: 'Dano Ar', format: 'int', read: (g) => g.airDamageFlat ?? 0 },
];

function toRecommendation(hint: GearUpgradeHintDto): BestHeroRecommendation {
  return {
    heroId: hint.heroId,
    heroName: hint.heroName,
    equipped: hint.equipped,
    totalGain: hint.gain,
  };
}

export function getGearUpgradeInfo(state: GameStateDto, gear: GearDto): GearUpgradeInfo {
  const hint = state.gearUpgradeHints[gear.id];
  if (!hint) {
    return { status: 'equal', gain: 0, recommendation: null };
  }

  return {
    status: hint.status,
    gain: hint.gain,
    recommendation: toRecommendation(hint),
  };
}

function gearPower(
  gear: Pick<GearDto, 'attackBonus' | 'defenseBonus' | 'healthBonus'>,
): number {
  return gear.attackBonus + gear.defenseBonus + gear.healthBonus;
}

export function getGearUpgradeInfoForHero(
  state: GameStateDto,
  gear: GearDto,
  heroId: string,
): GearUpgradeInfo {
  const hero = state.heroes.find((entry) => entry.id === heroId);
  if (!hero) return getGearUpgradeInfo(state, gear);

  const equipped = getHeroEquipment(hero, gear.slot as GearSlotKey);
  const gain = gearPower(gear) - gearPower(equipped ?? { attackBonus: 0, defenseBonus: 0, healthBonus: 0 });
  const status: GearUpgradeStatus = gain > 0 ? 'upgrade' : gain < 0 ? 'downgrade' : 'equal';

  return {
    status,
    gain,
    recommendation: {
      heroId: hero.id,
      heroName: hero.name,
      equipped,
      totalGain: gain,
    },
  };
}

export function getGearUpgradeInfoForActiveParty(
  state: GameStateDto,
  gear: GearDto,
): GearUpgradeInfo {
  let best: GearUpgradeInfo = { status: 'equal', gain: 0, recommendation: null };

  for (const heroId of state.activePartyIds) {
    const info = getGearUpgradeInfoForHero(state, gear, heroId);
    if (info.gain > best.gain) {
      best = info;
    }
  }

  return best;
}

export function sortGearForHero(
  state: GameStateDto,
  gears: GearDto[],
  heroId: string,
): GearDto[] {
  return [...gears].sort((left, right) => {
    const leftGain = getGearUpgradeInfoForHero(state, left, heroId).gain;
    const rightGain = getGearUpgradeInfoForHero(state, right, heroId).gain;
    if (rightGain !== leftGain) return rightGain - leftGain;
    return left.name.localeCompare(right.name, 'pt-BR');
  });
}

export function renderUpgradeBadge(status: GearUpgradeStatus, gain = 0): string {
  const toneClass =
    status === 'upgrade'
      ? 'gear-upgrade-upgrade'
      : status === 'downgrade'
        ? 'gear-upgrade-downgrade'
        : 'gear-upgrade-equal';
  const label =
    status === 'equal' ? '=' : `${gain > 0 ? '+' : ''}${gain}`;

  return `<span class="gear-upgrade-badge ${toneClass}">${label}</span>`;
}

export function countUpgradeItems(state: GameStateDto): number {
  if (typeof state.activePartyUpgradeCount === 'number') {
    return state.activePartyUpgradeCount;
  }

  return state.inventory.filter(
    (gear) => getGearUpgradeInfoForActiveParty(state, gear).status === 'upgrade',
  ).length;
}

export function countRecommendedFromLoot(state: GameStateDto, gearIds: string[]): number {
  return gearIds.filter((gearId) => {
    const gear = state.inventory.find((entry) => entry.id === gearId);
    if (!gear) return false;
    return getGearUpgradeInfo(state, gear).gain > 0;
  }).length;
}

export function sortGearByBestGain(state: GameStateDto, gears: GearDto[]): GearDto[] {
  return [...gears].sort((left, right) => {
    const leftGain = getGearUpgradeInfo(state, left).gain;
    const rightGain = getGearUpgradeInfo(state, right).gain;
    if (rightGain !== leftGain) return rightGain - leftGain;
    return left.name.localeCompare(right.name, 'pt-BR');
  });
}

export function findBestHeroForGear(state: GameStateDto, gear: GearDto): BestHeroRecommendation | null {
  const hint = state.gearUpgradeHints[gear.id];
  return hint ? toRecommendation(hint) : null;
}

function toneForDelta(delta: number): GearStatTone {
  if (delta > 0) return 'better';
  if (delta < 0) return 'worse';
  return 'equal';
}

function formatChancePercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

function formatDeltaMagnitude(delta: number, format: GearStatFormat): string {
  const abs = Math.abs(delta);
  if (format === 'chance') return formatChancePercent(abs);
  if (format === 'percent') return `${abs}%`;
  if (Number.isInteger(abs)) return String(abs);
  return String(Math.round(abs * 10) / 10);
}

function buildStatDelta(def: GearStatDef, current: number, next: number): GearStatDelta {
  const delta = next - current;
  const tone = toneForDelta(delta);
  const text =
    tone === 'equal'
      ? `${def.label} =`
      : `${def.label} ${delta > 0 ? '+' : '−'}${formatDeltaMagnitude(delta, def.format)}`;

  return { key: def.key, label: def.label, delta, tone, text };
}

/**
 * Deltas por status vs. o item equipado no slot (ou vs. slot vazio).
 * - Sem equipado: só diferenças ≠ 0 (bônus do candidato).
 * - Com equipado: ATK/DEF/HP sempre; demais stats só se delta ≠ 0.
 */
export function listGearStatDeltas(
  gear: GearDto,
  equipped: EquippedGearDto | null,
): GearStatDelta[] {
  const baseline = equipped ?? EMPTY_STATS;
  const hasEquipped = equipped !== null;
  const deltas: GearStatDelta[] = [];

  for (const def of GEAR_STAT_DEFS) {
    const current = def.read(baseline);
    const next = def.read(gear);
    if (!hasEquipped && current === 0 && next === 0) continue;
    if (hasEquipped && !def.primary && current === 0 && next === 0) continue;

    const delta = buildStatDelta(def, current, next);
    if (!hasEquipped && delta.tone === 'equal') continue;
    if (hasEquipped && !def.primary && delta.tone === 'equal') continue;

    deltas.push(delta);
  }

  return deltas;
}

/** ATK/DEF/HP com diferença (omite iguais) — útil para resumos. */
export function listPrimaryGearStatDeltas(
  gear: GearDto,
  equipped: EquippedGearDto | null,
): GearStatDelta[] {
  return listGearStatDeltas(gear, equipped).filter(
    (entry) =>
      (entry.key === 'attack' || entry.key === 'defense' || entry.key === 'health') &&
      entry.tone !== 'equal',
  );
}

export type GridCompareBadgeKind = 'upgrade' | 'downgrade' | 'mixed' | 'equal';

/**
 * Badge do ícone na grid:
 * - só melhorias → ▲
 * - só pioras → ▼
 * - mistura → ▲▼
 * - tudo igual → sem ícone
 */
export function resolveGridCompareBadge(
  gear: GearDto,
  equipped: EquippedGearDto | null,
): GridCompareBadgeKind {
  const changed = listGearStatDeltas(gear, equipped).filter((entry) => entry.tone !== 'equal');
  const hasBetter = changed.some((entry) => entry.tone === 'better');
  const hasWorse = changed.some((entry) => entry.tone === 'worse');

  if (hasBetter && hasWorse) return 'mixed';
  if (hasBetter) return 'upgrade';
  if (hasWorse) return 'downgrade';
  return 'equal';
}

export function renderStatDeltaHtml(delta: GearStatDelta): string {
  return `<span class="stat-${delta.tone}">${delta.text}</span>`;
}

export function renderStatDeltaListHtml(deltas: GearStatDelta[]): string {
  if (deltas.length === 0) {
    return '<span class="stat-equal">Sem diferença</span>';
  }
  return deltas.map((delta) => renderStatDeltaHtml(delta)).join('');
}

export function compareGearWithEquipped(
  gear: GearDto,
  equipped: EquippedGearDto | null,
): GearStatComparison {
  const deltas = listGearStatDeltas(gear, equipped);
  const byKey = new Map(deltas.map((entry) => [entry.key, entry]));
  const fallback = (key: string, label: string): string => {
    const found = byKey.get(key);
    if (found) return renderStatDeltaHtml(found);
    return renderStatDeltaHtml({
      key,
      label,
      delta: 0,
      tone: 'equal',
      text: `${label} =`,
    });
  };

  return {
    attack: fallback('attack', 'ATK'),
    defense: fallback('defense', 'DEF'),
    health: fallback('health', 'HP'),
  };
}

export function renderInlineComparison(
  gear: GearDto,
  equipped: EquippedGearDto | null,
): string {
  const deltas = listGearStatDeltas(gear, equipped);

  return `
    <div class="gear-inline-comparison">
      ${deltas.map((delta) => `<span>${renderStatDeltaHtml(delta)}</span>`).join('')}
    </div>
  `;
}

const GRID_BADGE_LABEL: Record<Exclude<GridCompareBadgeKind, 'equal'>, string> = {
  upgrade: '▲',
  downgrade: '▼',
  mixed: '▲▼',
};

export function renderGridCompareBadge(
  gear: GearDto,
  equipped: EquippedGearDto | null,
): string {
  const kind = resolveGridCompareBadge(gear, equipped);
  if (kind === 'equal') return '';

  return `<span class="inventory-grid-badge inventory-grid-badge--${kind}" aria-hidden="true">${GRID_BADGE_LABEL[kind]}</span>`;
}

export function renderComparisonBlock(
  gear: GearDto,
  hero: HeroDto,
  equipped: EquippedGearDto | null,
): string {
  const deltas = listGearStatDeltas(gear, equipped);
  const slotLabel = GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot;
  const equippedLabel = equipped ? equipped.name : 'Nenhum';

  return `
    <div class="loot-comparison">
      <p class="loot-comparison-hero">Melhor para <strong>${hero.name}</strong> · ${slotLabel}</p>
      <p class="loot-comparison-equipped">Equipado: ${equippedLabel}</p>
      <div class="loot-comparison-stats">
        ${deltas.map((delta) => `<span>${renderStatDeltaHtml(delta)}</span>`).join('')}
      </div>
    </div>
  `;
}
