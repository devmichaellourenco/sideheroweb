export class Gold {
  private constructor(private readonly amount: number) {}

  static zero(): Gold {
    return new Gold(0);
  }

  static of(amount: number): Gold {
    return new Gold(Math.max(0, Math.floor(amount)));
  }

  add(value: number): Gold {
    return Gold.of(this.amount + value);
  }

  canAfford(cost: number): boolean {
    return this.amount >= cost;
  }

  spend(cost: number): Gold {
    if (!this.canAfford(cost)) {
      throw new Error('Ouro insuficiente');
    }
    return Gold.of(this.amount - cost);
  }

  value(): number {
    return this.amount;
  }
}
