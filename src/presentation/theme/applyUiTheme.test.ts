// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { applyUiTheme, readUiThemeFromDom, UI_THEME_ATTR } from './applyUiTheme';

describe('applyUiTheme', () => {
  it('grava data-ui-theme no elemento raiz', () => {
    const root = document.createElement('div');
    applyUiTheme('dark', root);
    expect(root.getAttribute(UI_THEME_ATTR)).toBe('dark');
    expect(readUiThemeFromDom(root)).toBe('dark');

    applyUiTheme('light', root);
    expect(readUiThemeFromDom(root)).toBe('light');
  });
});
