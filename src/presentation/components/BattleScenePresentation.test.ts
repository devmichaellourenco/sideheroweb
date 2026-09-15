// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import {
  actNumberFromPhaseId,
  getCampaignScene,
  hasCampaignBanner,
  hasCampaignScene,
} from '../assets/CampaignSceneCatalog';
import { applyBattleScene } from './BattleScenePresentation';

describe('CampaignSceneCatalog', () => {
  it('expõe cena de Stendra com fundo único', () => {
    expect(hasCampaignScene('stendra')).toBe(true);
    expect(getCampaignScene('stendra')).toEqual({
      battleBackground: 'campaign/stendra/cenario_stendra.jpeg',
      banner: 'campaign/stendra/campaign_stendra_banner.png',
    });
  });

  it('usa cenário por ato em Stendra (II–V)', () => {
    expect(getCampaignScene('stendra', 1)?.battleBackground).toBe(
      'campaign/stendra/cenario_stendra.jpeg',
    );
    expect(getCampaignScene('stendra', 2)?.battleBackground).toBe(
      'campaign/stendra/cenario_stendra_2.png',
    );
    expect(getCampaignScene('stendra', 3)?.battleBackground).toBe(
      'campaign/stendra/cenario_stendra_3.png',
    );
    expect(getCampaignScene('stendra', 4)?.battleBackground).toBe(
      'campaign/stendra/cenario_stendra_4.png',
    );
    expect(getCampaignScene('stendra', 5)?.battleBackground).toBe(
      'campaign/stendra/cenario_stendra_5.png',
    );
  });

  it('deriva ato a partir do phaseId', () => {
    expect(actNumberFromPhaseId('1-41')).toBe(5);
    expect(actNumberFromPhaseId('1-50')).toBe(5);
    expect(actNumberFromPhaseId('1-40')).toBe(4);
    expect(actNumberFromPhaseId(null)).toBeNull();
  });

  it('retorna null para mapas sem arte', () => {
    expect(hasCampaignScene('broken_sky')).toBe(false);
    expect(hasCampaignBanner('broken_sky')).toBe(false);
    expect(getCampaignScene('broken_sky')).toBeNull();
  });

  it('expõe cena de Gruftall com fundo único e banner', () => {
    expect(hasCampaignScene('gruftall')).toBe(true);
    expect(hasCampaignBanner('gruftall')).toBe(true);
    expect(getCampaignScene('gruftall')).toEqual({
      battleBackground: 'campaign/grutfall/cenario_grutfall.png',
      banner: 'campaign/grutfall/campaign_grutfall_banner.png',
    });
  });

  it('expõe cena de Morthaven com fundo único e banner', () => {
    expect(hasCampaignScene('morthaven')).toBe(true);
    expect(hasCampaignBanner('morthaven')).toBe(true);
    expect(getCampaignScene('morthaven')).toEqual({
      battleBackground: 'campaign/morthaven/cenario_morthaven.png',
      banner: 'campaign/morthaven/campaign_morthaven_banner.png',
    });
  });

  it('expõe cena de Valdris com fundo único e banner', () => {
    expect(hasCampaignScene('valdris')).toBe(true);
    expect(hasCampaignBanner('valdris')).toBe(true);
    expect(getCampaignScene('valdris')).toEqual({
      battleBackground: 'campaign/valdris/cenario_valdris.png',
      banner: 'campaign/valdris/campaign_valdris_banner.png',
    });
  });
});

function buildStripBg(): HTMLElement {
  const stripBg = document.createElement('div');
  stripBg.className = 'strip-bg';
  stripBg.innerHTML = `
    <div class="strip-bg__sky"></div>
    <div class="strip-bg__center"></div>
    <div class="strip-bg__left"></div>
    <div class="strip-bg__right"></div>
  `;
  return stripBg;
}

