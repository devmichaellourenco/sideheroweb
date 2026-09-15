import { CampaignInfo } from '../../domain/campaign/CampaignCatalog';
import { CampaignOverviewDto } from '../dto/CampaignDto';

export function mapCampaignOverview(
  info: CampaignInfo,
  maps: CampaignOverviewDto['maps'],
): CampaignOverviewDto {
  return {
    id: info.id,
    name: info.name,
    maps,
  };
}
