import { EquipPickerMode } from '../components/EquipPickerModalRenderer';
import { HeroDetailTab } from '../components/HeroDetailModalRenderer';

export type ModalView =
  | { type: 'inventory' }
  | { type: 'stash' }
  | { type: 'hero-detail'; heroId: string; tab?: HeroDetailTab }
  | { type: 'equip-picker'; mode: EquipPickerMode }
  | { type: 'loot-reveal'; gearId: string }
  | { type: 'loot-batch'; gearIds: string[] }
  | { type: 'settings' }
  | { type: 'shop' }
  | { type: 'upgrades' }
  | { type: 'meta-legacy' }
  | { type: 'achievements' }
  | { type: 'divine-forge' }
  | { type: 'formation' }
  | { type: 'heroes' };
