import { GearDto } from '../../application/dto/GameStateDto';
import { hideInventoryGearTooltip } from './InventoryGearTooltipBinder';
import {
  renderForgeFuseConfirmContent,
  renderForgeSalvageConfirmContent,
} from './DivineForgeConfirmPresentation';

export type ForgeSalvageConfirmInput = {
  kind: 'salvage';
  gear: GearDto;
  goldPreview: number;
};

export type ForgeFuseConfirmInput = {
  kind: 'fuse';
  gears: GearDto[];
  nextRarityLabel: string;
};

export type DivineForgeConfirmInput = ForgeSalvageConfirmInput | ForgeFuseConfirmInput;

export class DivineForgeConfirmDialog {
  private resolve: ((confirmed: boolean) => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly acceptBtn: HTMLButtonElement,
  ) {
    this.root.querySelectorAll('[data-forge-confirm-cancel]').forEach((element) => {
      element.addEventListener('click', () => this.finish(false));
    });
    this.acceptBtn.addEventListener('click', () => this.finish(true));
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  open(input: DivineForgeConfirmInput): Promise<boolean> {
    if (this.resolve) {
      this.finish(false);
    }

    hideInventoryGearTooltip(true);

    if (input.kind === 'salvage') {
      this.titleEl.textContent = 'Destruir por ouro';
      this.bodyEl.innerHTML = renderForgeSalvageConfirmContent(input.gear, input.goldPreview);
      this.acceptBtn.textContent = `Destruir (+${input.goldPreview} ouro)`;
      this.acceptBtn.className = 'forge-game-btn forge-game-btn--salvage forge-confirm-accept';
    } else {
      this.titleEl.textContent = 'Fundir itens';
      this.bodyEl.innerHTML = renderForgeFuseConfirmContent(input.gears, input.nextRarityLabel);
      this.acceptBtn.textContent = 'Fundir itens';
      this.acceptBtn.className = 'forge-game-btn forge-game-btn--fuse forge-confirm-accept';
    }

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
    this.acceptBtn.className = 'forge-game-btn forge-game-btn--fuse forge-confirm-accept';
    this.acceptBtn.textContent = 'Confirmar';

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
