import { Enemy } from '../../entities/Enemy';
import { Hero } from '../../entities/Hero';

export type CombatantRef = { side: 'hero' | 'enemy'; id: string };

interface InitiativeEntry {
  ref: CombatantRef;
  initiative: number;
  tieBreaker: number;
}

export class TurnOrderService {
  buildRoundOrder(heroes: Hero[], enemies: Enemy[]): CombatantRef[] {
    const entries: InitiativeEntry[] = [];

    heroes.forEach((hero, index) => {
      if (!hero.isAlive()) return;
      entries.push({
        ref: { side: 'hero', id: hero.id },
        initiative: this.heroInitiative(hero),
        tieBreaker: index,
      });
    });

    enemies.forEach((enemy, index) => {
      if (!enemy.isAlive()) return;
      entries.push({
        ref: { side: 'enemy', id: enemy.id },
        initiative: this.enemyInitiative(enemy),
        tieBreaker: 100 + index,
      });
    });

    return entries
      .sort((left, right) => {
        if (right.initiative !== left.initiative) {
          return right.initiative - left.initiative;
        }
        return left.tieBreaker - right.tieBreaker;
      })
      .map((entry) => entry.ref);
  }

  filterLivingOrder(order: CombatantRef[], heroes: Hero[], enemies: Enemy[]): CombatantRef[] {
    const livingHeroIds = new Set(heroes.filter((hero) => hero.isAlive()).map((hero) => hero.id));
    const livingEnemyIds = new Set(enemies.filter((enemy) => enemy.isAlive()).map((enemy) => enemy.id));

    return order.filter((ref) => {
      if (ref.side === 'hero') return livingHeroIds.has(ref.id);
      return livingEnemyIds.has(ref.id);
    });
  }

  private heroInitiative(hero: Hero): number {
    return hero.totalAttributes.dex * 2 + hero.level;
  }

  private enemyInitiative(enemy: Enemy): number {
    return enemy.stats.attack + enemy.stage;
  }
}
