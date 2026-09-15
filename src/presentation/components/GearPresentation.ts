import { GearDto, HeroDto } from '../../application/dto/GameStateDto';
import {
  getGearFrameSprite,
  getGearRaritySprite,
  getGearSlotSprite,
  getGearSprite,
  imgTag,
} from '../assets/AssetCatalog';
import { StatIconKey, statIconImg } from '../assets/StatIconCatalog';
import { canHeroEquipGear } from '../../application/mappers/GearRequirementPresentationMapper';
import { renderGearRequirementLines } from './GearRequirementPresentation';
import { gearDragAttr, gearDropTargetAttr } from '../gear/GearDragDropBinder';
import { gearRaritySurfaceClass } from './GearRarityPresentation';
import { GearDragSource } from '../gear/GearDragDropPolicy';
import { renderTooltipPreviewImage } from './TooltipPreviewPresentation';

export const GEAR_SLOTS = ['weapon', 'armor', 'accessory'] as const;
export type GearSlotKey = (typeof GEAR_SLOTS)[number];

export const GEAR_SLOT_LABELS: Record<GearSlotKey, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Acessório',
};

export const GEAR_RARITY_LABELS: Record<string, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  mythic: 'Mítico',
};

export interface EquippedGearDto {
  id: string;
  name: string;
  templateId: string;
  slot: string;
  rarity: string;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  attackSpeedBonus?: number;
  castSpeedBonus?: number;
  critChanceBonus?: number;
  critDamageBonus?: number;
  fireResistBonus?: number;
  coldResistBonus?: number;
  lightningResistBonus?: number;
  airResistBonus?: number;
  allElementalResistBonus?: number;
  fireDamageBonus?: number;
  fireResistPenetrationBonus?: number;
  coldDamageBonus?: number;
  lightningDamageBonus?: number;
  airDamageBonus?: number;
  allElementalDamageBonus?: number;
  fireDamageFlat?: number;
  coldDamageFlat?: number;
  lightningDamageFlat?: number;
  airDamageFlat?: number;
  fireResistFlat?: number;
  coldResistFlat?: number;
  lightningResistFlat?: number;
  airResistFlat?: number;
  attackPercentBonus?: number;
  defensePercentBonus?: number;
  healthPercentBonus?: number;
  physicalDamagePercentBonus?: number;
  cooldownReductionBonus?: number;
  dodgeChanceBonus?: number;
  blockChanceBonus?: number;
  damageReductionBonus?: number;
  uniqueEffectDescription?: string | null;
  requirements?: GearDto['requirements'];
}

