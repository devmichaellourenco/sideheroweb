import { MetaFeatureKey } from './MetaUpgradeDefinition';

export type MetaUpgradeLevels = Partial<Record<MetaFeatureKey, number>>;

export interface MetaProgressProps {
  sigils: number;
  upgradeLevels: MetaUpgradeLevels;
  seasonsCompleted: number;
  totalSigilsEarned: number;
}

export class MetaProgress {
  readonly sigils: number;
  readonly upgradeLevels: MetaUpgradeLevels;
  readonly seasonsCompleted: number;
  readonly totalSigilsEarned: number;

  private constructor(props: MetaProgressProps) {
    this.sigils = Math.max(0, props.sigils);
    this.upgradeLevels = { ...props.upgradeLevels };
    this.seasonsCompleted = Math.max(0, props.seasonsCompleted);
    this.totalSigilsEarned = Math.max(0, props.totalSigilsEarned);
  }

  static initial(): MetaProgress {
    return new MetaProgress({
      sigils: 0,
      upgradeLevels: {},
      seasonsCompleted: 0,
      totalSigilsEarned: 0,
    });
  }

  static restore(props: Partial<MetaProgressProps> | null | undefined): MetaProgress {
    if (!props) return MetaProgress.initial();

    return new MetaProgress({
      sigils: typeof props.sigils === 'number' ? props.sigils : 0,
      upgradeLevels:
        props.upgradeLevels && typeof props.upgradeLevels === 'object'
          ? { ...props.upgradeLevels }
          : {},
      seasonsCompleted: typeof props.seasonsCompleted === 'number' ? props.seasonsCompleted : 0,
      totalSigilsEarned:
        typeof props.totalSigilsEarned === 'number' ? props.totalSigilsEarned : 0,
    });
  }

  toProps(): MetaProgressProps {
    return {
      sigils: this.sigils,
      upgradeLevels: { ...this.upgradeLevels },
      seasonsCompleted: this.seasonsCompleted,
      totalSigilsEarned: this.totalSigilsEarned,
    };
  }

  withSigils(sigils: number): MetaProgress {
    return this.clone({ sigils });
  }

  withUpgradeLevels(upgradeLevels: MetaUpgradeLevels): MetaProgress {
    return this.clone({ upgradeLevels: { ...upgradeLevels } });
  }

  withSeasonsCompleted(seasonsCompleted: number): MetaProgress {
    return this.clone({ seasonsCompleted });
  }

  withTotalSigilsEarned(totalSigilsEarned: number): MetaProgress {
    return this.clone({ totalSigilsEarned });
  }

  private clone(partial: Partial<MetaProgressProps>): MetaProgress {
    return MetaProgress.restore({ ...this.toProps(), ...partial });
  }
}
