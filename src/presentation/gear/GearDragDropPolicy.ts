import { GearSlotKey } from '../components/GearPresentation';

export type GearDragSource =
  | { kind: 'inventory'; gearId: string; slot: GearSlotKey }
  | { kind: 'equipped'; gearId: string; heroId: string; slot: GearSlotKey }
  | { kind: 'stash'; gearId: string; slot: GearSlotKey }
  | { kind: 'shop'; offerId: string; slot: GearSlotKey };

export type GearDropTarget =
  | { kind: 'slot'; heroId: string; slot: GearSlotKey }
  | { kind: 'inventory' }
  | { kind: 'stash' };

export function canDropGearOnSlot(gearSlot: GearSlotKey, targetSlot: GearSlotKey): boolean {
  return gearSlot === targetSlot;
}

export function parseGearDragSource(raw: string | null): GearDragSource | null {
  if (!raw) return null;
  try {
    const json = raw.startsWith('%7B') || raw.includes('%22') ? decodeURIComponent(raw) : raw;
    const parsed = JSON.parse(json) as GearDragSource;
    if (!parsed?.kind || !parsed.slot) return null;
    if (parsed.kind === 'shop') {
      return parsed.offerId ? parsed : null;
    }
    if (!('gearId' in parsed) || !parsed.gearId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serializeGearDragSource(source: GearDragSource): string {
  return JSON.stringify(source);
}
