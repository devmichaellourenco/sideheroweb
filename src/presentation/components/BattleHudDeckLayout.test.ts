import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('battle-hud-deck layout', () => {
  const html = readFileSync(
    resolve(__dirname, '../panel/panel.html'),
    'utf8',
  );

  it('separa cena (strip) do deck de HUD opaco abaixo', () => {
    expect(html).toContain('class="battle-field"');
    expect(html).toMatch(/<div class="battle-hud-deck"[^>]*><\/div>/);
    expect(html).toMatch(
      /battle-strip[\s\S]*strip-floor[\s\S]*<\/section>[\s\S]*battle-hud-deck/,
    );
    expect(html).toMatch(
      /battle-hud-deck[\s\S]*id="heroes-container"[\s\S]*id="enemy-container"/,
    );
  });

  it('mantém overlays e float fora do deck (irmãos na battle-field)', () => {
    expect(html).toContain('id="battle-float-layer"');
    expect(html).toContain('id="battle-victory-overlay"');
    expect(html).toContain('id="camp-campaign-map-root"');
    expect(html).toContain('id="battle-pause-overlay"');
    const deckOpen = html.indexOf('class="battle-hud-deck"');
    const deckClose = html.indexOf('>', deckOpen);
    const deckEnd = html.indexOf('</div>', deckClose);
    const deckInner = html.slice(deckClose + 1, deckEnd);
    expect(deckInner.trim()).toBe('');
  });
});
