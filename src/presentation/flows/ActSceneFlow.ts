import { ActSceneDto } from '../../application/dto/CampaignDto';
import { renderActSceneOverlay } from '../components/ActScenePresentation';

export interface ActSceneFlowOptions {
  markViewedOnDismiss?: boolean;
  onDismiss?: () => void;
}

export class ActSceneFlow {
  private visible = false;
  private activeSceneId: string | null = null;
  private markViewedOnDismiss = false;
  private onDismiss: (() => void) | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly stage: HTMLElement,
    private readonly backdrop: HTMLElement,
  ) {
    this.stage.addEventListener('click', (event) => this.handleClick(event));
    this.backdrop.addEventListener('click', () => this.dismiss());
  }

  isBlocking(): boolean {
    return this.visible;
  }

  show(scene: ActSceneDto, options: ActSceneFlowOptions = {}): void {
    this.visible = true;
    this.activeSceneId = scene.id;
    this.markViewedOnDismiss = options.markViewedOnDismiss ?? false;
    this.onDismiss = options.onDismiss ?? null;

    this.stage.innerHTML = renderActSceneOverlay(scene);
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('act-scene-open');
  }

  dismiss(): void {
    if (!this.visible) return;

    this.visible = false;
    this.activeSceneId = null;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.stage.innerHTML = '';
    document.body.classList.remove('act-scene-open');

    const handler = this.onDismiss;
    this.onDismiss = null;
    this.markViewedOnDismiss = false;
    handler?.();
  }

  shouldMarkViewedOnDismiss(): boolean {
    return this.markViewedOnDismiss;
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('[data-act-scene-dismiss]')) {
      event.preventDefault();
      this.dismiss();
    }
  }
}
