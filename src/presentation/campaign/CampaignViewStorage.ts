export type CampaignViewMode = 'world' | 'region';

const VIEW_MODE_KEY = 'sidehero_campaign_view_mode';
const SEEN_MAPS_KEY = 'sidehero_campaign_seen_maps';

function readSeenMaps(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_MAPS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSeenMaps(maps: Set<string>): void {
  try {
    sessionStorage.setItem(SEEN_MAPS_KEY, JSON.stringify([...maps]));
  } catch {
    // sessionStorage indisponível
  }
}

export function getStoredCampaignViewMode(): CampaignViewMode | null {
  try {
    const raw = sessionStorage.getItem(VIEW_MODE_KEY);
    return raw === 'world' || raw === 'region' ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredCampaignViewMode(mode: CampaignViewMode): void {
  try {
    sessionStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // sessionStorage indisponível
  }
}

export function isMapSeen(mapId: string): boolean {
  return readSeenMaps().has(mapId);
}

export function markMapSeen(mapId: string): void {
  const seen = readSeenMaps();
  if (seen.has(mapId)) return;
  seen.add(mapId);
  writeSeenMaps(seen);
}

export function isMapNewToPlayer(mapId: string, unlocked: boolean): boolean {
  return unlocked && !isMapSeen(mapId);
}
