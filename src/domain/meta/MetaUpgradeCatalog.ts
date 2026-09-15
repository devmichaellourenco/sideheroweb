import { MetaUpgradeDefinition } from './MetaUpgradeDefinition';

export const META_UPGRADE_CATALOG: MetaUpgradeDefinition[] = [
  {
    id: 'meta_start_gold_1',
    feature: 'start_gold',
    level: 1,
    name: 'Bolsa Inicial I',
    description: '+25 ouro ao começar uma nova temporada.',
    cost: 2,
    startGoldBonus: 25,
  },
  {
    id: 'meta_start_gold_2',
    feature: 'start_gold',
    level: 2,
    name: 'Bolsa Inicial II',
    description: '+25 ouro extra no início da temporada.',
    cost: 3,
    startGoldBonus: 25,
  },
  {
    id: 'meta_start_gold_3',
    feature: 'start_gold',
    level: 3,
    name: 'Bolsa Inicial III',
    description: '+50 ouro extra no início da temporada.',
    cost: 5,
    startGoldBonus: 50,
  },
  {
    id: 'meta_gold_bonus_1',
    feature: 'gold_bonus',
    level: 1,
    name: 'Pacto Dourado I',
    description: '+5% de ouro em combate, em todas as temporadas.',
    cost: 3,
    goldBonusPercent: 5,
  },
  {
    id: 'meta_gold_bonus_2',
    feature: 'gold_bonus',
    level: 2,
    name: 'Pacto Dourado II',
    description: '+5% adicional de ouro em combate.',
    cost: 4,
    goldBonusPercent: 5,
  },
  {
    id: 'meta_gold_bonus_3',
    feature: 'gold_bonus',
    level: 3,
    name: 'Pacto Dourado III',
    description: '+10% adicional de ouro em combate.',
    cost: 6,
    goldBonusPercent: 10,
  },
  {
    id: 'meta_hero_xp_1',
    feature: 'hero_xp',
    level: 1,
    name: 'Memória de Batalha I',
    description: '+8% de XP para a party em todas as temporadas.',
    cost: 3,
    xpBonusPercent: 8,
  },
  {
    id: 'meta_hero_xp_2',
    feature: 'hero_xp',
    level: 2,
    name: 'Memória de Batalha II',
    description: '+12% adicional de XP para a party.',
    cost: 5,
    xpBonusPercent: 12,
  },
  {
    id: 'meta_sigil_hoard_1',
    feature: 'sigil_hoard',
    level: 1,
    name: 'Cofre de Selos',
    description: '+2 selos ao concluir uma temporada.',
    cost: 4,
    seasonSigilBonus: 2,
  },
];

const byId = new Map(META_UPGRADE_CATALOG.map((entry) => [entry.id, entry]));

export function getMetaUpgradeById(id: string): MetaUpgradeDefinition | undefined {
  return byId.get(id);
}
