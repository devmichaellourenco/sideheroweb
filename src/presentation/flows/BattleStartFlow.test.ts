import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { OVERLAY_ANIMATION_MS } from './BattleVictoryFlow';
import { BattleStartFlow } from './BattleStartFlow';

function createMockElement() {
  const classes = new Set<string>();
  let html = '';
  const listeners = new Map<string, EventListener>();

  return {
    classList: {
      add: (...items: string[]) => items.forEach((item) => classes.add(item)),
      remove: (...items: string[]) => items.forEach((item) => classes.delete(item)),
      contains: (item: string) => classes.has(item),
    },
    get innerHTML() {
      return html;
    },
    set innerHTML(value: string) {
      html = value;
    },
    querySelector(selector: string) {
      if (selector === '.battle-victory-compact-label') {
        return {
          addEventListener: (event: string, listener: EventListener) => {
            listeners.set(`label:${event}`, listener);
          },
        };
      }
      return null;
    },
    emitLabelAnimationEnd() {
      listeners.get('label:animationend')?.(new Event('animationend'));
    },
  };
}

describe('BattleStartFlow', () => {
  let overlay: ReturnType<typeof createMockElement>;
  let strip: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    vi.useFakeTimers();
    overlay = createMockElement();
    strip = createMockElement();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createFlow() {
    const renderer = {
      renderStart: (container: { innerHTML: string }) => {
        container.innerHTML =
          '<div data-victory-compact><span class="battle-victory-compact-label">START</span></div>';
      },
    };

    return new BattleStartFlow(
      overlay as unknown as HTMLElement,
      strip as unknown as HTMLElement,
      renderer as never,
    );
  }

  it('bloqueia avanço e chama onDismiss após animação', () => {
    const flow = createFlow();
    const onDismiss = vi.fn();

    flow.show(onDismiss);
    expect(flow.isBlockingAdvance()).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();

    overlay.emitLabelAnimationEnd();
    expect(flow.isActive()).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('fecha por timeout se animationend não disparar', () => {
    const flow = createFlow();
    const onDismiss = vi.fn();

    flow.show(onDismiss);
    vi.advanceTimersByTime(OVERLAY_ANIMATION_MS + 300);

    expect(flow.isActive()).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
