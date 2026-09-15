import { GameStateDto, GearDto, HeroDto } from '../../application/dto/GameStateDto';
import {
  getGearFrameSprite,
  getGearRaritySprite,
  getGearSprite,
  getHeroSprite,
  imgTag,
} from '../assets/AssetCatalog';
import {
  GearUpgradeStatus,
  getGearUpgradeInfoForActiveParty,
  getGearUpgradeInfoForHero,
  listGearStatDeltas,
  renderGridCompareBadge,
  renderStatDeltaHtml,
} from './GearComparison';
import {
  renderGearBonusLines,
  GEAR_RARITY_LABELS,
  GEAR_SLOT_LABELS,
  GearSlotKey,
  getHeroEquipment,
} from './GearPresentation';
import { gearRaritySurfaceClass } from './GearRarityPresentation';
import {
  canHeroEquipGear,
  renderGearRequirementLines,
} from './GearRequirementPresentation';
import { gearDragAttr } from '../gear/GearDragDropBinder';
import { renderTooltipPreviewImage } from './TooltipPreviewPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolveDefaultInventoryHeroId(state: GameStateDto): string {
  const partyHero = state.activeParty.find((hero) =>
    state.activePartyIds.includes(hero.id),
  );
  return partyHero?.id ?? state.heroes[0]?.id ?? '';
}

export function renderInventoryHeroSelector(
  state: GameStateDto,
  selectedHeroId: string,
  options: { label?: string } = {},
): string {
  const heroes = [...state.activeParty, ...state.benchHeroes].filter(
    (hero, index, list) => list.findIndex((entry) => entry.id === hero.id) === index,
  );

  if (heroes.length === 0) {
    return '<p class="inventory-hero-empty">Nenhum herói disponível.</p>';
  }

  const label = options.label ?? 'Equipar em';
  const chips = heroes
    .map((hero) => {
      const active = hero.id === selectedHeroId;
      const inParty = state.activePartyIds.includes(hero.id);

      return `
        <button
          type="button"
          class="inventory-hero-chip${active ? ' inventory-hero-chip--active' : ''}"
          data-inventory-hero="${hero.id}"
          title="${escapeHtml(hero.name)} · Lv.${hero.level}"
          aria-pressed="${active ? 'true' : 'false'}"
        >
          ${imgTag(getHeroSprite(hero), hero.name, 'inventory-hero-chip-icon')}
          <span class="inventory-hero-chip-name">${escapeHtml(hero.name)}</span>
          ${inParty ? '<span class="inventory-hero-chip-party" aria-hidden="true">★</span>' : ''}
        </button>
      `;
    })
    .join('');

  return `
    <div class="inventory-hero-select">
      <span class="inventory-hero-select-label">${escapeHtml(label)}</span>
      <div class="inventory-hero-chips">${chips}</div>
    </div>
  `;
}

export type InventoryGridEquipMode = 'inventory' | 'pick';

