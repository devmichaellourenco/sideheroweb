import { DamageDelivery } from './DamageDelivery';
import { DamageElement } from './DamageElement';

export interface DamageComponent {
  element: DamageElement;
  delivery: DamageDelivery;
  /** Fração do poder total (soma dos componentes = 1). */
  weight: number;
}

export function dominantDamageElement(components?: DamageComponent[]): DamageElement {
  if (!components?.length) {
    return 'physical';
  }

  const winner = components.reduce((best, current) =>
    current.weight > best.weight ? current : best,
  );
  return winner.element;
}

export function normalizeDamageComponents(components: DamageComponent[]): DamageComponent[] {
  const total = components.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return [{ element: 'physical', delivery: 'melee', weight: 1 }];
  }

  if (Math.abs(total - 1) < 0.001) {
    return components;
  }

  return components.map((entry) => ({
    ...entry,
    weight: entry.weight / total,
  }));
}
