import { describe, expect, it } from 'vitest';
import { CampaignOverviewDto } from '../../application/dto/CampaignDto';
import {
  getMapFlavorText,
  resolveInitialPendingPhaseId,
} from './CampaignMapPresentation';
import { CampaignModalRenderer, resolveInitialMapId } from './CampaignModalRenderer';

function phase(
  id: string,
  options: Partial<{
    unlocked: boolean;
    cleared: boolean;
    selected: boolean;
    playable: boolean;
    displayName: string;
  }> = {},
) {
  const phaseNumber = Number.parseInt(id.split('-')[1] ?? '1', 10);
  return {
    id,
    displayName: options.displayName ?? id,
    waveCount: 4,
    difficultyTier: 1,
    unlocked: options.unlocked ?? false,
    cleared: options.cleared ?? false,
    selected: options.selected ?? false,
    playable: options.playable ?? false,
    milestoneBoss: id.endsWith('-50'),
    seasonFinale: id === '4-50',
    actNumber: Math.min(5, Math.max(1, Math.ceil(phaseNumber / 10))),
    featuredEnemyTypes: ['goblin_raider'],
  };
}

function buildOverview(): CampaignOverviewDto {
  return {
    id: 'apprentice',
    name: 'Ascensão de Nix',
    maps: [
      {
        id: 'stendra',
        name: 'Stendra',
        unlocked: true,
        phases: [
          phase('1-1', { unlocked: true, playable: true, cleared: true }),
          phase('1-50', {
            displayName: 'Guardião das Esgotos',
            unlocked: true,
            playable: true,
            selected: true,
          }),
        ],
        actScenes: [],
        missionBoard: {
          mapId: 'stendra',
          main: {
            id: 'main:1-50',
            kind: 'main',
            name: 'Guardião das Esgotos',
            mapId: 'stendra',
            phaseTemplateId: '1-50',
            stars: null,
            waveCount: 4,
            difficultyTier: 50,
            expectedGold: 80,
            victoryXp: 120,
            featuredEnemyTypes: ['goblin_raider'],
            featuredEnemies: [],
            rewards: null,
            rewardItemName: null,
            rewardSceneTitle: null,
            selected: true,
          },
          sides: [],
          normals: [
            {
              id: 'normal:1-2',
              kind: 'normal',
              name: 'Patrulha',
              mapId: 'stendra',
              phaseTemplateId: '1-2',
              stars: 1,
              waveCount: 2,
              difficultyTier: 2,
              expectedGold: 14,
              victoryXp: 22,
              featuredEnemyTypes: [],
              featuredEnemies: [],
              rewards: null,
              rewardItemName: null,
              rewardSceneTitle: null,
              selected: false,
            },
          ],
        },
      },
      {
        id: 'gruftall',
        name: 'Gruftall',
        unlocked: false,
        phases: [phase('2-1')],
        actScenes: [],
      },
    ],
  };
}

