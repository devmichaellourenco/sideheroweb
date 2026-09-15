import {
  clampHeroLevel,
  expRequiredToAdvanceFromLevel,
  HERO_MAX_LEVEL,
} from '../progression/HeroLevelXpCatalog';

export class Experience {
  private constructor(
    readonly current: number,
    readonly toNextLevel: number,
    readonly level: number,
  ) {}

  static initial(): Experience {
    return Experience.atLevel(1, 0);
  }

  static restore(current: number, _toNextLevel: number, level: number): Experience {
    const normalizedLevel = clampHeroLevel(level);
    const normalizedCurrent = Math.max(0, current);

    if (normalizedLevel >= HERO_MAX_LEVEL) {
      return new Experience(0, 0, HERO_MAX_LEVEL);
    }

    return new Experience(
      normalizedCurrent,
      expRequiredToAdvanceFromLevel(normalizedLevel),
      normalizedLevel,
    );
  }

  private static atLevel(level: number, current: number): Experience {
    const normalizedLevel = clampHeroLevel(level);

    if (normalizedLevel >= HERO_MAX_LEVEL) {
      return new Experience(0, 0, HERO_MAX_LEVEL);
    }

    return new Experience(
      Math.max(0, current),
      expRequiredToAdvanceFromLevel(normalizedLevel),
      normalizedLevel,
    );
  }

  gain(amount: number): { experience: Experience; leveledUp: boolean } {
    if (amount <= 0 || this.level >= HERO_MAX_LEVEL) {
      return { experience: this, leveledUp: false };
    }

    let xp = this.current + amount;
    let level = this.level;
    let leveledUp = false;

    while (level < HERO_MAX_LEVEL) {
      const threshold = expRequiredToAdvanceFromLevel(level);
      if (xp < threshold) {
        break;
      }

      xp -= threshold;
      level += 1;
      leveledUp = true;
    }

    if (level >= HERO_MAX_LEVEL) {
      return {
        experience: new Experience(0, 0, HERO_MAX_LEVEL),
        leveledUp,
      };
    }

    return {
      experience: new Experience(xp, expRequiredToAdvanceFromLevel(level), level),
      leveledUp,
    };
  }
}
