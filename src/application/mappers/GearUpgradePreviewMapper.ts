import { GameState } from '../../domain/entities/GameState';
import { Gear } from '../../domain/entities/Gear';
import { LoadoutOptimizer } from '../../domain/services/LoadoutOptimizer';
import { GearUpgradeHintDto } from '../dto/GearUpgradeHintDto';
import { mapGearToDto } from './GearDtoMapper';

function mapEquipped(gear: Gear | null): GearUpgradeHintDto['equipped'] {
  if (!gear) return null;

  const dto = mapGearToDto(gear);
  return {
    id: dto.id,
    name: dto.name,
    slot: dto.slot,
    rarity: dto.rarity,
    attackBonus: dto.attackBonus,
    defenseBonus: dto.defenseBonus,
    healthBonus: dto.healthBonus,
  };
}

export function buildInventoryUpgradeHints(
  state: GameState,
  optimizer = new LoadoutOptimizer(),
): Record<string, GearUpgradeHintDto> {
  const previews = optimizer.buildInventoryUpgradePreviews(state);
  const hints: Record<string, GearUpgradeHintDto> = {};

  for (const [gearId, preview] of Object.entries(previews)) {
    hints[gearId] = {
      status: preview.status,
      gain: preview.gain,
      heroId: preview.heroId,
      heroName: preview.heroName,
      equipped: mapEquipped(preview.equipped),
    };
  }

  return hints;
}
