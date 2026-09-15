import { describe, expect, it, vi } from 'vitest';
import {
  bindBattleChromeLayout,
  formatBelowBattleTop,
  formatPanelSheetTop,
} from './BattleChromeLayout';

describe('BattleChromeLayout', () => {
  it('arredonda o topo do palco para cima', () => {
    expect(formatPanelSheetTop(212.4)).toBe('213px');
    expect(formatPanelSheetTop(-4)).toBe('0px');
  });

  it('ancora Log/Stats abaixo da battle-stage', () => {
    expect(formatBelowBattleTop(0, 400, 8)).toBe('408px');
    expect(formatBelowBattleTop(100, 10, 8)).toBe('0px');
  });

  it('registra e remove observadores ao desmontar o palco de sistemas', () => {
    const disconnect = vi.fn();
    const observe = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const setProperty = vi.fn();
    const systemsStage = {
      getBoundingClientRect: () => ({ top: 12, left: 0, width: 960, bottom: 660 }),
    } as HTMLElement;
    const battleStage = {
      getBoundingClientRect: () => ({ top: 80, left: 140, width: 666, bottom: 428 }),
    } as HTMLElement;

    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe, disconnect })),
    );
    vi.stubGlobal('document', {
      documentElement: { style: { setProperty } },
    });
    vi.stubGlobal('window', { addEventListener, removeEventListener });

    const layoutRoot = { id: 'app' } as HTMLElement;
    const unbind = bindBattleChromeLayout(systemsStage, layoutRoot, battleStage);
    expect(observe).toHaveBeenCalledWith(systemsStage);
    expect(observe).toHaveBeenCalledWith(layoutRoot);
    expect(observe).toHaveBeenCalledWith(battleStage);
    expect(setProperty).toHaveBeenCalledWith('--panel-sheet-top', '12px');
    expect(setProperty).toHaveBeenCalledWith('--systems-stage-left', '0px');
    expect(setProperty).toHaveBeenCalledWith('--systems-stage-width', '960px');
    expect(setProperty).toHaveBeenCalledWith('--systems-below-battle-top', '424px');

    unbind();
    expect(disconnect).toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
