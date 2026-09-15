import { Gear } from './Gear';
import { ChestType } from '../combat/ChestType';

export interface ChestProps {
  id: string;
  stageEarned: number;
  chestType: ChestType;
  opened: boolean;
  loot: Gear | null;
  /** Loot já definido na concessão; só é revelado e entregue ao abrir. */
  guaranteedLoot?: Gear | null;
}

export class Chest {
  readonly id: string;
  readonly stageEarned: number;
  readonly chestType: ChestType;
  readonly opened: boolean;
  readonly loot: Gear | null;
  readonly guaranteedLoot: Gear | null;

  private constructor(props: ChestProps) {
    this.id = props.id;
    this.stageEarned = props.stageEarned;
    this.chestType = props.chestType;
    this.opened = props.opened;
    this.loot = props.loot;
    this.guaranteedLoot = props.guaranteedLoot ?? null;
  }

  static create(stageEarned: number, chestType: ChestType = 'monster'): Chest {
    return new Chest({
      id: `chest-${chestType}-${stageEarned}-${Date.now()}`,
      stageEarned,
      chestType,
      opened: false,
      loot: null,
      guaranteedLoot: null,
    });
  }

  static createWithGuaranteedLoot(
    stageEarned: number,
    chestType: ChestType,
    guaranteedLoot: Gear,
  ): Chest {
    return new Chest({
      id: `chest-${chestType}-${stageEarned}-${guaranteedLoot.id}`,
      stageEarned,
      chestType,
      opened: false,
      loot: null,
      guaranteedLoot,
    });
  }

  static restore(props: ChestProps): Chest {
    return new Chest({
      ...props,
      chestType: props.chestType ?? 'monster',
      guaranteedLoot: props.guaranteedLoot ?? null,
    });
  }

  open(loot: Gear): Chest {
    return new Chest({
      id: this.id,
      stageEarned: this.stageEarned,
      chestType: this.chestType,
      opened: true,
      loot,
      guaranteedLoot: null,
    });
  }

  toProps(): ChestProps {
    return {
      id: this.id,
      stageEarned: this.stageEarned,
      chestType: this.chestType,
      opened: this.opened,
      loot: this.loot,
      guaranteedLoot: this.guaranteedLoot,
    };
  }
}
