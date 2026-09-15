import { describe, expect, it } from 'vitest';
import type { CampaignMapDto, CampaignOverviewDto } from '../../application/dto/CampaignDto';
import {
  escapeHtml,
  renderCampaignOverviewTooltipContent,
  renderCampaignPath,
  renderCampaignViewToggle,
  renderCampaignWorldMap,
  renderCampaignWorldNodeBanner,
  renderMapProgressBar,
  renderMapRegionTooltipContent,
  renderPhasePreviewFooter,
} from './CampaignMapPresentation';

function phase(
  id: string,
  options: Partial<{
    unlocked: boolean;
    cleared: boolean;
    selected: boolean;
    playable: boolean;
    displayName: string;
    difficultyTier: number;
    waveCount: number;
    milestoneBoss: boolean;
    seasonFinale: boolean;
  }> = {},
) {
  const phaseNumber = Number.parseInt(id.split('-')[1] ?? '1', 10);
  return {
    id,
    displayName: options.displayName ?? `Fase ${id}`,
    waveCount: options.waveCount ?? 3,
    difficultyTier: options.difficultyTier ?? phaseNumber,
    unlocked: options.unlocked ?? false,
    cleared: options.cleared ?? false,
    selected: options.selected ?? false,
    playable: options.playable ?? false,
    milestoneBoss: options.milestoneBoss ?? id.endsWith('-50'),
    seasonFinale: options.seasonFinale ?? id === '4-50',
    actNumber: Math.min(5, Math.max(1, Math.ceil(phaseNumber / 10))),
    featuredEnemyTypes: ['goblin_raider'],
  };
}

function map(id: string, name: string, unlocked: boolean, phases: ReturnType<typeof phase>[]): CampaignMapDto {
  return {
    id,
    name,
    unlocked,
    phases,
    actScenes: phases
      .filter((entry, index, list) => list.findIndex((p) => p.actNumber === entry.actNumber) === index)
      .map((entry) => ({
        id: `${id}-act-${entry.actNumber}`,
        mapId: id,
        actNumber: entry.actNumber,
        title: `Cena ${entry.actNumber}`,
        recap: 'Recap',
        preview: 'Preview',
        imageAssetPath: null,
        unlocked,
        viewed: false,
      })),
  };
}

function overview(maps: CampaignMapDto[]): CampaignOverviewDto {
  return { id: 'apprentice', name: 'Ascensão de Nix', maps };
}

describe('CampaignMapPresentation — markup e tooltips', () => {
  it('escapeHtml evita injeção em atributos e conteúdo', () => {
    expect(escapeHtml('A&B')).toBe('A&amp;B');
    expect(escapeHtml('<img>')).toBe('&lt;img&gt;');
    expect(escapeHtml('"x"')).toBe('&quot;x&quot;');
  });

  it('renderCampaignViewToggle inclui tooltip no botão Mapa-mundo', () => {
    const html = renderCampaignViewToggle(overview([]), 'world');
    expect(html).toContain('campaign-view-toggle');
    expect(html).toContain('data-campaign-view="world"');
    expect(html).toContain('data-campaign-tooltip');
    expect(html).toContain('campaign-tooltip-progress');
  });

  it('renderCampaignWorldMap marca regiões bloqueadas com aria-disabled (mantém hover/tooltip)', () => {
    const html = renderCampaignWorldMap(
      overview([
        map('stendra', 'Stendra', true, [phase('1-1', { unlocked: true, playable: true })]),
        map('gruftall', 'Gruftall', false, [phase('2-1')]),
      ]),
      'stendra',
    );

    expect(html).toContain('campaign-world-map');
    expect(html).toContain('data-campaign-world-map="gruftall"');
    expect(html).toContain('campaign-world-node--locked');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('data-campaign-tooltip');
    expect(html).toContain('campaign-world-node--illustrated');
    expect(html).toContain('campaign_stendra_banner.png');
    expect(html).toContain('campaign_grutfall_banner.png');
    expect(html).toContain('campaign-world-node-banner__img');
    expect(renderCampaignWorldNodeBanner('gruftall')).toContain('campaign_grutfall_banner.png');
  });

  it('renderMapRegionTooltipContent orienta desbloqueio para regiões bloqueadas', () => {
    const lockedMap = map('gruftall', 'Gruftall', false, [phase('2-1')]);
    const html = renderMapRegionTooltipContent(lockedMap, 2);
    expect(html).toContain('Derrote');
    expect(html).toContain('desbloquear');
  });

  it('renderCampaignPath aplica classes de status e mantém title informativo', () => {
    const campaignMap = map('stendra', 'Stendra', true, [
      phase('1-1', { unlocked: true, cleared: true, playable: true }),
      phase('1-2', { unlocked: true, playable: true, selected: true }),
      phase('1-3', { unlocked: false, playable: false }),
      phase('1-50', { unlocked: true, playable: true, milestoneBoss: true, displayName: 'Saci' }),
    ]);

    const html = renderCampaignPath(campaignMap, 1, '1-2');
    expect(html).toContain('campaign-path');
    expect(html).toContain('data-phase-id="1-2"');
    expect(html).toContain('campaign-path-node--pending');
    expect(html).toContain('campaign-path-node--current');
    expect(html).toContain('campaign-path-node--locked');
    expect(html).toContain('title="Fase 1-2');
  });

  it('renderMapProgressBar mostra título/bioma e progresso só no tooltip', () => {
    const campaignMap = map('stendra', 'Stendra', true, [
      phase('1-1', { unlocked: true, cleared: true }),
      phase('1-2', { unlocked: true, selected: true }),
    ]);
    const html = renderMapProgressBar(campaignMap, 1);
    expect(html).toContain('campaign-map-header-main');
    expect(html).toContain('campaign-map-title');
    expect(html).toContain('Stendra');
    expect(html).toContain('data-campaign-tooltip');
    expect(html).toContain('concluídas');
    expect(html).toContain('desbloqueadas');
    expect(html).toContain('T1–50');
    expect(html).not.toContain('campaign-map-progress-block');
    expect(html).not.toContain('campaign-map-progress-meta');
  });

  it('renderPhasePreviewFooter mostra estado vazio e desabilita iniciar se não jogável', () => {
    const campaignMap = map('stendra', 'Stendra', true, [
      phase('1-1', { unlocked: true, playable: false, displayName: 'Bloqueada' }),
    ]);

    const empty = renderPhasePreviewFooter(campaignMap, 1, null);
    expect(empty).toContain('campaign-phase-preview--empty');

    const locked = renderPhasePreviewFooter(campaignMap, 1, '1-1');
    expect(locked).toContain('data-campaign-start-phase="1-1"');
    expect(locked).toContain('disabled');
  });

  it('renderCampaignOverviewTooltipContent renderiza progressbar acessível', () => {
    const campaign = overview([
      map('stendra', 'Stendra', true, [phase('1-1', { cleared: true, unlocked: true })]),
    ]);
    const html = renderCampaignOverviewTooltipContent(campaign);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="200"');
  });
});

