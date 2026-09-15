import { MassRefundPreviewDto } from '../../application/dto/MassRefundPreviewDto';
import { renderImprovementResetConfirmContent } from './ImprovementResetConfirmPresentation';

export class ImprovementResetConfirmDialog {
  private resolve: ((confirmed: boolean) => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly acceptBtn: HTMLButtonElement,
  ) {
    this.root.querySelectorAll('[data-improvement-reset-confirm-cancel]').forEach((element) => {
      element.addEventListener('click', () => this.finish(false));
    });
    this.acceptBtn.addEventListener('click', () => this.finish(true));
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  open(heroName: string, preview: MassRefundPreviewDto): Promise<boolean> {
    if (this.resolve) {
      this.finish(false);
    }

    this.titleEl.textContent = 'Reset em massa';
    this.bodyEl.innerHTML = renderImprovementResetConfirmContent(heroName, preview);
    this.acceptBtn.textContent = preview.pointsRefunded > 0 ? 'Resetar' : 'Fechar';
    this.acceptBtn.disabled = preview.pointsRefunded <= 0;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.bindEscape();
    if (preview.pointsRefunded > 0) {
      this.acceptBtn.focus();
    }

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  private finish(confirmed: boolean): void {
    this.unbindEscape();
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.bodyEl.innerHTML = '';
    this.titleEl.textContent = '';
    this.acceptBtn.disabled = false;

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
