export type ToastType = 'chest' | 'level' | 'victory' | 'loot' | 'info' | 'idle';

export interface ToastOptions {
  onClick?: () => void;
  hint?: string;
  durationMs?: number;
}

const TOAST_DURATION_MS = 4200;
const IDLE_TOAST_DURATION_MS = 6500;
const MAX_VISIBLE_TOASTS = 4;
/** Distância (px) acima do cursor para o topo do toast. */
const OFFSET_ABOVE_CURSOR_PX = 40;
const EDGE_MARGIN_PX = 12;

export class ToastController {
  private lastPointerY = EDGE_MARGIN_PX + OFFSET_ABOVE_CURSOR_PX;

  constructor(private readonly root: HTMLElement) {
    const trackPointer = (event: PointerEvent): void => {
      this.lastPointerY = event.clientY;
    };
    window.addEventListener('pointermove', trackPointer, { passive: true });
    window.addEventListener('pointerdown', trackPointer, { passive: true });
  }

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}): void {
    while (this.root.children.length >= MAX_VISIBLE_TOASTS) {
      this.root.firstElementChild?.remove();
    }

    const toast = document.createElement('div');
    const clickable = Boolean(options.onClick);
    toast.className = `game-toast game-toast-${type}${clickable ? ' game-toast-clickable' : ''}`;

    const messageEl = document.createElement('span');
    messageEl.className = 'game-toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    if (options.hint) {
      const hintEl = document.createElement('span');
      hintEl.className = 'game-toast-hint';
      hintEl.textContent = options.hint;
      toast.appendChild(hintEl);
    }

    if (clickable && options.onClick) {
      toast.addEventListener('click', () => {
        options.onClick?.();
        toast.classList.remove('visible');
        window.setTimeout(() => toast.remove(), 280);
      });
    }

    toast.style.top = `${this.resolveTopForCursor()}px`;
    this.root.appendChild(toast);

    requestAnimationFrame(() => {
      this.clampToastWithinViewport(toast);
      toast.classList.add('visible');
    });

    const duration = options.durationMs ?? (type === 'idle' ? IDLE_TOAST_DURATION_MS : TOAST_DURATION_MS);

    window.setTimeout(() => {
      if (!toast.isConnected) return;
      toast.classList.remove('visible');
      window.setTimeout(() => toast.remove(), 280);
    }, duration);
  }

  private resolveTopForCursor(): number {
    return Math.max(EDGE_MARGIN_PX, this.lastPointerY - OFFSET_ABOVE_CURSOR_PX);
  }

  private clampToastWithinViewport(toast: HTMLElement): void {
    const height = toast.offsetHeight;
    const maxTop = Math.max(EDGE_MARGIN_PX, window.innerHeight - height - EDGE_MARGIN_PX);
    const desired = Number.parseFloat(toast.style.top) || EDGE_MARGIN_PX;
    toast.style.top = `${Math.min(Math.max(EDGE_MARGIN_PX, desired), maxTop)}px`;
  }
}
