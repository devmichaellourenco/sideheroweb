import { CampaignMapDto, CampaignOverviewDto, CampaignPhaseDto } from '../../application/dto/CampaignDto';
import { renderActSceneCard } from './ActScenePresentation';
import {
  CAMPAIGN_MAPS,
  mapDefinitionById,
} from '../../domain/campaign/CampaignMaps';
import { releasedCampaignPhaseCount } from '../../domain/campaign/CampaignReleaseScope';
import { ASSETS, getAssetUrl, getEnemySpriteUrl, imgTag } from '../assets/AssetCatalog';
import { getCampaignScene, hasCampaignBanner } from '../assets/CampaignSceneCatalog';
import { CampaignViewMode } from '../campaign/CampaignViewStorage';
import { mapCombatHintLine } from '../../domain/campaign/MapCombatIdentityCatalog';

export type CampaignMapThemeId = (typeof CAMPAIGN_MAPS)[number]['id'];

export type CampaignBiomeKind =
  | 'forest'
  | 'mine'
  | 'ruins'
  | 'castle'
  | 'sky'
  | 'abyss'
  | 'forge'
  | 'grove'
  | 'twilight'
  | 'void';

export interface CampaignMapTheme {
  id: CampaignMapThemeId;
  biomeLabel: string;
  biomeIcon: string;
  biomeKind: CampaignBiomeKind;
  flavorText: string;
}

const MAP_THEMES: Record<CampaignMapThemeId, CampaignMapTheme> = {
  stendra: {
    id: 'stendra',
    biomeLabel: 'Planícies verdes',
    biomeIcon: ASSETS.ui.stage,
    biomeKind: 'forest',
    flavorText: 'Campos outrora pacíficos agora fervilham de goblins e bandoleiros.',
  },
  gruftall: {
    id: 'gruftall',
    biomeLabel: 'Terra das cinzas',
    biomeIcon: ASSETS.ui.defense,
    biomeKind: 'ruins',
    flavorText:
      'Terra desolada sob o domínio de Gonodor — cinzas espessas, ruínas e um ar sufocante que paralisa os fracos.',
  },
  valdris: {
    id: 'valdris',
    biomeLabel: 'Ruínas espectrais',
    biomeIcon: ASSETS.ui.defense,
    biomeKind: 'ruins',
    flavorText: 'Sombras dançam entre colunas quebradas; os mortos não descansam aqui.',
  },
  morthaven: {
    id: 'morthaven',
    biomeLabel: 'Castelo sombrio',
    biomeIcon: ASSETS.ui.attack,
    biomeKind: 'castle',
    flavorText: 'Muralhas decadentes guardam segredos e lordes que preferem a escuridão.',
  },
  broken_sky: {
    id: 'broken_sky',
    biomeLabel: 'Céu fragmentado',
    biomeIcon: ASSETS.ui.campaign,
    biomeKind: 'sky',
    flavorText: 'Ilhas de rocha flutuam sobre um abismo sem fim; só os ousados avançam.',
  },
  crimson_abyss: {
    id: 'crimson_abyss',
    biomeLabel: 'Abismo ardente',
    biomeIcon: ASSETS.ui.attack,
    biomeKind: 'abyss',
    flavorText: 'Lava e fúria derretem a carne e a coragem dos incautos.',
  },
  eternal_forge: {
    id: 'eternal_forge',
    biomeLabel: 'Forja ancestral',
    biomeIcon: ASSETS.ui.forge,
    biomeKind: 'forge',
    flavorText: 'Martelos ecoam eternamente; cada faísca pode ser a última.',
  },
  ancient_grove: {
    id: 'ancient_grove',
    biomeLabel: 'Bosque antigo',
    biomeIcon: ASSETS.ui.stage,
    biomeKind: 'grove',
    flavorText: 'Raízes milenares sussurram profecias — e convocam guardiões colossais.',
  },
  twilight_tower: {
    id: 'twilight_tower',
    biomeLabel: 'Torre crepuscular',
    biomeIcon: ASSETS.ui.campaign,
    biomeKind: 'twilight',
    flavorText: 'No limiar entre dia e noite, magia instável distorce tempo e destino.',
  },
  void_throne: {
    id: 'void_throne',
    biomeLabel: 'Trono do vazio',
    biomeIcon: ASSETS.ui.victoryFrame,
    biomeKind: 'void',
    flavorText: 'O fim da jornada aguarda. Apenas os heróis dignos chegarão ao trono.',
  },
};

