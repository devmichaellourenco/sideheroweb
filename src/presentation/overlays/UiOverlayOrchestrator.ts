/**
 * Orquestra overlays exclusivos do painel: só um ativo por vez.
 * Prioridade (maior → menor): tutorial → cena → resultado de batalha → Wow.
 * Pedidos concorrentes entram na fila e sobem quando o ativo libera.
 *
 * `notifyIdle` é sempre adiado a um microtask para impedir reentrada síncrona
 * (release → onIdle → request → release → … → Maximum call stack size exceeded).
 */

export type UiOverlayKind = 'onboarding' | 'act_scene' | 'battle_result' | 'wow';

export const UI_OVERLAY_PRIORITY: Record<UiOverlayKind, number> = {
  onboarding: 400,
  act_scene: 300,
  battle_result: 200,
  wow: 100,
};

export type UiOverlayRequestId = string;

type QueuedOverlay = {
  kind: UiOverlayKind;
  id: UiOverlayRequestId;
  present: () => void;
};

export class UiOverlayOrchestrator {
  private active: QueuedOverlay | null = null;
  private readonly queue: QueuedOverlay[] = [];
  private readonly idleListeners: Array<() => void> = [];
  private idleNotifyScheduled = false;
  /** Evita present() reentrante no mesmo tick. */
  private presenting = false;

  getActiveKind(): UiOverlayKind | null {
    return this.active?.kind ?? null;
  }

  getActiveId(): UiOverlayRequestId | null {
    return this.active?.id ?? null;
  }

  isBusy(): boolean {
    return this.active !== null;
  }

  /** True se este kind pode iniciar agora (nada ativo, ou já é o ativo). */
  canPresent(kind: UiOverlayKind): boolean {
    if (!this.active) return true;
    return this.active.kind === kind;
  }

  /**
   * Pede foco para apresentar o overlay.
   * Se livre, chama `present` na hora. Senão enfileira (substitui pedido com o mesmo id).
   */
  request(kind: UiOverlayKind, id: UiOverlayRequestId, present: () => void): void {
    if (this.active?.id === id) {
      return;
    }

    const entry: QueuedOverlay = { kind, id, present };
    const queuedIndex = this.queue.findIndex((item) => item.id === id);
    if (queuedIndex >= 0) {
      this.queue[queuedIndex] = entry;
      return;
    }

    if (!this.active) {
      this.active = entry;
      this.runPresent(entry);
      return;
    }

    this.queue.push(entry);
    this.sortQueue();
  }

  /** Libera o overlay ativo (ou remove da fila se ainda não subiu). */
  release(
    kind: UiOverlayKind,
    id?: UiOverlayRequestId,
    options: { notifyIdle?: boolean } = {},
  ): void {
    if (this.active && this.active.kind === kind && (id == null || this.active.id === id)) {
      this.active = null;
      this.pump();
      if (options.notifyIdle !== false) {
        this.scheduleNotifyIdle();
      }
      return;
    }

    const index = this.queue.findIndex(
      (item) => item.kind === kind && (id == null || item.id === id),
    );
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
  }

  /** Remove todos os pedidos (fila + ativo) de um kind. */
  cancelKind(kind: UiOverlayKind): void {
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      if (this.queue[i]?.kind === kind) {
        this.queue.splice(i, 1);
      }
    }
    if (this.active?.kind === kind) {
      this.active = null;
      this.pump();
      this.scheduleNotifyIdle();
    }
  }

  onIdle(listener: () => void): void {
    this.idleListeners.push(listener);
  }

  /** Reordena a fila e tenta apresentar o próximo se estiver livre. */
  pump(): void {
    if (this.active || this.presenting) return;
    this.sortQueue();
    const next = this.queue.shift();
    if (!next) return;
    this.active = next;
    this.runPresent(next);
  }

  private runPresent(entry: QueuedOverlay): void {
    if (this.presenting) return;
    this.presenting = true;
    try {
      entry.present();
    } finally {
      this.presenting = false;
    }
    // present() pode ter feito release; retoma a fila após sair do present.
    if (!this.active) {
      this.pump();
    }
  }

  private sortQueue(): void {
    this.queue.sort((left, right) => {
      const byPriority = UI_OVERLAY_PRIORITY[right.kind] - UI_OVERLAY_PRIORITY[left.kind];
      if (byPriority !== 0) return byPriority;
      return 0;
    });
  }

  private scheduleNotifyIdle(): void {
    if (this.active || this.queue.length > 0) return;
    if (this.idleNotifyScheduled) return;
    this.idleNotifyScheduled = true;
    queueMicrotask(() => {
      this.idleNotifyScheduled = false;
      if (this.active || this.queue.length > 0) return;
      for (const listener of this.idleListeners) {
        listener();
      }
    });
  }
}
