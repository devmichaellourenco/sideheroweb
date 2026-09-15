import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

/** Variantes de clique de UI — arquivos em `public/audio/sfx/`. */
export type GameUiClickSfxId = 'menu' | 'confirm' | 'back';

export const GAME_UI_CLICK_SFX: Record<
  GameUiClickSfxId,
  { label: string; assetPath: string }
> = {
  menu: {
    label: 'Clique de menu',
    assetPath: ASSETS.audio.sfx.uiClickMenu,
  },
  confirm: {
    label: 'Clique de confirmar',
    assetPath: ASSETS.audio.sfx.uiClickConfirm,
  },
  back: {
    label: 'Clique de voltar/fechar',
    assetPath: ASSETS.audio.sfx.uiClickBack,
  },
};

export function getGameUiClickSfxPath(id: GameUiClickSfxId): string {
  return GAME_UI_CLICK_SFX[id].assetPath;
}

export function getGameUiClickSfxUrl(id: GameUiClickSfxId): string {
  return getAssetUrl(getGameUiClickSfxPath(id));
}
