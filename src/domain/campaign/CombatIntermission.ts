export type CombatIntermissionVariant = 'wave-clear' | 'boss-approach' | 'phase-clear' | 'defeat';

export interface CombatIntermissionProps {
  variant: CombatIntermissionVariant;
  clearedPhaseId: string;
  clearedPhaseName: string;
  nextPhaseId?: string | null;
  nextPhaseName?: string | null;
}

export class CombatIntermission {
  readonly variant: CombatIntermissionVariant;
  readonly clearedPhaseId: string;
  readonly clearedPhaseName: string;
  readonly nextPhaseId: string | null;
  readonly nextPhaseName: string | null;

  private constructor(props: CombatIntermissionProps) {
    this.variant = props.variant;
    this.clearedPhaseId = props.clearedPhaseId;
    this.clearedPhaseName = props.clearedPhaseName;
    this.nextPhaseId = props.nextPhaseId ?? null;
    this.nextPhaseName = props.nextPhaseName ?? null;
  }

  static create(props: CombatIntermissionProps): CombatIntermission {
    return new CombatIntermission(props);
  }

  static restore(props: CombatIntermissionProps): CombatIntermission {
    return new CombatIntermission(props);
  }

  toProps(): CombatIntermissionProps {
    return {
      variant: this.variant,
      clearedPhaseId: this.clearedPhaseId,
      clearedPhaseName: this.clearedPhaseName,
      nextPhaseId: this.nextPhaseId,
      nextPhaseName: this.nextPhaseName,
    };
  }
}
