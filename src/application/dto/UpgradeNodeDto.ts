import { UpgradeBranchDto, UpgradeNodeStatusDto } from './UpgradeBranchDto';

export interface UpgradeRequirementDto {
  label: string;
  met: boolean;
}

export interface UpgradeNodeDto {
  id: string;
  feature: string;
  level: number;
  branch: UpgradeBranchDto;
  name: string;
  description: string;
  cost: number;
  status: UpgradeNodeStatusDto;
  canAfford: boolean;
  requirements: UpgradeRequirementDto[];
}