export function renderInventoryGridSlot(
  gear: GearDto,
  options: {
    hero: HeroDto;
    upgradeStatus: GearUpgradeStatus;
    returnedToInventory?: boolean;
    equipMode?: InventoryGridEquipMode;
  },
): string {
  const frameUrl = getGearFrameSprite(gear.rarity);
  const slotLabel = GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot;
  const rarityLabel = GEAR_RARITY_LABELS[gear.rarity] ?? gear.rarity;
  const equipped = getHeroEquipment(options.hero, gear.slot as GearSlotKey);
  const deltas = listGearStatDeltas(gear, equipped);
  const canEquip = canHeroEquipGear(options.hero, gear);
  const requirementLines = renderGearRequirementLines(options.hero, gear);
  const equipMode = options.equipMode ?? 'inventory';
  const pickAttrs =
    equipMode === 'pick' && canEquip
      ? `data-pick-gear="${escapeHtml(gear.id)}" data-pick-hero="${escapeHtml(options.hero.id)}"`
      : '';
  const inventoryAttrs =
    equipMode === 'inventory'
      ? `data-inventory-gear-id="${escapeHtml(gear.id)}" data-inventory-equip-hero="${escapeHtml(options.hero.id)}" data-can-equip="${canEquip ? 'true' : 'false'}"`
      : equipMode === 'pick' && canEquip
        ? `data-can-equip="true"`
        : `data-can-equip="false"`;
  const returnedClass = options.returnedToInventory ? ' inventory-grid-slot--returned' : '';
  const returnedBadge = options.returnedToInventory
    ? '<span class="inventory-grid-returned-badge" aria-hidden="true">↩</span>'
    : '';
  // Drag em qualquer item do inventário (equipar/baú/destruir via drop); no picker só se equipável.
  const dragAttrs =
    equipMode === 'inventory'
      ? gearDragAttr({ kind: 'inventory', gearId: gear.id, slot: gear.slot as GearSlotKey })
      : equipMode === 'pick' && canEquip
        ? gearDragAttr({ kind: 'inventory', gearId: gear.id, slot: gear.slot as GearSlotKey })
        : '';

  return `
    <div
      role="button"
      tabindex="0"
      class="inventory-grid-slot inventory-grid-slot--${options.upgradeStatus}${canEquip ? '' : ' inventory-grid-slot--locked'}${returnedClass} ${gearRaritySurfaceClass(gear.rarity)}"
      ${inventoryAttrs}
      ${pickAttrs}
      ${dragAttrs}
      aria-label="${escapeHtml(gear.name)} · ${slotLabel} · ${rarityLabel}"
      style="--gear-frame: url('${frameUrl}')"
    >
      <span class="inventory-grid-slot-icon-wrap">
        ${imgTag(getGearSprite(gear), slotLabel, 'inventory-grid-slot-icon')}
        ${imgTag(getGearRaritySprite(gear.rarity), rarityLabel, 'inventory-grid-slot-rarity')}
      </span>
      ${renderGridCompareBadge(gear, equipped)}
      ${returnedBadge}
      <span class="inventory-gear-tooltip-content hidden">
        ${renderTooltipPreviewImage(getGearSprite(gear), gear.name)}
        <strong class="inventory-gear-tooltip-name">${escapeHtml(gear.name)}</strong>
        <span class="inventory-gear-tooltip-meta">${slotLabel} · ${rarityLabel} · Lv.${gear.requirements.minLevel}</span>
        <span class="inventory-gear-tooltip-equipped">${
          equipped
            ? `Vs. equipado: ${escapeHtml(equipped.name)}`
            : 'Slot vazio — bônus do item'
        }</span>
        <span class="inventory-gear-tooltip-stats">${renderGearBonusLines(gear)}</span>
        ${requirementLines}
        <span class="inventory-gear-tooltip-hero">Comparado com ${escapeHtml(options.hero.name)}</span>
        <span class="inventory-gear-tooltip-delta">
          ${deltas.map((delta) => `<span>${renderStatDeltaHtml(delta)}</span>`).join('')}
        </span>
      </span>
    </div>
  `;
}

export function renderInventoryGrid(
  state: GameStateDto,
  gears: GearDto[],
  selectedHeroId: string,
  options: {
    returnedGearIds?: string[];
    equipMode?: InventoryGridEquipMode;
    upgradeForHeroId?: string;
  } = {},
): string {
  const hero = state.heroes.find((entry) => entry.id === selectedHeroId);
  if (!hero) {
    return '<p class="empty-state modal-empty">Selecione um herói.</p>';
  }

  if (gears.length === 0) {
    return '<p class="empty-state modal-empty">Nenhum item nesta categoria.</p>';
  }

  const returnedSet = new Set(options.returnedGearIds ?? []);
  const equipMode = options.equipMode ?? 'inventory';
  const upgradeHeroId = options.upgradeForHeroId ?? selectedHeroId;

  return `
    <div class="inventory-grid" data-inventory-grid data-drop-zone="inventory">
      ${gears
        .map((gear) =>
          renderInventoryGridSlot(gear, {
            hero,
            upgradeStatus: options.upgradeForHeroId
              ? getGearUpgradeInfoForHero(state, gear, upgradeHeroId).status
              : getGearUpgradeInfoForActiveParty(state, gear).status,
            returnedToInventory: returnedSet.has(gear.id),
            equipMode,
          }),
        )
        .join('')}
    </div>
  `;
}
