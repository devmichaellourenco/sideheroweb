/**
 * Loadout de heróis do simulador headless — gear equipado, pontos de aprimoramento
 * gastos e skills no loadout de batalha.
 *
 * Sem isto o sim roda com heróis "pelados" (sem gear, sem atributos alocados e só
 * com ataque básico) e subestima o poder real do jogador, o que torna o win rate
 * inútil como oráculo de balanceamento.
 *
 * As regras não são reimplementadas aqui: alocação usa `SkillService` e o gate de
 * equipamento usa `canHeroEquip`, então o build do sim nunca diverge do jogo.
 */
import { Hero } from '../entities/Hero';
import { GEAR_RARITIES, GearRarity } from '../entities/Gear';
import type { HeroClass } from '../entities/HeroClass';
import { ACTIVE_GEAR_SLOTS } from '../gear/GearSlotCatalog';
import { createGearFromCatalogItem, listLootCatalogItems } from '../gear/GearItemCatalog';
import { AttributeKey } from '../progression/Attributes';
import { getBaseAttributes } from '../progression/BaseAttributes';
import { SKILL_CATALOG } from '../progression/SkillCatalog';
import type { SkillDefinition } from '../progression/SkillDefinition';
import { SkillService } from '../progression/SkillService';
import { MAX_ACTIVE_BATTLE_SKILLS } from '../progression/SkillBattleSlots';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';
import { canHeroEquip } from '../services/GearEquipService';

/** Kit equipado no herói simulado. `none` mantém o herói pelado. */
export type SimGearRarity = GearRarity | 'none';

export interface SimHeroLoadoutSpec {
  /** Raridade do kit (weapon/armor/accessory). Cai para a raridade abaixo se os requisitos não forem atendidos. */
  gearRarity?: SimGearRarity;
  /** Itens específicos do catálogo — têm prioridade sobre `gearRarity`. */
  gearItemIds?: readonly string[];
  /** Pontos de aprimoramento gastos. `'auto'` usa `level - 1` (1 ponto por level-up). */
  improvementPoints?: number | 'auto';
  /** Fração dos pontos investida em atributos; o resto vai para ranks de skill. */
  attributeRatio?: number;
  /** Slots de batalha desbloqueados (1 = só ataque básico). */
  battleSkillSlots?: number;
  /** Skills preferidas, em ordem de prioridade. */
  preferredSkillIds?: readonly string[];
}

const DEFAULT_ATTRIBUTE_RATIO = 0.5;
const ATTRIBUTE_TIEBREAK: AttributeKey[] = ['str', 'dex', 'int'];

/**
 * Prioridade derivada dos atributos-base da classe — evita uma tabela paralela
 * que sairia de sincronia quando o design da classe mudar.
 */
function attributePriority(heroClass: HeroClass): AttributeKey[] {
  const base = getBaseAttributes(heroClass);
  return [...ATTRIBUTE_TIEBREAK].sort((a, b) => {
    const delta = base[b] - base[a];
    return delta !== 0 ? delta : ATTRIBUTE_TIEBREAK.indexOf(a) - ATTRIBUTE_TIEBREAK.indexOf(b);
  });
}

/** 2 de cada 3 pontos no atributo primário da classe, 1 no secundário. */
const ATTRIBUTE_SPEND_PATTERN = [0, 0, 1];

function allocateAttributes(hero: Hero, points: number): Hero {
  const priority = attributePriority(hero.heroClass);
  let current = hero;

  for (let spent = 0; spent < points; spent += 1) {
    const key = priority[ATTRIBUTE_SPEND_PATTERN[spent % ATTRIBUTE_SPEND_PATTERN.length]];
    current = current.spendImprovementPointOnAttribute(key);
  }

  return current;
}

/**
 * Ordem de investimento: ofensivas da classe primeiro (maior impacto em win rate),
 * depois defensivas da classe e por fim as universais.
 */
function skillAllocationOrder(
  heroClass: HeroClass,
  preferredSkillIds: readonly string[],
): SkillDefinition[] {
  const candidates = SKILL_CATALOG.filter(
    (skill) =>
      skill.id !== BASIC_ATTACK_SKILL_ID &&
      skill.pointType === 'improvement' &&
      (skill.scope === 'universal' ||
        (skill.scope === 'class' && skill.heroClass === heroClass)),
  );

  const weight = (skill: SkillDefinition): number => {
    const preferred = preferredSkillIds.indexOf(skill.id);
    if (preferred >= 0) return preferred;
    const classBonus = skill.scope === 'class' ? 0 : 100;
    const branchBonus = skill.branch === 'offense' ? 0 : skill.branch === 'defense' ? 10 : 20;
    return 1_000 + classBonus + branchBonus;
  };

  return candidates.sort((a, b) => weight(a) - weight(b));
}

