import { GameUiClickSfxId } from './GameSfxCatalog';

const BACK_SELECTOR = [
  '[data-modal-close]',
  '[data-drawer-close]',
  '.sheet-dismiss-btn',
  '.secondary-btn',
  '.settings-backup-btn--secondary',
  '.gear-unequip-btn',
  '[data-loot-keep]',
  '[data-loot-batch-keep]',
  '.forge-game-btn--salvage',
  '[data-skill-slot-clear]',
].join(', ');

const CONFIRM_SELECTOR = [
  '.primary-btn',
  '.combat-bar-btn--continue',
  '.gear-equip-btn',
  '.shop-buy-btn',
  '.forge-game-btn--fuse',
  '[data-victory-continue]',
  '[data-onboarding-ok]',
  '[data-loot-batch-equip]',
  '.battle-victory-continue-btn',
].join(', ');

const MENU_SELECTOR = [
  '.action-icon-btn',
  '.systems-menu-icon-btn',
  '.combat-bar-btn:not(.combat-bar-btn--continue)',
  '.filter-btn',
  '.settings-link-btn',
  '.party-btn',
  '.shop-refresh-btn',
  '.inventory-optimize-btn',
  '.upgrade-tree-focus-btn',
  '.campaign-act-scene-read-btn',
  '.campaign-view-toggle-btn',
  '.hero-mass-reset-btn',
  '.forge-clear-btn',
  'label.settings-item',
].join(', ');

function isDisabledControl(element: Element): boolean {
  if (element instanceof HTMLButtonElement) return element.disabled;
  if (element instanceof HTMLInputElement) return element.disabled;
  return false;
}

function matchesSelector(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function matchesAnySelector(element: Element, selector: string): boolean {
  if (matchesSelector(element, selector)) return true;
  try {
    return element.closest(selector) !== null;
  } catch {
    return false;
  }
}

/** Mapeia o alvo do clique para variante de SFX de UI, ou null se não tocar som. */
export function resolveUiClickSfx(target: EventTarget | null): GameUiClickSfxId | null {
  if (!(target instanceof Element)) return null;
  if (target.closest('#splash-screen-root, [data-no-ui-sfx], .battle-strip')) return null;

  const interactive = target.closest(
    'button, [role="button"], label.settings-item, a[href]',
  ) as Element | null;
  if (!interactive || isDisabledControl(interactive)) return null;

  if (matchesAnySelector(interactive, BACK_SELECTOR)) return 'back';
  if (matchesAnySelector(interactive, CONFIRM_SELECTOR)) return 'confirm';
  if (matchesAnySelector(interactive, MENU_SELECTOR)) return 'menu';

  if (interactive.matches('button, [role="button"]')) return 'menu';

  return null;
}
