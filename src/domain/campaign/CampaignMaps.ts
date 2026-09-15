import { MapId } from './CampaignIds';

export interface CampaignMapDefinition {
  id: MapId;
  name: string;
  mapIndex: number;
  phaseCount: number;
}

export const CAMPAIGN_MAPS: CampaignMapDefinition[] = [
  { id: 'stendra', mapIndex: 1, name: 'Stendra', phaseCount: 50 },
  { id: 'gruftall', mapIndex: 2, name: 'Gruftall', phaseCount: 50 },
  { id: 'valdris', mapIndex: 3, name: 'Valdris', phaseCount: 50 },
  { id: 'morthaven', mapIndex: 4, name: 'Morthaven', phaseCount: 50 },
  { id: 'broken_sky', mapIndex: 5, name: 'Céu Quebrado', phaseCount: 50 },
  { id: 'crimson_abyss', mapIndex: 6, name: 'Abismo Carmesim', phaseCount: 50 },
  { id: 'eternal_forge', mapIndex: 7, name: 'Forja Eterna', phaseCount: 50 },
  { id: 'ancient_grove', mapIndex: 8, name: 'Bosque Antigo', phaseCount: 50 },
  { id: 'twilight_tower', mapIndex: 9, name: 'Torre do Crepúsculo', phaseCount: 50 },
  { id: 'void_throne', mapIndex: 10, name: 'Trono do Vazio', phaseCount: 50 },
];

export const TOTAL_CAMPAIGN_PHASES = CAMPAIGN_MAPS.reduce(
  (sum, map) => sum + map.phaseCount,
  0,
);

export function mapDefinitionByIndex(mapIndex: number): CampaignMapDefinition | undefined {
  return CAMPAIGN_MAPS.find((map) => map.mapIndex === mapIndex);
}

export function mapDefinitionById(mapId: MapId): CampaignMapDefinition | undefined {
  return CAMPAIGN_MAPS.find((map) => map.id === mapId);
}