const ACT_ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const MILESTONE_BOSS_BY_MAP_INDEX: Record<
  number,
  { enemyType: string; displayName: string; bossLabel: string }
> = {
  1: { enemyType: 'saci', displayName: 'Saci', bossLabel: 'Guardião Elemental' },
  2: { enemyType: 'gonodor', displayName: 'Gonodor', bossLabel: 'Centelha de Gonodor' },
  3: { enemyType: 'renegade_necromancer', displayName: 'Espectro', bossLabel: 'Espectro de Valdris' },
  4: { enemyType: 'morthaven_duke', displayName: 'Duque', bossLabel: 'Duque de Morthaven' },
  5: { enemyType: 'three_head_hydra', displayName: 'Hidra', bossLabel: 'Colosso do Céu Quebrado' },
  6: { enemyType: 'young_green_dragon', displayName: 'Dragão', bossLabel: 'Senhor do Abismo' },
  7: { enemyType: 'lesser_lich', displayName: 'Lich', bossLabel: 'Forjador Eterno' },
  8: { enemyType: 'awakened_titan', displayName: 'Titã', bossLabel: 'Guardião do Bosque' },
  9: { enemyType: 'demon_prince', displayName: 'Príncipe Demônio', bossLabel: 'Sentinela do Crepúsculo' },
  10: { enemyType: 'vorax', displayName: 'Vorax', bossLabel: 'Soberano do Vazio' },
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getCampaignMapTheme(mapId: string): CampaignMapTheme {
  return MAP_THEMES[mapId as CampaignMapThemeId] ?? MAP_THEMES.stendra;
}

export function getMapBiomeKind(mapId: string): CampaignBiomeKind {
  return getCampaignMapTheme(mapId).biomeKind;
}

export function getMapFlavorText(mapId: string): string {
  return getCampaignMapTheme(mapId).flavorText;
}

export function getMapCombatHint(mapId: string): string {
  return mapCombatHintLine(mapId);
}

export function resolveMapIdFromPhaseId(phaseId: string): CampaignMapThemeId {
  const mapIndex = Number.parseInt(phaseId.split('-')[0] ?? '1', 10) || 1;
  return CAMPAIGN_MAPS.find((map) => map.mapIndex === mapIndex)?.id ?? 'stendra';
}

export function countClearedPhasesForMap(clearedPhaseIds: readonly string[], mapId: string): number {
  const mapIndex = mapDefinitionById(mapId as CampaignMapThemeId)?.mapIndex;
  if (!mapIndex) return 0;
  const prefix = `${mapIndex}-`;
  return clearedPhaseIds.filter((id) => id.startsWith(prefix)).length;
}

export function phaseCountForMap(mapId: string): number {
  return mapDefinitionById(mapId as CampaignMapThemeId)?.phaseCount ?? 50;
}

export function mapProgress(map: CampaignMapDto): { cleared: number; unlocked: number; total: number } {
  const cleared = map.phases.filter((phase) => phase.cleared).length;
  const unlocked = map.phases.filter((phase) => phase.unlocked || phase.cleared).length;
  return { cleared, unlocked, total: map.phases.length };
}

export function campaignGlobalProgress(campaign: CampaignOverviewDto): {
  cleared: number;
  total: number;
} {
  const cleared = campaign.maps.reduce(
    (sum, map) => sum + map.phases.filter((phase) => phase.cleared).length,
    0,
  );
  return { cleared, total: releasedCampaignPhaseCount() };
}

export function parseMapIndex(map: CampaignMapDto): number {
  const fromCatalog = CAMPAIGN_MAPS.find((entry) => entry.id === map.id)?.mapIndex;
  if (fromCatalog) return fromCatalog;

  const phaseId = map.phases[0]?.id;
  if (!phaseId) return 1;
  return Number.parseInt(phaseId.split('-')[0], 10) || 1;
}

export function tierRangeForMap(mapIndex: number): string {
  const min = (mapIndex - 1) * 50 + 1;
  const max = mapIndex * 50;
  return `T${min}–${max}`;
}

export function getMilestoneBossForMapIndex(mapIndex: number) {
  return MILESTONE_BOSS_BY_MAP_INDEX[mapIndex] ?? null;
}

export function resolvePhaseNumber(phaseId: string): number {
  return Number.parseInt(phaseId.split('-')[1] ?? '0', 10) || 0;
}

export function findPhaseById(map: CampaignMapDto, phaseId: string | null): CampaignPhaseDto | null {
  if (!phaseId) return null;
  return map.phases.find((phase) => phase.id === phaseId) ?? null;
}

export function resolveInitialPendingPhaseId(map: CampaignMapDto): string | null {
  const selected = map.phases.find((phase) => phase.selected && phase.playable);
  if (selected) return selected.id;

  const playable = map.phases.find((phase) => phase.playable);
  if (playable) return playable.id;

  const latestCleared = [...map.phases].reverse().find((phase) => phase.cleared);
  return latestCleared?.id ?? map.phases[0]?.id ?? null;
}

export function renderMapTabBiomeIcon(mapId: string): string {
  const theme = getCampaignMapTheme(mapId);
  return imgTag(getAssetUrl(theme.biomeIcon), theme.biomeLabel, 'campaign-map-tab-biome-icon');
}

function renderFeaturedEnemies(phase: CampaignPhaseDto): string {
  if (phase.featuredEnemyTypes.length === 0) return '';

  const icons = phase.featuredEnemyTypes
    .map((enemyType) =>
      imgTag(
        getEnemySpriteUrl(enemyType, enemyType),
        enemyType,
        'campaign-phase-preview-enemy-icon',
      ),
    )
    .join('');

  return `<div class="campaign-phase-preview-enemies" aria-label="Inimigos em destaque">${icons}</div>`;
}

function renderPathCheckpoint(phaseNumber: number): string {
  const chestIcon = getAssetUrl(ASSETS.ui.chestOpen);
  return `
    <div class="campaign-path-checkpoint" aria-hidden="true">
      ${imgTag(chestIcon, 'Checkpoint', 'campaign-path-checkpoint-icon')}
      <span class="campaign-path-checkpoint-label">Marco ${phaseNumber}</span>
    </div>
  `;
}

function renderPathPhaseNode(
  phase: CampaignPhaseDto,
  mapIndex: number,
  pendingPhaseId: string | null,
  side: 'left' | 'right',
): string {
  const phaseNumber = resolvePhaseNumber(phase.id);
  const isPending = phase.id === pendingPhaseId;
  const isCurrent = phase.selected;
  const disabled = phase.playable ? '' : ' disabled';
  const pendingClass = isPending ? ' campaign-path-node--pending' : '';
  const currentClass = isCurrent ? ' campaign-path-node--current' : '';
  const milestoneClass = phase.milestoneBoss ? ' campaign-path-node--milestone' : '';
  const finaleClass = phase.seasonFinale ? ' campaign-path-node--finale' : '';
  const clearedClass = phase.cleared ? ' campaign-path-node--cleared' : '';
  const lockedClass = !phase.unlocked && !phase.cleared ? ' campaign-path-node--locked' : '';
  const roleLabel = phase.seasonFinale
    ? 'Final da temporada'
    : phase.milestoneBoss
      ? 'Boss do mapa'
      : phase.challengeLabel
        ? phase.challengeLabel
        : `Fase ${phaseNumber}`;
  const bossVisual = phase.milestoneBoss || phase.seasonFinale ? renderBossVisual(mapIndex, phase) : '';
  const compactBody =
    phase.milestoneBoss || phase.seasonFinale
      ? `
        ${bossVisual}
        <span class="campaign-path-node-name">${escapeHtml(phase.displayName)}</span>
        <span class="campaign-path-node-meta">${roleLabel} · ${phase.waveCount} waves · T${phase.difficultyTier}</span>
      `
      : `
        <span class="campaign-path-node-number">${phaseNumber}</span>
        <span class="campaign-path-node-tier">T${phase.difficultyTier}</span>
        ${
          phase.challengeLabel
            ? `<span class="campaign-path-node-challenge">${escapeHtml(phase.challengeLabel)}</span>`
            : ''
        }
      `;

  const markers = [
    isCurrent ? '<span class="campaign-path-node-marker campaign-path-node-marker--current">Atual</span>' : '',
    isPending ? '<span class="campaign-path-node-marker campaign-path-node-marker--pending">Escolhida</span>' : '',
  ]
    .filter(Boolean)
    .join('');

  const epicPendingClass =
    isPending && (phase.milestoneBoss || phase.seasonFinale)
      ? ' campaign-path-node--epic-pending'
      : '';

  const challengeClass = phase.challengeKind
    ? ` campaign-path-node--challenge-${phase.challengeKind}`
    : '';

  const titleHint = phase.challengeHint
    ? ` · ${phase.challengeHint}`
    : '';

  return `
    <button
      type="button"
      class="campaign-path-node campaign-path-node--${side}${pendingClass}${currentClass}${milestoneClass}${finaleClass}${clearedClass}${lockedClass}${epicPendingClass}${challengeClass}"
      data-phase-id="${escapeHtml(phase.id)}"
      title="${escapeHtml(phase.displayName)} · ${roleLabel} · T${phase.difficultyTier}${escapeHtml(titleHint)}"
      ${disabled}
    >
      ${markers}
      ${renderPhaseStatus(phase)}
      ${compactBody}
    </button>
  `;
}

export function renderCampaignPath(
  map: CampaignMapDto,
  mapIndex: number,
  pendingPhaseId: string | null,
): string {
  const acts = Array.from({ length: 5 }, (_, index) => {
    const actNumber = index + 1;
    const actPhases = map.phases.filter((phase) => phase.actNumber === actNumber);
    if (actPhases.length === 0) return '';

    const actStart = (actNumber - 1) * 10 + 1;
    const actEnd = actNumber * 10;
    const actScene = map.actScenes?.find((scene) => scene.actNumber === actNumber);
    const sceneCard = actScene ? renderActSceneCard(actScene) : '';
    const nodes = actPhases
      .map((phase, nodeIndex) => {
        const phaseNumber = resolvePhaseNumber(phase.id);
        const side: 'left' | 'right' = nodeIndex % 2 === 0 ? 'left' : 'right';
        const checkpoint =
          phaseNumber % 10 === 0 && !phase.milestoneBoss ? renderPathCheckpoint(phaseNumber) : '';
        return `${checkpoint}${renderPathPhaseNode(phase, mapIndex, pendingPhaseId, side)}`;
      })
      .join('');

    return `
      <section class="campaign-path-act" data-campaign-path-act="${actNumber}">
        <header class="campaign-path-act-header">
          <span class="campaign-path-act-title">Ato ${ACT_ROMAN[index] ?? actNumber}</span>
          <span class="campaign-path-act-range">Fases ${actStart}–${actEnd}</span>
        </header>
        ${sceneCard}
        <div class="campaign-path-act-track">${nodes}</div>
      </section>
    `;
  }).join('');

  return `<div class="campaign-path">${acts}</div>`;
}

export function renderPhasePreviewFooter(
  map: CampaignMapDto,
  mapIndex: number,
  pendingPhaseId: string | null,
): string {
  const phase = findPhaseById(map, pendingPhaseId);
  if (!phase) {
    return `
      <footer class="campaign-phase-preview campaign-phase-preview--empty">
        <p class="campaign-phase-preview-empty">Selecione uma fase desbloqueada na trilha.</p>
      </footer>
    `;
  }

  const roleLabel = phase.seasonFinale
    ? 'Final da temporada'
    : phase.milestoneBoss
      ? 'Boss do mapa'
      : phase.challengeLabel
        ? phase.challengeLabel
        : `Fase ${resolvePhaseNumber(phase.id)}`;
  const canStart = phase.playable;
  const boss = phase.milestoneBoss || phase.seasonFinale ? renderBossVisual(mapIndex, phase) : '';

  const delightClass =
    phase.milestoneBoss || phase.seasonFinale ? ' campaign-phase-preview--epic' : '';

  return `
    <footer class="campaign-phase-preview${delightClass}" data-campaign-phase-preview>
      <div class="campaign-phase-preview-main">
        ${boss}
        <div class="campaign-phase-preview-copy">
          <p class="campaign-phase-preview-eyebrow">${escapeHtml(roleLabel)}</p>
          <h4 class="campaign-phase-preview-title">${escapeHtml(phase.displayName)}</h4>
          <p class="campaign-phase-preview-meta">${phase.waveCount} waves · Tier ${phase.difficultyTier}</p>
          ${
            phase.challengeHint
              ? `<p class="campaign-phase-preview-challenge">${escapeHtml(phase.challengeHint)}</p>`
              : ''
          }
          ${renderFeaturedEnemies(phase)}
        </div>
      </div>
      <button
        type="button"
        class="campaign-phase-preview-start"
        data-campaign-start-phase="${escapeHtml(phase.id)}"
        ${canStart ? '' : 'disabled'}
      >
        Iniciar fase
      </button>
    </footer>
  `;
}

function renderPhaseStatus(phase: CampaignPhaseDto): string {
  if (phase.cleared) {
    return `
      <span class="campaign-phase-status campaign-phase-status--cleared" aria-label="Concluída">
        ${imgTag(getAssetUrl(ASSETS.ui.stage), 'Concluída', 'campaign-phase-status-icon')}
      </span>
    `;
  }

  if (phase.unlocked || phase.playable) {
    return `<span class="campaign-phase-status campaign-phase-status--unlocked" aria-label="Disponível"></span>`;
  }

  return `
    <span class="campaign-phase-status campaign-phase-status--locked" aria-label="Bloqueada">
      <span class="campaign-phase-status-lock" aria-hidden="true"></span>
    </span>
  `;
}

function renderBossVisual(mapIndex: number, phase: CampaignPhaseDto): string {
  if (!phase.milestoneBoss && !phase.seasonFinale) return '';

  const boss = getMilestoneBossForMapIndex(mapIndex);
  if (!boss) return '';

  const spriteUrl = getEnemySpriteUrl(boss.enemyType, boss.displayName);
  const frameClass = phase.seasonFinale
    ? 'campaign-phase-boss-frame campaign-phase-boss-frame--finale'
    : 'campaign-phase-boss-frame';

  return `
    <div class="${frameClass}">
      ${imgTag(spriteUrl, boss.bossLabel, 'campaign-phase-boss-sprite')}
      ${
        phase.seasonFinale
          ? imgTag(getAssetUrl(ASSETS.ui.victoryWings), '', 'campaign-phase-finale-wings')
          : ''
      }
    </div>
  `;
}

export function renderCampaignOverviewTooltipContent(campaign: CampaignOverviewDto): string {
  const { cleared, total } = campaignGlobalProgress(campaign);
  const fillPct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  return `
    <strong class="campaign-tooltip-title">${escapeHtml(campaign.name)}</strong>
    <span class="campaign-tooltip-line">Nix e seus companheiros rumo a Vorax</span>
    <div
      class="campaign-tooltip-progress"
      role="progressbar"
      aria-valuenow="${cleared}"
      aria-valuemin="0"
      aria-valuemax="${total}"
      aria-label="Progresso da campanha"
    >
      <div class="campaign-tooltip-progress-track">
        <div class="campaign-tooltip-progress-fill" style="width: ${fillPct}%"></div>
      </div>
      <span class="campaign-tooltip-progress-label">${cleared}/${total} fases concluídas</span>
    </div>
  `;
}

export function renderMapRegionTooltipContent(map: CampaignMapDto, mapIndex: number): string {
  const theme = getCampaignMapTheme(map.id);
  const locked = !map.unlocked;
  const previousBoss = locked ? getMilestoneBossForMapIndex(mapIndex - 1) : null;
  const flavor = locked
    ? previousBoss
      ? `Derrote ${previousBoss.bossLabel} na fase 50 do mapa anterior para desbloquear.`
      : `Conclua o mapa anterior para desbloquear ${map.name}.`
    : theme.flavorText;

  return `
    <strong class="campaign-tooltip-title">${escapeHtml(map.name)}</strong>
    <span class="campaign-tooltip-line campaign-tooltip-biome">${escapeHtml(theme.biomeLabel)} · ${tierRangeForMap(mapIndex)}</span>
    <span class="campaign-tooltip-line campaign-tooltip-flavor">${escapeHtml(flavor)}</span>
  `;
}

export function renderMapProgressBar(map: CampaignMapDto, mapIndex: number): string {
  const theme = getCampaignMapTheme(map.id);
  const progress = mapProgress(map);
  const combatHint = mapCombatHintLine(map.id);
  const tooltip = `
    <strong class="campaign-tooltip-title">${escapeHtml(map.name)}</strong>
    <span class="campaign-tooltip-line campaign-tooltip-biome">${escapeHtml(theme.biomeLabel)} · ${tierRangeForMap(mapIndex)}</span>
    <span class="campaign-tooltip-line">${progress.cleared}/${progress.total} concluídas · ${progress.unlocked} desbloqueadas</span>
    <span class="campaign-tooltip-line campaign-tooltip-flavor">${escapeHtml(theme.flavorText)}</span>
    ${
      combatHint
        ? `<span class="campaign-tooltip-line campaign-tooltip-combat-hint">${escapeHtml(combatHint)}</span>`
        : ''
    }
  `;

  return `
    <div class="campaign-map-header-main" data-campaign-tooltip>
      <h3 class="campaign-map-title">${escapeHtml(map.name)}</h3>
      <p class="campaign-map-biome">${escapeHtml(theme.biomeLabel)}</p>
      <span class="campaign-tooltip-content hidden">${tooltip}</span>
    </div>
  `;
}

export function renderLockedMapPanel(map: CampaignMapDto): string {
  const mapIndex = parseMapIndex(map);
  const previousBoss = getMilestoneBossForMapIndex(mapIndex - 1);
  const theme = getCampaignMapTheme(map.id);
  const bossVisual = previousBoss
    ? `
      <div class="campaign-map-locked-boss">
        ${imgTag(
          getEnemySpriteUrl(previousBoss.enemyType, previousBoss.displayName),
          previousBoss.bossLabel,
          'campaign-map-locked-boss-sprite',
        )}
        <p class="campaign-map-locked-boss-name">${escapeHtml(previousBoss.bossLabel)}</p>
      </div>
    `
    : '';

  return `
    <div class="campaign-map-locked">
      ${bossVisual}
      <p class="campaign-map-locked-title">${escapeHtml(map.name)}</p>
      <p class="campaign-map-locked-biome">${escapeHtml(theme.biomeLabel)}</p>
      <p class="campaign-map-locked-hint">
        ${
          previousBoss
            ? `Derrote <strong>${escapeHtml(previousBoss.bossLabel)}</strong> na fase 50 do mapa anterior para desbloquear esta região.`
            : `Conclua o mapa anterior para desbloquear ${escapeHtml(map.name)}.`
        }
      </p>
    </div>
  `;
}

export function renderMapTabRing(cleared: number, total: number): string {
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return `
    <svg class="campaign-map-tab-ring" viewBox="0 0 28 28" aria-hidden="true">
      <circle class="campaign-map-tab-ring-track" cx="14" cy="14" r="${radius}" />
      <circle
        class="campaign-map-tab-ring-fill"
        cx="14"
        cy="14"
        r="${radius}"
        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}"
      />
    </svg>
  `;
}

export function renderCampaignViewToggle(
  campaign: CampaignOverviewDto,
  viewMode: CampaignViewMode,
): string {
  const campaignTooltip = renderCampaignOverviewTooltipContent(campaign);

  return `
    <div class="campaign-view-toggle" role="tablist" aria-label="Visão do mapa">
      <button
        type="button"
        class="campaign-view-toggle-btn ${viewMode === 'world' ? 'active' : ''}"
        data-campaign-view="world"
        data-campaign-tooltip
        role="tab"
        aria-selected="${viewMode === 'world'}"
      >
        Mapa-mundo
        <span class="campaign-tooltip-content hidden">${campaignTooltip}</span>
      </button>
      <button
        type="button"
        class="campaign-view-toggle-btn ${viewMode === 'region' ? 'active' : ''}"
        data-campaign-view="region"
        role="tab"
        aria-selected="${viewMode === 'region'}"
      >
        Trilha
      </button>
    </div>
  `;
}

function renderWorldMapNode(
  map: CampaignMapDto,
  activeMapId: string,
  nodeIndex: number,
): string {
  const theme = getCampaignMapTheme(map.id);
  const progress = mapProgress(map);
  const mapIndex = parseMapIndex(map);
  const locked = !map.unlocked;
  const active = map.id === activeMapId;
  const side = nodeIndex % 2 === 0 ? 'left' : 'right';
  const illustrated = hasCampaignBanner(map.id);
  const boss = locked ? getMilestoneBossForMapIndex(mapIndex - 1) : getMilestoneBossForMapIndex(mapIndex);
  const bossTeaser =
    locked && boss
      ? imgTag(
          getEnemySpriteUrl(boss.enemyType, boss.displayName),
          boss.bossLabel,
          'campaign-world-node-boss-teaser',
        )
      : renderMapTabBiomeIcon(map.id);
  const disabled = locked ? ' aria-disabled="true"' : '';
  const regionTooltip = renderMapRegionTooltipContent(map, mapIndex);

  return `
    <button
      type="button"
      class="campaign-world-node campaign-world-node--${side}${active ? ' campaign-world-node--active' : ''}${locked ? ' campaign-world-node--locked' : ''}${illustrated ? ' campaign-world-node--illustrated' : ''}"
      data-campaign-world-map="${escapeHtml(map.id)}"
      data-campaign-theme="${escapeHtml(map.id)}"
      data-campaign-tooltip
      ${disabled}
    >
      ${illustrated ? renderCampaignWorldNodeBanner(map.id) : ''}
      <span class="campaign-world-node-body">
        <span class="campaign-world-node-visual">
          ${locked ? '' : renderMapTabRing(progress.cleared, progress.total)}
          ${bossTeaser}
          ${locked ? '<span class="campaign-map-tab-fog" aria-hidden="true"></span>' : ''}
        </span>
        <span class="campaign-world-node-copy">
          <span class="campaign-world-node-name">${escapeHtml(map.name)}</span>
          <span class="campaign-world-node-meta">${escapeHtml(theme.biomeLabel)} · ${progress.cleared}/${progress.total}</span>
        </span>
      </span>
      <span class="campaign-tooltip-content hidden">${regionTooltip}</span>
    </button>
  `;
}

export function renderCampaignWorldMap(campaign: CampaignOverviewDto, activeMapId: string): string {
  const nodes = campaign.maps
    .map((map, index) => renderWorldMapNode(map, activeMapId, index))
    .join('');

  return `
    <div class="campaign-world-map">      
      <div class="campaign-world-map-spine" aria-hidden="true"></div>
      <div class="campaign-world-map-nodes">${nodes}</div>
    </div>
  `;
}

export function renderMapUnlockBanner(map: CampaignMapDto): string {
  return `
    <div class="campaign-unlock-banner" data-campaign-unlock-banner>
      ${imgTag(getAssetUrl(ASSETS.ui.victoryGlow), '', 'campaign-unlock-banner-glow')}
      <div class="campaign-unlock-banner-copy">
        <p class="campaign-unlock-banner-eyebrow">Nova região · ${escapeHtml(map.name)}</p>
      </div>
    </div>
  `;
}

export function renderCampaignWorldNodeBanner(mapId: string): string {
  const scene = getCampaignScene(mapId);
  if (!scene?.banner) return '';

  return `
    <span class="campaign-world-node-banner" aria-hidden="true">
      ${imgTag(getAssetUrl(scene.banner), '', 'campaign-world-node-banner__img')}
      <span class="campaign-world-node-banner__shade"></span>
    </span>
  `;
}

export function renderMapFlavorHeader(
  map: CampaignMapDto,
  mapIndex: number,
  options: { includeFlavor?: boolean } = {},
): string {
  const theme = getCampaignMapTheme(map.id);
  const combatHint = mapCombatHintLine(map.id);
  const flavor = options.includeFlavor !== false
    ? `<p class="campaign-map-flavor">${escapeHtml(theme.flavorText)}</p>${
        combatHint
          ? `<p class="campaign-map-combat-hint">${escapeHtml(combatHint)}</p>`
          : ''
      }`
    : '';

  return `
    <div class="campaign-map-header-main">
      <h3 class="campaign-map-title">${escapeHtml(map.name)}</h3>
      <p class="campaign-map-biome">${escapeHtml(theme.biomeLabel)} · ${tierRangeForMap(mapIndex)}</p>
      ${flavor}
    </div>
  `;
}
