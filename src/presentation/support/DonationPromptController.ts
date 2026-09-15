import { renderDonationCardContent } from './DonationCardPresentation';

export class DonationPromptController {
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly bodyEl: HTMLElement,
    private readonly supportBtn: HTMLButtonElement,
  ) {
    this.bodyEl.innerHTML = renderDonationCardContent();
    this.supportBtn.addEventListener('click', () => this.open());
    this.root.addEventListener('click', (event) => this.handleClick(event));
  }

  isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  open(): void {
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.supportBtn.setAttribute('aria-expanded', 'true');
    this.bindEscape();
    this.root.querySelector<HTMLElement>('[data-donation-open]')?.focus();
  }

  close(): void {
    this.unbindEscape();
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.supportBtn.setAttribute('aria-expanded', 'false');
    this.supportBtn.focus();
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (target.closest('[data-donation-dismiss]')) {
      event.preventDefault();
      this.close();
    }
  }

  private bindEscape(): void {
    this.escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.close();
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
