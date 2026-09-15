import { getAssetUrl } from '../assets/AssetCatalog';
import { getCampaignScene, hasCampaignScene } from '../assets/CampaignSceneCatalog';

function clearSceneLayer(el: HTMLElement | null): void {
  el?.style.removeProperty('background-image');
}

function applyBattleFloor(
  stripFloor: HTMLElement | null | undefined,
  mapId: string,
  actNumber?: number | null,
): void {
  if (!stripFloor) return;

  const scene = hasCampaignScene(mapId) ? getCampaignScene(mapId, actNumber) : null;
  if (scene?.floorTile) {
    stripFloor.classList.add('strip-floor--tiled');
    stripFloor.dataset.mapId = mapId;
    stripFloor.style.setProperty(
      '--strip-floor-tile-image',
      `url('${getAssetUrl(scene.floorTile)}')`,
    );
    return;
  }

  stripFloor.classList.remove('strip-floor--tiled');
  stripFloor.removeAttribute('data-map-id');
  stripFloor.style.removeProperty('--strip-floor-tile-image');
}

function clearUnifiedScene(
  stripBg: HTMLElement,
  skyEl: HTMLElement | null,
  centerEl: HTMLElement | null,
  leftEl: HTMLElement | null,
  rightEl: HTMLElement | null,
): void {
  stripBg.classList.remove('strip-bg--scenic', 'strip-bg--unified');
  stripBg.removeAttribute('data-map-id');
  clearSceneLayer(skyEl);
  clearSceneLayer(centerEl);
  clearSceneLayer(leftEl);
  clearSceneLayer(rightEl);
  centerEl?.classList.remove('strip-bg__center--visible');
}

export function applyBattleScene(
  stripBg: HTMLElement,
  mapId: string,
  stripFloor?: HTMLElement | null,
  actNumber?: number | null,
): void {
  const skyEl = stripBg.querySelector<HTMLElement>('.strip-bg__sky');
  const centerEl = stripBg.querySelector<HTMLElement>('.strip-bg__center');
  const leftEl = stripBg.querySelector<HTMLElement>('.strip-bg__left');
  const rightEl = stripBg.querySelector<HTMLElement>('.strip-bg__right');
  if (!skyEl) return;

  if (!hasCampaignScene(mapId)) {
    clearUnifiedScene(stripBg, skyEl, centerEl, leftEl, rightEl);
    applyBattleFloor(stripFloor, mapId, actNumber);
    return;
  }

  const scene = getCampaignScene(mapId, actNumber)!;

  if (scene.battleBackground) {
    stripBg.classList.add('strip-bg--scenic', 'strip-bg--unified');
    stripBg.dataset.mapId = mapId;
    skyEl.style.backgroundImage = `url('${getAssetUrl(scene.battleBackground)}')`;
    clearSceneLayer(centerEl);
    clearSceneLayer(leftEl);
    clearSceneLayer(rightEl);
    centerEl?.classList.remove('strip-bg__center--visible');
    applyBattleFloor(stripFloor, mapId, actNumber);
    return;
  }

  if (!leftEl || !rightEl) return;

  stripBg.classList.add('strip-bg--scenic');
  stripBg.classList.remove('strip-bg--unified');
  stripBg.dataset.mapId = mapId;
  leftEl.style.backgroundImage = `url('${getAssetUrl(scene.battleLeft!)}')`;
  rightEl.style.backgroundImage = `url('${getAssetUrl(scene.battleRight!)}')`;

  if (scene.battleBackdrop && skyEl) {
    skyEl.style.backgroundImage = `url('${getAssetUrl(scene.battleBackdrop)}')`;
  } else {
    clearSceneLayer(skyEl);
  }

  if (scene.battleCenter && centerEl) {
    centerEl.style.backgroundImage = `url('${getAssetUrl(scene.battleCenter)}')`;
    centerEl.classList.add('strip-bg__center--visible');
  } else {
    clearSceneLayer(centerEl);
    centerEl?.classList.remove('strip-bg__center--visible');
  }

  applyBattleFloor(stripFloor, mapId, actNumber);
}
