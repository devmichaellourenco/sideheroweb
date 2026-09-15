import { FeatureAccessPolicy } from '../../domain/policies/FeatureAccessPolicy';
import { UpgradeLevels } from '../../domain/upgrades/FeatureKey';
import { FeatureFlagsDto } from '../dto/FeatureFlagsDto';

export function mapFeatureFlags(levels: UpgradeLevels): FeatureFlagsDto {
  return FeatureAccessPolicy.resolve(levels);
}
