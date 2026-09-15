export interface MetaBonuses {
  startGoldBonus: number;
  goldMultiplier: number;
  xpMultiplier: number;
  seasonSigilBonus: number;
}

export function emptyMetaBonuses(): MetaBonuses {
  return {
    startGoldBonus: 0,
    goldMultiplier: 1,
    xpMultiplier: 1,
    seasonSigilBonus: 0,
  };
}
