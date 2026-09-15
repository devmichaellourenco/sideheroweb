import { describe, expect, it, vi } from 'vitest';
import { bindBattleChromeLayout, formatPanelSheetTop } from './BattleChromeLayout';

describe('BattleChromeLayout', () => {
  it('arredonda a base do limite para cima', () => {
    expect(formatPanelSheetTop(212.4)).toBe('213px');
    expect(formatPanelSheetTop(-4)).toBe('0px');
  });

  it('registra e remove observadores ao desmontar', () => {
    const disconnect = vi.fn();
    const observe = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const setProperty = vi.fn();
    const boundary = {
      getBoundingClientRect: () => ({ top: 120, bottom: 168 }),
    } as HTMLElement;

    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe, disconnect })),
    );
    vi.stubGlobal('document', {
      documentElement: { style: { setProperty } },
    });
    vi.stubGlobal('window', { addEventListener, removeEventListener });

    const unbind = bindBattleChromeLayout(boundary);
    expect(observe).toHaveBeenCalledWith(boundary);
    expect(setProperty).toHaveBeenCalledWith('--panel-sheet-top', '168px');

    unbind();
    expect(disconnect).toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