function allocateSkills(
  hero: Hero,
  service: SkillService,
  points: number,
  preferredSkillIds: readonly string[],
  battleSkillSlots: number,
): Hero {
  const order = skillAllocationOrder(hero.heroClass, preferredSkillIds);
  let current = hero;
  let remaining = points;

  // Vários passes: subir um rank pode destravar o requisito de outra skill.
  while (remaining > 0) {
    const allocatable = order.find((skill) =>
      service.canAllocate(current, skill.id, battleSkillSlots),
    );
    if (!allocatable) break;
    current = service.allocate(current, allocatable.id, battleSkillSlots);
    remaining -= 1;
  }

  return current;
}

function equipBattleSkills(hero: Hero, service: SkillService, slots: number): Hero {
  const unlocked = Math.max(1, Math.min(MAX_ACTIVE_BATTLE_SKILLS, slots));
  const ranks = hero.toProps().skillRanks;
  const equippable = skillAllocationOrder(hero.heroClass, [])
    .filter((skill) => (ranks[skill.id] ?? 0) > 0)
    .map((skill) => skill.id);

  let current = hero;
  for (let slotIndex = 1; slotIndex < unlocked; slotIndex += 1) {
    const skillId = equippable[slotIndex - 1];
    if (!skillId) break;
    if (!service.canAssignSkillToSlot(current, skillId, slotIndex, unlocked)) continue;
    current = service.assignSkillToSlot(current, skillId, slotIndex, unlocked);
  }

  return current;
}

/** Primeiro item da raridade pedida que o herói consegue equipar, descendo a escada se preciso. */
function pickEquippableGearId(
  hero: Hero,
  slot: (typeof ACTIVE_GEAR_SLOTS)[number],
  rarity: GearRarity,
  tier: number,
): string | null {
  for (let index = GEAR_RARITIES.indexOf(rarity); index >= 0; index -= 1) {
    const candidates = listLootCatalogItems(slot, GEAR_RARITIES[index], tier);
    for (const candidate of candidates) {
      if (canHeroEquip(hero, createGearFromCatalogItem(candidate.id, `sim-${candidate.id}`))) {
        return candidate.id;
      }
    }
  }
  return null;
}

function equipGear(
  hero: Hero,
  spec: SimHeroLoadoutSpec,
  tier: number,
): Hero {
  const rarity = spec.gearRarity ?? 'none';
  if (rarity === 'none' && !spec.gearItemIds?.length) return hero;

  let current = hero;

  for (const catalogItemId of spec.gearItemIds ?? []) {
    const gear = createGearFromCatalogItem(catalogItemId, `sim-${hero.id}-${catalogItemId}`);
    if (canHeroEquip(current, gear)) current = current.equip(gear);
  }

  if (rarity === 'none') return current;

  for (const slot of ACTIVE_GEAR_SLOTS) {
    if (current.toProps().equipment?.[slot]) continue;
    const catalogItemId = pickEquippableGearId(current, slot, rarity, tier);
    if (!catalogItemId) continue;
    current = current.equip(
      createGearFromCatalogItem(catalogItemId, `sim-${hero.id}-${slot}`),
    );
  }

  return current;
}

/**
 * Aplica o build completo. A ordem importa: atributos primeiro (destravam requisitos
 * de skill e de gear), depois skills, e o gear por último já com os atributos válidos.
 */
export function applySimHeroLoadout(
  hero: Hero,
  spec: SimHeroLoadoutSpec,
  tier: number,
): Hero {
  const totalPoints =
    spec.improvementPoints === 'auto'
      ? Math.max(0, hero.level - 1)
      : Math.max(0, Math.floor(spec.improvementPoints ?? 0));

  let current = hero;

  if (totalPoints > 0) {
    const ratio = Math.min(1, Math.max(0, spec.attributeRatio ?? DEFAULT_ATTRIBUTE_RATIO));
    const attributePoints = Math.round(totalPoints * ratio);
    const service = new SkillService();

    current = Hero.restore({ ...current.toProps(), unspentImprovementPoints: totalPoints });
    current = allocateAttributes(current, attributePoints);
    const battleSkillSlots = spec.battleSkillSlots ?? 1;
    current = allocateSkills(
      current,
      service,
      totalPoints - attributePoints,
      spec.preferredSkillIds ?? [],
      battleSkillSlots,
    );
    current = equipBattleSkills(current, service, battleSkillSlots);
  }

  return equipGear(current, spec, tier).healFull();
}
