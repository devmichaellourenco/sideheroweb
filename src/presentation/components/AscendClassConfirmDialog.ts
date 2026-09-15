import { AscensionOptionDto } from '../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../application/dto/GameStateDto';
import { hideAscensionPathCardTooltip } from './AscensionPathCardTooltipBinder';
import { hideAscensionMomentTooltip } from './HeroAscensionMomentTooltipBinder';
import { renderAscendClassConfirmContent } from './AscendClassConfirmPresentation';

export interface AscendClassConfirmData {
  hero: HeroDto;
  option: AscensionOptionDto;
  isUpgrade: boolean;
}

export class AscendClassConfirmDialog {
  private resolve: ((confirmed: boolean) => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly acceptBtn: HTMLButtonElement,
  ) {
    this.root.querySelectorAll('[data-ascend-confirm-cancel]').forEach((element) => {
      element.addEventListener('click', () => this.finish(false));
    });
    this.acceptBtn.addEventListener('click', () => this.finish(true));
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  open(data: AscendClassConfirmData): Promise<boolean> {
    if (this.resolve) {
      this.finish(false);
    }

    hideAscensionPathCardTooltip();
    hideAscensionMomentTooltip();
    this.titleEl.textContent = data.isUpgrade ? 'Confirmar evolução' : 'Confirmar ascensão';
    this.bodyEl.innerHTML = renderAscendClassConfirmContent(data.hero, data.option, data.isUpgrade);
    this.acceptBtn.textContent = data.isUpgrade ? 'Evoluir' : 'Seguir caminho';
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
    this.titleEl.textContent = '';

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
