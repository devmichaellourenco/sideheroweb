import { GearDto } from '../../application/dto/GameStateDto';
import { hideInventoryGearTooltip } from './InventoryGearTooltipBinder';
import { renderDestroyGearConfirmContent } from './DestroyGearConfirmPresentation';

export class DestroyGearConfirmDialog {
  private resolve: ((confirmed: boolean) => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly acceptBtn: HTMLButtonElement,
  ) {
    this.root.querySelectorAll('[data-destroy-confirm-cancel]').forEach((element) => {
      element.addEventListener('click', () => this.finish(false));
    });
    this.acceptBtn.addEventListener('click', () => this.finish(true));
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  open(gear: GearDto): Promise<boolean> {
    if (this.resolve) {
      this.finish(false);
    }

    hideInventoryGearTooltip(true);
    this.bodyEl.innerHTML = renderDestroyGearConfirmContent(gear);
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.bindEscape();
    this.acceptBtn.focus();

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  private finish(confirmed: boolean): void {
    this.unbindEscape();
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.bodyEl.innerHTML = '';

    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(confirmed);
  }

  private bindEscape(): void {
    this.escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.finish(false);
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