function formatSigned(value: number, suffix: string, label: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${suffix} ${label}`;
}

/** Linha de bônus de gear com ícone contextual da estatística. */
export interface GearBonusEntry {
  icon: StatIconKey;
  text: string;
}

function elementalDamageBonusEntries(
  gear: Pick<
    GearDto,
    | 'fireDamageBonus'
    | 'fireResistPenetrationBonus'
    | 'coldDamageBonus'
    | 'lightningDamageBonus'
    | 'airDamageBonus'
    | 'allElementalDamageBonus'
    | 'fireDamageFlat'
    | 'coldDamageFlat'
    | 'lightningDamageFlat'
    | 'airDamageFlat'
  >,
): GearBonusEntry[] {
  const parts: GearBonusEntry[] = [];
  if (gear.fireDamageBonus !== 0) {
    parts.push({ icon: 'fire', text: formatSigned(gear.fireDamageBonus, '%', 'Dano Fogo') });
  }
  if (gear.fireResistPenetrationBonus !== 0) {
    parts.push({
      icon: 'fire',
      text: formatSigned(gear.fireResistPenetrationBonus, '%', 'Ignora Res. Fogo'),
    });
  }
  if (gear.coldDamageBonus !== 0) {
    parts.push({ icon: 'cold', text: formatSigned(gear.coldDamageBonus, '%', 'Dano Gelo') });
  }
  if (gear.lightningDamageBonus !== 0) {
    parts.push({
      icon: 'lightning',
      text: formatSigned(gear.lightningDamageBonus, '%', 'Dano Raio'),
    });
  }
  if (gear.airDamageBonus !== 0) {
    parts.push({ icon: 'air', text: formatSigned(gear.airDamageBonus, '%', 'Dano Ar') });
  }
  if (gear.allElementalDamageBonus !== 0) {
    parts.push({
      icon: 'elementalDamage',
      text: formatSigned(gear.allElementalDamageBonus, '%', 'Dano Elemental'),
    });
  }
  if (gear.fireDamageFlat !== 0) {
    parts.push({ icon: 'fire', text: formatSigned(gear.fireDamageFlat, '', 'Dano Fogo') });
  }
  if (gear.coldDamageFlat !== 0) {
    parts.push({ icon: 'cold', text: formatSigned(gear.coldDamageFlat, '', 'Dano Gelo') });
  }
  if (gear.lightningDamageFlat !== 0) {
    parts.push({ icon: 'lightning', text: formatSigned(gear.lightningDamageFlat, '', 'Dano Raio') });
  }
  if (gear.airDamageFlat !== 0) {
    parts.push({ icon: 'air', text: formatSigned(gear.airDamageFlat, '', 'Dano Ar') });
  }
  return parts;
}

function resistBonusEntries(
  gear: Pick<
    GearDto,
    | 'fireResistBonus'
    | 'coldResistBonus'
    | 'lightningResistBonus'
    | 'airResistBonus'
    | 'allElementalResistBonus'
    | 'fireResistFlat'
    | 'coldResistFlat'
    | 'lightningResistFlat'
    | 'airResistFlat'
  >,
): GearBonusEntry[] {
  const parts: GearBonusEntry[] = [];
  if (gear.fireResistBonus !== 0) {
    parts.push({ icon: 'fire', text: formatSigned(gear.fireResistBonus, '%', 'Res. Fogo') });
  }
  if (gear.coldResistBonus !== 0) {
    parts.push({ icon: 'cold', text: formatSigned(gear.coldResistBonus, '%', 'Res. Gelo') });
  }
  if (gear.lightningResistBonus !== 0) {
    parts.push({
      icon: 'lightning',
      text: formatSigned(gear.lightningResistBonus, '%', 'Res. Raio'),
    });
  }
  if (gear.airResistBonus !== 0) {
    parts.push({ icon: 'air', text: formatSigned(gear.airResistBonus, '%', 'Res. Ar') });
  }
  if (gear.allElementalResistBonus !== 0) {
    parts.push({
      icon: 'allElemental',
      text: formatSigned(gear.allElementalResistBonus, '%', 'Res. Elemental'),
    });
  }
  if (gear.fireResistFlat !== 0) {
    parts.push({ icon: 'fire', text: formatSigned(gear.fireResistFlat, '', 'Res. Fogo') });
  }
  if (gear.coldResistFlat !== 0) {
    parts.push({ icon: 'cold', text: formatSigned(gear.coldResistFlat, '', 'Res. Gelo') });
  }
  if (gear.lightningResistFlat !== 0) {
    parts.push({ icon: 'lightning', text: formatSigned(gear.lightningResistFlat, '', 'Res. Raio') });
  }
  if (gear.airResistFlat !== 0) {
    parts.push({ icon: 'air', text: formatSigned(gear.airResistFlat, '', 'Res. Ar') });
  }
  return parts;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function listGearBonusEntries(
  gear: Partial<GearDto> & Pick<GearDto, 'attackBonus' | 'defenseBonus' | 'healthBonus'>,
): GearBonusEntry[] {
  const stats = {
    attackPercentBonus: gear.attackPercentBonus ?? 0,
    defensePercentBonus: gear.defensePercentBonus ?? 0,
    healthPercentBonus: gear.healthPercentBonus ?? 0,
    physicalDamagePercentBonus: gear.physicalDamagePercentBonus ?? 0,
    attackSpeedBonus: gear.attackSpeedBonus ?? 0,
    castSpeedBonus: gear.castSpeedBonus ?? 0,
    cooldownReductionBonus: gear.cooldownReductionBonus ?? 0,
    critChanceBonus: gear.critChanceBonus ?? 0,
    critDamageBonus: gear.critDamageBonus ?? 0,
    fireResistBonus: gear.fireResistBonus ?? 0,
    coldResistBonus: gear.coldResistBonus ?? 0,
    lightningResistBonus: gear.lightningResistBonus ?? 0,
    airResistBonus: gear.airResistBonus ?? 0,
    allElementalResistBonus: gear.allElementalResistBonus ?? 0,
    fireResistFlat: gear.fireResistFlat ?? 0,
    coldResistFlat: gear.coldResistFlat ?? 0,
    lightningResistFlat: gear.lightningResistFlat ?? 0,
    airResistFlat: gear.airResistFlat ?? 0,
    fireDamageBonus: gear.fireDamageBonus ?? 0,
    fireResistPenetrationBonus: gear.fireResistPenetrationBonus ?? 0,
    coldDamageBonus: gear.coldDamageBonus ?? 0,
    lightningDamageBonus: gear.lightningDamageBonus ?? 0,
    airDamageBonus: gear.airDamageBonus ?? 0,
    allElementalDamageBonus: gear.allElementalDamageBonus ?? 0,
    fireDamageFlat: gear.fireDamageFlat ?? 0,
    coldDamageFlat: gear.coldDamageFlat ?? 0,
    lightningDamageFlat: gear.lightningDamageFlat ?? 0,
    airDamageFlat: gear.airDamageFlat ?? 0,
    dodgeChanceBonus: gear.dodgeChanceBonus ?? 0,
    blockChanceBonus: gear.blockChanceBonus ?? 0,
    damageReductionBonus: gear.damageReductionBonus ?? 0,
  };

  const parts: GearBonusEntry[] = [];

  if (gear.attackBonus !== 0) parts.push({ icon: 'attack', text: `+${gear.attackBonus} ATK` });
  if (gear.defenseBonus !== 0) parts.push({ icon: 'defense', text: `+${gear.defenseBonus} DEF` });
  if (gear.healthBonus !== 0) parts.push({ icon: 'health', text: `+${gear.healthBonus} HP` });

  if (stats.attackPercentBonus !== 0) {
    parts.push({ icon: 'attack', text: formatSigned(stats.attackPercentBonus, '%', 'ATK') });
  }
  if (stats.defensePercentBonus !== 0) {
    parts.push({ icon: 'defense', text: formatSigned(stats.defensePercentBonus, '%', 'DEF') });
  }
  if (stats.healthPercentBonus !== 0) {
    parts.push({ icon: 'health', text: formatSigned(stats.healthPercentBonus, '%', 'HP') });
  }
  if (stats.physicalDamagePercentBonus !== 0) {
    parts.push({
      icon: 'physicalDamage',
      text: formatSigned(stats.physicalDamagePercentBonus, '%', 'Dano Físico'),
    });
  }
  if (stats.attackSpeedBonus !== 0) {
    parts.push({ icon: 'attackSpeed', text: formatSigned(stats.attackSpeedBonus, '', 'ASPD') });
  }
  if (stats.castSpeedBonus !== 0) {
    parts.push({ icon: 'castSpeed', text: formatSigned(stats.castSpeedBonus, '', 'Cast') });
  }
  if (stats.cooldownReductionBonus !== 0) {
    parts.push({
      icon: 'cooldown',
      text: formatSigned(stats.cooldownReductionBonus, '%', 'Red. CD'),
    });
  }
  if (stats.critChanceBonus > 0) {
    parts.push({ icon: 'critChance', text: `+${formatPercent(stats.critChanceBonus)} Crít` });
  }
  if (stats.critDamageBonus > 0) {
    parts.push({ icon: 'critDamage', text: `+${formatPercent(stats.critDamageBonus)} Crít Dmg` });
  }
  if (stats.dodgeChanceBonus > 0) {
    parts.push({ icon: 'dodge', text: `+${formatPercent(stats.dodgeChanceBonus)} Esquiva` });
  }
  if (stats.blockChanceBonus > 0) {
    parts.push({ icon: 'block', text: `+${formatPercent(stats.blockChanceBonus)} Bloqueio` });
  }
  if (stats.damageReductionBonus > 0) {
    parts.push({
      icon: 'damageReduction',
      text: `+${formatPercent(stats.damageReductionBonus)} Red. Dano`,
    });
  }
  parts.push(...resistBonusEntries(stats));
  parts.push(...elementalDamageBonusEntries(stats));

  return parts;
}

export function listGearBonusLines(
  gear: Partial<GearDto> & Pick<GearDto, 'attackBonus' | 'defenseBonus' | 'healthBonus'>,
): string[] {
  return listGearBonusEntries(gear).map((entry) => entry.text);
}

export function renderUniqueEffectLine(gear: Pick<GearDto, 'uniqueEffectDescription'>): string {
  if (!gear.uniqueEffectDescription) return '';
  return `<span class="gear-unique-effect">✦ Efeito único: ${escapeHtml(gear.uniqueEffectDescription)}</span>`;
}

export function formatGearBonuses(
  gear: Partial<GearDto> & Pick<GearDto, 'attackBonus' | 'defenseBonus' | 'healthBonus'>,
): string {
  return listGearBonusLines(gear).join(' · ');
}

export function renderGearBonusLines(
  gear: Partial<GearDto> & Pick<GearDto, 'attackBonus' | 'defenseBonus' | 'healthBonus'>,
): string {
  const entries = listGearBonusEntries(gear);
  if (entries.length === 0) {
    return '<span class="gear-stat-lines"><span class="gear-stat-line gear-stat-line--empty">Sem bônus</span></span>';
  }

  const rendered = entries
    .map(
      (entry) =>
        `<span class="gear-stat-line">${statIconImg(entry.icon, 'gear-stat-icon')}<span class="gear-stat-line-text">${escapeHtml(entry.text)}</span></span>`,
    )
    .join('');

  return `<span class="gear-stat-lines">${rendered}</span>`;
}

export function renderEquipmentSlotTooltip(
  slot: GearSlotKey,
  gear: EquippedGearDto | null,
): string {
  const slotLabel = GEAR_SLOT_LABELS[slot];

  if (gear) {
    const rarityLabel = GEAR_RARITY_LABELS[gear.rarity] ?? gear.rarity;

    return `
      <span class="equipment-slot-tooltip" role="tooltip">
        ${renderTooltipPreviewImage(getGearSprite(gear), gear.name)}
        <strong class="equipment-slot-tooltip-name">${escapeHtml(gear.name)}</strong>
        <span class="equipment-slot-tooltip-meta">${slotLabel} · ${rarityLabel}</span>
        <span class="equipment-slot-tooltip-stats">${renderGearBonusLines(gear)}</span>
      </span>
    `;
  }

  return `
    <span class="equipment-slot-tooltip" role="tooltip">
      <strong class="equipment-slot-tooltip-name">${slotLabel}</strong>
      <span class="equipment-slot-tooltip-meta">Vazio</span>
      <span class="equipment-slot-tooltip-stats">Clique para equipar</span>
    </span>
  `;
}

export function getHeroEquipment(
  hero: HeroDto,
  slot: GearSlotKey,
): EquippedGearDto | null {
  const gear = hero.equipment[slot];
  return gear ?? null;
}

export function renderEquipmentSlot(
  slot: GearSlotKey,
  gear: EquippedGearDto | null,
  options: {
    heroId: string;
    clickable?: boolean;
    variant?: 'default' | 'loadout';
    dragDrop?: boolean;
    activeSlot?: GearSlotKey;
    equipPickerMode?: boolean;
  },
): string {
  const label = GEAR_SLOT_LABELS[slot];
  const variant = options.variant ?? 'default';
  const clickableClass = options.clickable === false ? '' : ' equipment-slot-clickable';
  const dragDrop = options.dragDrop !== false;
  const dropClass = dragDrop ? ' gear-drop-target' : '';
  const dropAttrs = dragDrop ? gearDropTargetAttr(options.heroId, slot) : '';
  const dragAttrs =
    dragDrop && gear
      ? gearDragAttr({
          kind: 'equipped',
          gearId: gear.id,
          heroId: options.heroId,
          slot,
        } satisfies GearDragSource)
      : '';
  const frameUrl = gear ? getGearFrameSprite(gear.rarity) : getGearFrameSprite('common');
  const iconClass =
    variant === 'loadout' ? 'loadout-slot-icon equipment-slot-icon' : 'equipment-slot-icon';
  const icon = gear
    ? imgTag(getGearSprite(gear), gear.name, iconClass)
    : imgTag(getGearSlotSprite(slot), label, `${iconClass} equipment-slot-empty`);

  const rarityClass =
    variant === 'loadout' ? 'loadout-slot-rarity equipment-slot-rarity' : 'equipment-slot-rarity';
  const rarityIcon = gear ? imgTag(getGearRaritySprite(gear.rarity), gear.rarity, rarityClass) : '';
  const isActiveSlot = options.equipPickerMode && options.activeSlot === slot;
  const activeClass = isActiveSlot ? ' loadout-slot--active' : '';
  const ariaLabel = gear
    ? isActiveSlot
      ? `Desequipar ${gear.name}`
      : `${gear.name} · ${label}`
    : `${label}: vazio — clique para equipar`;

  let slotAttrs = `data-hero="${options.heroId}" data-slot="${slot}"`;
  if (options.equipPickerMode) {
    if (isActiveSlot && gear) {
      slotAttrs = `data-unequip-hero="${options.heroId}" data-unequip-slot="${slot}"`;
    } else if (!isActiveSlot) {
      slotAttrs = `data-hero="${options.heroId}" data-slot="${slot}"`;
    }
  }

  if (variant === 'loadout') {
    return `
      <div
        role="button"
        tabindex="0"
        class="loadout-slot loadout-slot--gear equipment-slot equipment-slot--icon-only${clickableClass}${activeClass}${dropClass} ${gearRaritySurfaceClass(gear?.rarity)}"
        ${slotAttrs}
        ${dropAttrs}
        ${dragAttrs}
        aria-label="${escapeHtml(ariaLabel)}"
        style="--slot-frame: url('${frameUrl}')"
      >
        <span class="loadout-slot-icon-wrap">
          ${icon}
          ${rarityIcon}
        </span>
        ${renderEquipmentSlotTooltip(slot, gear)}
      </div>
    `;
  }

  return `
    <div
      role="button"
      tabindex="0"
      class="equipment-slot equipment-slot--icon-only${clickableClass}${dropClass} ${gearRaritySurfaceClass(gear?.rarity)}"
      ${slotAttrs}
      ${dropAttrs}
      ${dragAttrs}
      aria-label="${escapeHtml(ariaLabel)}"
      style="--slot-frame: url('${frameUrl}')"
    >
      <span class="equipment-slot-icon-wrap">
        ${icon}
        ${rarityIcon}
      </span>
      ${renderEquipmentSlotTooltip(slot, gear)}
    </div>
  `;
}

export function renderHeroEquipmentRow(hero: HeroDto): string {
  return `
    <div class="equipment-slots-row">
      ${GEAR_SLOTS.map((slot) =>
        renderEquipmentSlot(slot, getHeroEquipment(hero, slot), {
          heroId: hero.id,
        }),
      ).join('')}
    </div>
  `;
}

export function renderHeroEquipmentLoadout(
  hero: HeroDto,
  options: {
    activeSlot?: GearSlotKey;
    equipPickerMode?: boolean;
  } = {},
): string {
  return GEAR_SLOTS.map((slot) =>
    renderEquipmentSlot(slot, getHeroEquipment(hero, slot), {
      heroId: hero.id,
      variant: 'loadout',
      activeSlot: options.activeSlot,
      equipPickerMode: options.equipPickerMode,
    }),
  ).join('');
}

export function renderGearCard(
  gear: GearDto,
  options: {
    hero?: HeroDto;
    actionLabel?: string;
    actionClassName?: string;
    actionDataAttrs?: Record<string, string>;
    showAction?: boolean;
    upgradeBadge?: string;
    extraContent?: string;
  } = {},
): string {
  const frameUrl = getGearFrameSprite(gear.rarity);
  const actionLabel = options.actionLabel ?? 'Equipar';
  const actionClassName = options.actionClassName ?? 'gear-equip-btn';
  const canEquip = !options.hero || canHeroEquipGear(options.hero, gear);
  const showAction = options.showAction !== false && canEquip;
  const requirementSection = options.hero
    ? renderGearRequirementLines(options.hero, gear)
    : '';

  const dataAttrs = Object.entries(options.actionDataAttrs ?? { 'data-gear': gear.id })
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return `
    <div class="gear-item ${gearRaritySurfaceClass(gear.rarity)}" style="--gear-frame: url('${frameUrl}')">
      <div class="gear-item-main">
        <div class="gear-icon-wrap">
          ${imgTag(getGearSprite(gear), gear.slot, 'gear-slot-icon')}
          ${imgTag(getGearRaritySprite(gear.rarity), gear.rarity, 'gear-rarity-icon')}
        </div>
        <div class="gear-item-info">
          <div class="gear-item-title-row">
            <strong>${gear.name}</strong>
            ${options.upgradeBadge ?? ''}
          </div>
          <span class="gear-slot-tag">${GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot}</span>
          <span>${formatGearBonuses(gear)}</span>
          ${renderUniqueEffectLine(gear)}
          ${requirementSection}
          ${options.extraContent ?? ''}
        </div>
      </div>
      ${
        showAction
          ? `<button type="button" class="${actionClassName}" ${dataAttrs}>${actionLabel}</button>`
          : ''
      }
    </div>
  `;
}

export function renderEquippedGearCard(
  gear: EquippedGearDto,
  options: { heroId: string; slot: GearSlotKey },
): string {
  return renderGearCard(
    {
      id: gear.id,
      name: gear.name,
      templateId: gear.templateId,
      slot: gear.slot,
      rarity: gear.rarity,
      attackBonus: gear.attackBonus,
      defenseBonus: gear.defenseBonus,
      healthBonus: gear.healthBonus,
      attackSpeedBonus: gear.attackSpeedBonus ?? 0,
      castSpeedBonus: gear.castSpeedBonus ?? 0,
      critChanceBonus: gear.critChanceBonus ?? 0,
      critDamageBonus: gear.critDamageBonus ?? 0,
      fireResistBonus: gear.fireResistBonus ?? 0,
      coldResistBonus: gear.coldResistBonus ?? 0,
      lightningResistBonus: gear.lightningResistBonus ?? 0,
      airResistBonus: gear.airResistBonus ?? 0,
      allElementalResistBonus: gear.allElementalResistBonus ?? 0,
      fireDamageBonus: gear.fireDamageBonus ?? 0,
      fireResistPenetrationBonus: gear.fireResistPenetrationBonus ?? 0,
      coldDamageBonus: gear.coldDamageBonus ?? 0,
      lightningDamageBonus: gear.lightningDamageBonus ?? 0,
      airDamageBonus: gear.airDamageBonus ?? 0,
      allElementalDamageBonus: gear.allElementalDamageBonus ?? 0,
      fireDamageFlat: gear.fireDamageFlat ?? 0,
      coldDamageFlat: gear.coldDamageFlat ?? 0,
      lightningDamageFlat: gear.lightningDamageFlat ?? 0,
      airDamageFlat: gear.airDamageFlat ?? 0,
      fireResistFlat: gear.fireResistFlat ?? 0,
      coldResistFlat: gear.coldResistFlat ?? 0,
      lightningResistFlat: gear.lightningResistFlat ?? 0,
      airResistFlat: gear.airResistFlat ?? 0,
      attackPercentBonus: gear.attackPercentBonus ?? 0,
      defensePercentBonus: gear.defensePercentBonus ?? 0,
      healthPercentBonus: gear.healthPercentBonus ?? 0,
      physicalDamagePercentBonus: gear.physicalDamagePercentBonus ?? 0,
      cooldownReductionBonus: gear.cooldownReductionBonus ?? 0,
      dodgeChanceBonus: gear.dodgeChanceBonus ?? 0,
      blockChanceBonus: gear.blockChanceBonus ?? 0,
      damageReductionBonus: gear.damageReductionBonus ?? 0,
      uniqueEffectDescription: gear.uniqueEffectDescription,
      requirements: gear.requirements ?? { minLevel: 1 },
    },
    {
      actionLabel: 'Desequipar',
      actionClassName: 'gear-unequip-btn',
      actionDataAttrs: {
        'data-unequip-hero': options.heroId,
        'data-unequip-slot': options.slot,
      },
    },
  );
}
