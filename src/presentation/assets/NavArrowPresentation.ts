import { ASSETS, getAssetUrl, imgTag } from './AssetCatalog';

export type NavArrowDirection = 'prev' | 'next' | 'down';

export function getNavArrowIconUrl(direction: NavArrowDirection): string {
  const path = direction === 'prev' ? ASSETS.ui.arrowPrev : ASSETS.ui.arrowNext;
  return getAssetUrl(path);
}

export function navArrowIconHtml(direction: NavArrowDirection, className = 'nav-arrow-icon'): string {
  const classes =
    direction === 'down' ? `${className} nav-arrow-icon--down` : className;
  return imgTag(getNavArrowIconUrl(direction), '', classes);
}

/** Preenche botões/spans estáticos do HTML com ícones de seta. */
export function mountNavArrowIcons(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-nav-arrow]').forEach((element) => {
    const direction = element.dataset.navArrow;
    if (direction !== 'prev' && direction !== 'next' && direction !== 'down') return;
    element.innerHTML = navArrowIconHtml(direction);
  });
}
