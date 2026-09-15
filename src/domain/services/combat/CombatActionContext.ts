import { CombatProfile } from '../../combat/CombatProfile';
import { ElementalPenetrationProfile } from '../../combat/ElementalPenetrationProfile';
import { ElementalDamageProfile } from '../../combat/ElementalDamageProfile';
import { ElementalDamageFlatProfile } from '../../combat/ElementalDamageFlatProfile';
import { Gear } from '../../entities/Gear';
import { ActiveGearSlot } from '../../gear/GearSlotCatalog';
import { DamageRollOptions } from './CombatDamageResolver';

export interface CombatActionContext {
  attackerProfile: CombatProfile;
  stageLevel: number;
  /** Mapa atual — aplica bias soft de resists nos inimigos. */
  mapId?: string;
  attackerEquipment?: Partial<Record<ActiveGearSlot, Gear | null>>;
  attackerElementalBonus?: ElementalDamageProfile;
  attackerElementalFlat?: ElementalDamageFlatProfile;
  attackerPhysicalDamagePercent?: number;
  attackerElementalPenetration?: ElementalPenetrationProfile;
  rng?: DamageRollOptions['rng'];
}
