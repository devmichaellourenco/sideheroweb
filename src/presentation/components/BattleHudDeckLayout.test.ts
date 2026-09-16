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

  it('coloca combate em largura total, sistemas no palco central e menus no rodapé', () => {
    expect(html).toContain('class="app-combat-column"');
    expect(html).toContain('id="systems-dock-stage"');
    expect(html).toContain('class="systems-stage"');
    expect(html).not.toContain('id="systems-dock"');
    expect(html).toContain('class="actions app-shell-rail"');
    expect(html).not.toContain('data-systems-menu-icons');
    const stageStart = html.indexOf('id="systems-dock-stage"');
    const railStart = html.indexOf('class="actions app-shell-rail"');
    const modalRoot = html.indexOf('id="modal-root"');
    const drawerRoot = html.indexOf('id="hero-drawer-root"');
    const logRoot = html.indexOf('id="battle-log-overlay"');
    const statsRoot = html.indexOf('id="battle-stats-overlay"');
    expect(stageStart).toBeGreaterThan(-1);
    expect(logRoot).toBeGreaterThan(stageStart);
    expect(statsRoot).toBeGreaterThan(stageStart);
    expect(drawerRoot).toBeGreaterThan(stageStart);
    expect(modalRoot).toBeGreaterThan(stageStart);
    expect(railStart).toBeGreaterThan(modalRoot);
    for (const id of [
      'open-chest-btn',
      'open-heroes-btn',
      'open-formation-btn',
      'open-battle-log-btn',
      'open-battle-stats-btn',
      'open-campaign-btn',
      'open-shop-btn',
      'open-inventory-btn',
      'open-stash-btn',
      'open-forge-btn',
      'open-upgrades-btn',
      'open-achievements-btn',
      'open-settings-btn',
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(html.indexOf(`id="${id}"`)).toBeGreaterThan(railStart);
    }
    expect(html).not.toMatch(/id="open-battle-stats-btn"[^>]*\bhidden\b/);
  });
});
