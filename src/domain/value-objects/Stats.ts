export interface StatsProps {
  attack: number;
  defense: number;
  maxHealth: number;
  currentHealth: number;
}

export class Stats {
  readonly attack: number;
  readonly defense: number;
  readonly maxHealth: number;
  readonly currentHealth: number;

  private constructor(props: StatsProps) {
    this.attack = Math.max(0, props.attack);
    this.defense = Math.max(0, props.defense);
    this.maxHealth = Math.max(1, props.maxHealth);
    this.currentHealth = Math.min(this.maxHealth, Math.max(0, props.currentHealth));
  }

  static create(props: StatsProps): Stats {
    return new Stats(props);
  }

  static fromBase(attack: number, defense: number, maxHealth: number): Stats {
    return new Stats({ attack, defense, maxHealth, currentHealth: maxHealth });
  }

  withBonus(attack: number, defense: number, maxHealth: number): Stats {
    return new Stats({
      attack: this.attack + attack,
      defense: this.defense + defense,
      maxHealth: this.maxHealth + maxHealth,
      currentHealth: this.currentHealth + maxHealth,
    });
  }

  takeDamage(rawDamage: number): Stats {
    const mitigated = Math.max(1, rawDamage - this.defense);
    return new Stats({
      ...this.toProps(),
      currentHealth: this.currentHealth - mitigated,
    });
  }

  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  healFull(): Stats {
    return new Stats({ ...this.toProps(), currentHealth: this.maxHealth });
  }

  toProps(): StatsProps {
    return {
      attack: this.attack,
      defense: this.defense,
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
    };
  }
}
