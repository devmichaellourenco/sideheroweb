import { hideEquipmentTooltip } from './EquipmentTooltipBinder';
import { hideInventoryGearTooltip } from './InventoryGearTooltipBinder';
import { hideSkillChipTooltip } from './SkillChipTooltipBinder';

export type ModalCloseReason = 'backdrop' | 'button' | 'escape' | 'action';

export class ModalController {
  private onCloseCallback: ((reason: ModalCloseReason) => void) | null = null;
  private onBackCallback: (() => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly titleEl: HTMLElement,
    private readonly bodyEl: HTMLElement,
  ) {
    this.root.querySelectorAll('[data-modal-close]').forEach((element) => {
      element.addEventListener('click', () => this.close('button'));
    });

    const backButton = this.root.querySelector('[data-modal-back]');
    backButton?.addEventListener('click', (event) => {
      event.preventDefault();
      this.onBackCallback?.();
    });
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  getBody(): HTMLElement {
    return this.bodyEl;
  }

  open(title: string, onClose?: (reason: ModalCloseReason) => void): HTMLElement {
    return this.renderShell(title, onClose, { resetBody: true });
  }

  /** Atualiza modal aberto sem limpar o body — evita interromper cliques em re-render. */
  prepare(title: string, onClose?: (reason: ModalCloseReason) => void): HTMLElement {
    return this.renderShell(title, onClose, { resetBody: false });
  }

  setTitle(title: string): void {
    this.titleEl.classList.remove('modal-title--rich');
    this.titleEl.textContent = title;
  }

  setTitleHtml(html: string): void {
    this.titleEl.classList.add('modal-title--rich');
    this.titleEl.innerHTML = html;
  }

  /** Elemento que recebe texto/HTML do título (pode ser `#modal-title-main`). */
  getTitleElement(): HTMLElement {
    return this.titleEl;
  }

  private renderShell(
    title: string,
    onClose: ((reason: ModalCloseReason) => void) | undefined,
    options: { resetBody: boolean },
  ): HTMLElement {
    if (onClose) {
      this.onCloseCallback = onClose;
    }

    this.setTitle(title);

    const wasOpen = this.isOpen();
    if (!wasOpen) {
      this.root.classList.remove('hidden');
      this.root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      this.bindEscape();
    }

    if (options.resetBody || !wasOpen) {
      this.bodyEl.innerHTML = '';
    }

    return this.bodyEl;
  }

  close(reason: ModalCloseReason = 'action'): void {
    if (!this.isOpen()) return;

    hideEquipmentTooltip();
    hideSkillChipTooltip();
    hideInventoryGearTooltip(true);
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    this.unbindEscape();
    this.bodyEl.innerHTML = '';
    this.setTitle('');
    this.onCloseCallback?.(reason);
    this.onCloseCallback = null;
  }

  setOnBack(callback: (() => void) | null): void {
    this.onBackCallback = callback;
  }

  setBackVisible(visible: boolean): void {
    const backButton = this.root.querySelector('[data-modal-back]') as HTMLElement | null;
    if (!backButton) return;
    backButton.classList.toggle('hidden', !visible);
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
