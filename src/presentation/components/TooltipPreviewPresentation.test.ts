import { describe, expect, it } from 'vitest';
import { renderTooltipPreviewImage } from './TooltipPreviewPresentation';

describe('TooltipPreviewPresentation', () => {
  it('renderiza preview com classe e altura controlada via CSS', () => {
    const html = renderTooltipPreviewImage('assets/gear/sword.png', 'Espada');

    expect(html).toContain('tooltip-preview');
    expect(html).toContain('tooltip-preview-image');
    expect(html).toContain('src="assets/gear/sword.png"');
    expect(html).toContain('alt="Espada"');
    expect(html).toContain('draggable="false"');
  });
});
