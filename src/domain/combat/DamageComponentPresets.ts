import { DamageComponent, normalizeDamageComponents } from './DamageComponent';
import { DamageDelivery } from './DamageDelivery';
import { DamageElement } from './DamageElement';

export function damageComponent(
  element: DamageElement,
  delivery: DamageDelivery,
  weight = 1,
): DamageComponent {
  return { element, delivery, weight };
}

export function defaultDeliveryFor(
  element: DamageElement,
  targetScope: 'single' | 'all',
): DamageDelivery {
  if (element === 'physical') {
    return 'melee';
  }
  return targetScope === 'all' ? 'aoe' : 'projectile';
}

/** Um elemento principal; delivery inferido por escopo se omitido. */
export function standardDamage(
  element: DamageElement,
  targetScope: 'single' | 'all',
  options?: {
    delivery?: DamageDelivery;
    extras?: DamageComponent[];
  },
): DamageComponent[] {
  const delivery = options?.delivery ?? defaultDeliveryFor(element, targetScope);
  const components = [damageComponent(element, delivery, 1)];

  if (options?.extras?.length) {
    const extraWeight = options.extras.reduce((sum, entry) => sum + entry.weight, 0);
    const primaryWeight = Math.max(0.05, 1 - extraWeight);
    components[0] = { ...components[0], weight: primaryWeight };
    components.push(...options.extras);
  }

  return normalizeDamageComponents(components);
}