describe('applyBattleScene', () => {
  it('aplica imagem única de fundo para Stendra', () => {
    const stripBg = buildStripBg();
    const stripFloor = document.createElement('div');
    stripFloor.className = 'strip-floor';

    applyBattleScene(stripBg, 'stendra', stripFloor);

    expect(stripBg.classList.contains('strip-bg--scenic')).toBe(true);
    expect(stripBg.classList.contains('strip-bg--unified')).toBe(true);
    expect(stripBg.dataset.mapId).toBe('stendra');
    const sky = stripBg.querySelector('.strip-bg__sky') as HTMLElement;
    expect(sky.style.backgroundImage).toContain('cenario_stendra.jpeg');
    expect((stripBg.querySelector('.strip-bg__left') as HTMLElement).style.backgroundImage).toBe('');
    expect(stripFloor.classList.contains('strip-floor--tiled')).toBe(false);
  });

  it('aplica cenario_stendra_5 nas batalhas do Ato V', () => {
    const stripBg = buildStripBg();
    const stripFloor = document.createElement('div');
    stripFloor.className = 'strip-floor';

    applyBattleScene(stripBg, 'stendra', stripFloor, 5);

    const sky = stripBg.querySelector('.strip-bg__sky') as HTMLElement;
    expect(sky.style.backgroundImage).toContain('cenario_stendra_5.png');
  });

  it('aplica imagem única de fundo para Gruftall', () => {
    const stripBg = buildStripBg();
    const stripFloor = document.createElement('div');
    stripFloor.className = 'strip-floor';

    applyBattleScene(stripBg, 'gruftall', stripFloor);

    expect(stripBg.classList.contains('strip-bg--scenic')).toBe(true);
    expect(stripBg.classList.contains('strip-bg--unified')).toBe(true);
    expect(stripBg.dataset.mapId).toBe('gruftall');
    const sky = stripBg.querySelector('.strip-bg__sky') as HTMLElement;
    expect(sky.style.backgroundImage).toContain('cenario_grutfall.png');
    expect(stripFloor.classList.contains('strip-floor--tiled')).toBe(false);
  });

  it('aplica imagem única de fundo para Morthaven', () => {
    const stripBg = buildStripBg();
    const stripFloor = document.createElement('div');
    stripFloor.className = 'strip-floor';

    applyBattleScene(stripBg, 'morthaven', stripFloor);

    expect(stripBg.classList.contains('strip-bg--scenic')).toBe(true);
    expect(stripBg.classList.contains('strip-bg--unified')).toBe(true);
    expect(stripBg.dataset.mapId).toBe('morthaven');
    const sky = stripBg.querySelector('.strip-bg__sky') as HTMLElement;
    expect(sky.style.backgroundImage).toContain('cenario_morthaven.png');
    expect(stripFloor.classList.contains('strip-floor--tiled')).toBe(false);
  });

  it('aplica imagem única de fundo para Valdris', () => {
    const stripBg = buildStripBg();
    const stripFloor = document.createElement('div');
    stripFloor.className = 'strip-floor';

    applyBattleScene(stripBg, 'valdris', stripFloor);

    expect(stripBg.classList.contains('strip-bg--scenic')).toBe(true);
    expect(stripBg.classList.contains('strip-bg--unified')).toBe(true);
    expect(stripBg.dataset.mapId).toBe('valdris');
    const sky = stripBg.querySelector('.strip-bg__sky') as HTMLElement;
    expect(sky.style.backgroundImage).toContain('cenario_valdris.png');
    expect(stripFloor.classList.contains('strip-floor--tiled')).toBe(false);
  });

  it('remove modo cênico e chão tiled para mapas sem arte', () => {
    const stripBg = buildStripBg();
    stripBg.classList.add('strip-bg--scenic', 'strip-bg--unified');
    stripBg.dataset.mapId = 'stendra';
    const sky = stripBg.querySelector('.strip-bg__sky') as HTMLElement;
    sky.style.backgroundImage = 'url(test.png)';
    const stripFloor = document.createElement('div');
    stripFloor.className = 'strip-floor strip-floor--tiled';
    stripFloor.style.setProperty('--strip-floor-tile-image', "url('floor.png')");

    applyBattleScene(stripBg, 'broken_sky', stripFloor);

    expect(stripBg.classList.contains('strip-bg--scenic')).toBe(false);
    expect(stripBg.classList.contains('strip-bg--unified')).toBe(false);
    expect(stripBg.dataset.mapId).toBeUndefined();
    expect(sky.style.backgroundImage).toBe('');
    expect(stripFloor.classList.contains('strip-floor--tiled')).toBe(false);
    expect(stripFloor.style.getPropertyValue('--strip-floor-tile-image')).toBe('');
  });
});