describe('CampaignModalRenderer', () => {
  const renderer = new CampaignModalRenderer();

  it('resolveInitialMapId prioriza mapa desbloqueado da fase selecionada', () => {
    expect(resolveInitialMapId(buildOverview())).toBe('stendra');
  });

  it('resolveInitialPendingPhaseId prioriza fase selecionada jogável', () => {
    const map = buildOverview().maps[0];
    expect(resolveInitialPendingPhaseId(map)).toBe('1-50');
  });

  it('variante pins-only renderiza só o board com pins (sem header/trilha)', () => {
    const overview = buildOverview();
    const html = renderer.render(overview, 'stendra', null, 'region', {
      pendingMissionId: 'main:1-50',
      variant: 'pins-only',
    });

    expect(html).toContain('campaign-modal--pins-only');
    expect(html).toContain('campaign-map-body--pins-only');
    expect(html).toContain('campaign-mission-board');
    expect(html).toContain('data-mission-map="stendra"');
    expect(html).not.toContain('campaign-map-header');
    expect(html).not.toContain('campaign-map-title');
    expect(html).not.toContain('Stendra');
    expect(html).not.toContain('campaign-view-toggle');
    expect(html).not.toContain('campaign-mission-select-hint');
    expect(html).not.toContain('campaign-unlock-banner');
  });

  it('renderiza board de missões e header compacto no modo região', () => {
    const overview = buildOverview();
    const html = renderer.render(overview, 'stendra', null, 'region', {
      pendingMissionId: 'main:1-50',
    });

    expect(html).not.toContain('campaign-hero-banner');
    expect(html).not.toContain('campaign-region-banner');
    expect(html).not.toContain('campaign_stendra_banner.png');
    expect(html).not.toContain('campaign-view-toggle');
    expect(html).toContain('data-campaign-view="region"');
    expect(html).toContain('campaign-mission-board');
    expect(html).toContain('campaign-mission-popover');
    expect(html).toContain('data-campaign-start-mission="main:1-50"');
    expect(html).not.toContain('campaign-mission-select-hint');
    expect(html).not.toContain('campaign-map-tabs');
    expect(html).not.toContain('data-campaign-map-tab');
    expect(html).not.toContain('campaign-map-progress-block');
    expect(html).toContain('campaign-map-title');
    expect(html).toContain('Stendra');
    expect(html).toContain('data-campaign-tooltip');
    expect(html).toContain('concluídas');
    expect(html).toContain('desbloqueadas');
    expect(html).toContain(getMapFlavorText('stendra'));
    expect(html).not.toContain('campaign-map-flavor');
    expect(html).toContain('Guardião das Esgotos');
    expect(html).toContain('campaign-mission-pin--pending');
    expect(html).toContain('campaign-mission-pin--main');
    expect(html).toContain('data-mission-map="stendra"');
    expect(html).not.toContain('data-phase-id="2-1"');
  });

  it('sem missão selecionada mostra hint e não abre popover', () => {
    const overview = buildOverview();
    const html = renderer.render(overview, 'stendra', null, 'region', {
      pendingMissionId: null,
    });

    expect(html).toContain('campaign-mission-select-hint');
    expect(html).not.toContain('campaign-mission-popover');
    expect(html).not.toContain('data-campaign-start-mission');
  });

  it('renderiza mapa-mundo com nós de região e tooltips', () => {
    const overview = buildOverview();
    const html = renderer.render(overview, 'stendra', null, 'world');

    expect(html).toContain('data-campaign-view="world"');
    expect(html).toContain('campaign-world-map');
    expect(html).toContain('data-campaign-world-map="stendra"');
    expect(html).toContain('data-campaign-world-map="gruftall"');
    expect(html).toContain('campaign-world-node--illustrated');
    expect(html).toContain('campaign-world-node-banner');
    expect(html).toContain('campaign_stendra_banner.png');
    expect(html).toContain('data-campaign-tooltip');
    expect(html).toContain(getMapFlavorText('stendra'));
    expect(html).toContain('campaign-map-panel--world');
    expect(html).not.toContain('campaign-map-tabs');
    expect(html).not.toContain('campaign-mission-board');
  });

  it('mostra banner de desbloqueio quando solicitado', () => {
    const overview = buildOverview();
    const html = renderer.renderMapPanel(overview.maps[0], '1-50', { showUnlockBanner: true });

    expect(html).toContain('campaign-unlock-banner');
    expect(html).toContain('Nova região');
  });

  it('mostra mensagem de mapa bloqueado no painel', () => {
    const overview = buildOverview();
    const lockedMap = overview.maps[1];
    const html = renderer.renderMapPanel(lockedMap, null);

    expect(html).toContain('campaign-map-locked');
    expect(html).toContain('Gruftall');
    expect(html).toContain('Guardião Elemental');
    expect(html).toContain('data-campaign-biome="ruins"');
  });
});
