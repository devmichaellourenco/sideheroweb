import { hideEquipmentTooltip } from '../components/EquipmentTooltipBinder';
import { hideInventoryGearTooltip } from '../components/InventoryGearTooltipBinder';
import { hideSkillChipTooltip } from '../components/SkillChipTooltipBinder';

export type DrawerCloseReason = 'backdrop' | 'button' | 'escape' | 'action';

export class SideDrawerController {
  private onCloseCallback: ((reason: DrawerCloseReason) => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
  ) {
    this.root.querySelectorAll('[data-drawer-close]').forEach((element) => {
      element.addEventListener('click', () => this.close('button'));
    });
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  getBody(): HTMLElement {
    return this.bodyEl;
  }

  open(title: string, onClose?: (reason: DrawerCloseReason) => void): HTMLElement {
    return this.renderShell(title, onClose, { resetBody: true });
  }

  prepare(title: string, onClose?: (reason: DrawerCloseReason) => void): HTMLElement {
    return this.renderShell(title, onClose, { resetBody: false });
  }

  private renderShell(
    title: string,
    onClose: ((reason: DrawerCloseReason) => void) | undefined,
    options: { resetBody: boolean },
  ): HTMLElement {
    if (onClose) {
      this.onCloseCallback = onClose;
    }

    this.titleEl.textContent = title;

    const wasOpen = this.isOpen();
    if (!wasOpen) {
      this.root.classList.remove('hidden');
      this.root.setAttribute('aria-hidden', 'false');
      this.bindEscape();
    }

    if (options.resetBody || !wasOpen) {
      this.bodyEl.innerHTML = '';
    }

    return this.bodyEl;
  }

  close(reason: DrawerCloseReason = 'action'): void {
    if (!this.isOpen()) return;

    hideEquipmentTooltip();
    hideSkillChipTooltip();
    hideInventoryGearTooltip();
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.unbindEscape();
    this.bodyEl.innerHTML = '';
    this.onCloseCallback?.(reason);
    this.onCloseCallback = null;
  }

  setNavVisible(options: { prev: boolean; next: boolean }): void {
    const prevBtn = this.root.querySelector('[data-hero-drawer-prev]') as HTMLButtonElement | null;
    const nextBtn = this.root.querySelector('[data-hero-drawer-next]') as HTMLButtonElement | null;
    if (prevBtn) prevBtn.disabled = !options.prev;
    if (nextBtn) nextBtn.disabled = !options.next;
  }

  private bindEscape(): void {
    this.escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.close('escape');
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  private unbindEscape(): void {
    if (!this.escapeHandler) return;
    document.removeEventListener('keydown', this.escapeHandler);
    this.escapeHandler = null;
  }
}
