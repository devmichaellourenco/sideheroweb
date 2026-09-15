export type UpgradeBranchDto = 'combat' | 'chests' | 'equipment' | 'qol' | 'economy' | 'heroes';

export type UpgradeNodeStatusDto = 'locked' | 'ready' | 'available' | 'owned';

export const UPGRADE_BRANCH_LABELS: Record<UpgradeBranchDto, string> = {
  combat: 'Combate',
  chests: 'Baús',
  equipment: 'Equipamento',
  qol: 'Qualidade de vida',
  economy: 'Economia',
  heroes: 'Heróis',
};

export const UPGRADE_BRANCH_ORDER: UpgradeBranchDto[] = [
  'combat',
  'heroes',
  'chests',
  'equipment',
  'qol',
  'economy',
];
