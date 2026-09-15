import { GameStateDto } from '../../application/dto/GameStateDto';
import { GEAR_SLOTS, GearSlotKey } from './GearPresentation';

export interface InventoryEquipFeedback {
  newSlots: Partial<Record<GearSlotKey, string>>;
  returnedGearIds: string[];
  clearedSlots: GearSlotKey[];
}

export function computeInventoryEquipFeedback(
  previous: GameStateDto | null | undefined,
  current: GameStateDto,
  heroId: string,
): InventoryEquipFeedback | null {
  if (!previous) return null;

  const prevHero = previous.heroes.find((hero) => hero.id === heroId);
  const currHero = current.heroes.find((hero) => hero.id === heroId);
  if (!prevHero || !currHero) return null;

  const feedback: InventoryEquipFeedback = {
    newSlots: {},
    returnedGearIds: [],
    clearedSlots: [],
  };

  for (const slot of GEAR_SLOTS) {
    const prevGear = prevHero.equipment[slot];
    const currGear = currHero.equipment[slot];
    const prevId = prevGear?.id ?? null;
    const currId = currGear?.id ?? null;

    if (prevId === currId) continue;

    if (currId) {
      feedback.newSlots[slot] = currId;
    } else if (prevId) {
      feedback.clearedSlots.push(slot);
    }

    if (prevId && prevId !== currId && current.inventory.some((gear) => gear.id === prevId)) {
      if (!feedback.returnedGearIds.includes(prevId)) {
        feedback.returnedGearIds.push(prevId);
      }
    }
  }

  if (
    Object.keys(feedback.newSlots).length === 0 &&
    feedback.returnedGearIds.length === 0 &&
    feedback.clearedSlots.length === 0
  ) {
    return null;
  }

  return feedback;
}
