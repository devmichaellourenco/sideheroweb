const VISIBLE_KEY = 'sidehero_battle_log_visible';

export class BattleLogPanelController {
  private visible = false;

  constructor(
    private readonly overlay: HTMLElement,
    private readonly toggleBtn: HTMLButtonElement,
    closeBtn: HTMLButtonElement,
    options: { bindToggleButton?: boolean } = {},
  ) {
    this.visible = this.readVisiblePreference();
    if (options.bindToggleButton !== false) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
    closeBtn.addEventListener('click', () => this.hide());

    overlay.querySelectorAll('[data-battle-log-close]').forEach((element) => {
      element.addEventListener('click', () => this.hide());
    });

    this.applyVisibility();
  }

  private readVisiblePreference(): boolean {
    try {
      return sessionStorage.getItem(VISIBLE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeVisiblePreference(visible: boolean): void {
    try {
      sessionStorage.setItem(VISIBLE_KEY, visible ? '1' : '0');
    } catch {
      // sessionStorage indisponível
    }
  }

  toggle(): void {
    this.visible = !this.visible;
    this.writeVisiblePreference(this.visible);
    this.applyVisibility();
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.writeVisiblePreference(true);
    this.applyVisibility();
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.writeVisiblePreference(false);
    this.applyVisibility();
  }

  isVisible(): boolean {
    return this.visible;
  }

  private applyVisibility(): void {
    this.overlay.classList.toggle('hidden', !this.visible);
    this.overlay.setAttribute('aria-hidden', this.visible ? 'false' : 'true');
    this.toggleBtn.classList.toggle('action-icon-btn--active', this.visible);
    this.toggleBtn.setAttribute('aria-expanded', this.visible ? 'true' : 'false');
  }
}
