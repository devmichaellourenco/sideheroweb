import { describe, expect, it } from 'vitest';
import {
  captureForgeGridScroll,
  restoreForgeGridScroll,
} from './ForgeGridScrollPresentation';

describe('ForgeGridScrollPresentation', () => {
  it('captura e restaura scrollTop do grid da forja', () => {
    const scroll = { scrollTop: 320, className: 'forge-grid-scroll' };
    const container = {
      querySelector: (selector: string) =>
        selector === '.forge-grid-scroll' ? scroll : null,
    } as unknown as HTMLElement;

    const captured = captureForgeGridScroll(container);
    scroll.scrollTop = 0;
    restoreForgeGridScroll(container, captured);

    expect(captured).toBe(320);
    expect(scroll.scrollTop).toBe(320);
  });

  it('ignora container sem grid scrollável', () => {
    const container = {
      querySelector: () => null,
    } as unknown as HTMLElement;

    expect(captureForgeGridScroll(container)).toBeNull();
    expect(() => restoreForgeGridScroll(container, 120)).not.toThrow();
  });
});
