export const OPEN_HERO_IN_SIMULATOR_EVENT = 'balance-lab:open-hero-in-simulator';

export function openHeroInSimulator(heroClass: string): void {
  window.dispatchEvent(
    new CustomEvent<{ heroClass: string }>(OPEN_HERO_IN_SIMULATOR_EVENT, {
      detail: { heroClass },
    }),
  );
}

export interface OpenEnemyDetail {
  enemyType: string;
  level: number;
  role: 'trash' | 'elite' | 'boss';
}

export const OPEN_ENEMY_IN_SIMULATOR_EVENT = 'balance-lab:open-enemy-in-simulator';

export function openEnemyInSimulator(
  enemyType: string,
  level: number,
  role: 'trash' | 'elite' | 'boss',
): void {
  window.dispatchEvent(
    new CustomEvent<OpenEnemyDetail>(OPEN_ENEMY_IN_SIMULATOR_EVENT, {
      detail: { enemyType, level, role },
    }),
  );
}

