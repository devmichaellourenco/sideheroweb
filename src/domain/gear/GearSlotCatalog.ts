/** Slots canônicos do equipamento (modelo completo de 10 posições). */
export type GearSlotId =
  | 'hand'
  | 'off_hand'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'amulet'
  | 'left_ring'
  | 'right_ring'
  | 'bracer';

/**
 * IDs usados no jogo hoje (UI, loot, equip).
 * Mapeiam para slots canônicos via `CANONICAL_GEAR_SLOT`.
 */
export type ActiveGearSlot = 'weapon' | 'armor' | 'accessory';

export const ACTIVE_GEAR_SLOTS: ActiveGearSlot[] = ['weapon', 'armor', 'accessory'];

export const CANONICAL_GEAR_SLOT: Record<ActiveGearSlot, GearSlotId> = {
  weapon: 'hand',
  armor: 'armor',
  accessory: 'amulet',
};

export type GearUiLayer = 'weapon' | 'armor' | 'accessory';

export interface GearSlotDefinition {
  id: GearSlotId;
  label: string;
  enabled: boolean;
  activeAlias: ActiveGearSlot | null;
  uiLayer: GearUiLayer;
}

export const GEAR_SLOT_CATALOG: GearSlotDefinition[] = [
  { id: 'hand', label: 'Mão principal', enabled: true, activeAlias: 'weapon', uiLayer: 'weapon' },
  { id: 'off_hand', label: 'Mão secundária', enabled: false, activeAlias: null, uiLayer: 'weapon' },
  { id: 'helmet', label: 'Elmo', enabled: false, activeAlias: null, uiLayer: 'armor' },
  { id: 'armor', label: 'Armadura', enabled: true, activeAlias: 'armor', uiLayer: 'armor' },
  { id: 'gloves', label: 'Luvas', enabled: false, activeAlias: null, uiLayer: 'armor' },
  { id: 'boots', label: 'Botas', enabled: false, activeAlias: null, uiLayer: 'armor' },
  { id: 'amulet', label: 'Amuleto', enabled: true, activeAlias: 'accessory', uiLayer: 'accessory' },
  { id: 'left_ring', label: 'Anel esquerdo', enabled: false, activeAlias: null, uiLayer: 'accessory' },
  { id: 'right_ring', label: 'Anel direito', enabled: false, activeAlias: null, uiLayer: 'accessory' },
  { id: 'bracer', label: 'Bracelete', enabled: false, activeAlias: null, uiLayer: 'accessory' },
];

export function getGearSlotDefinition(id: GearSlotId): GearSlotDefinition | undefined {
  return GEAR_SLOT_CATALOG.find((entry) => entry.id === id);
}

export function getActiveSlotDefinition(active: ActiveGearSlot): GearSlotDefinition {
  const canonical = CANONICAL_GEAR_SLOT[active];
  return getGearSlotDefinition(canonical)!;
}
