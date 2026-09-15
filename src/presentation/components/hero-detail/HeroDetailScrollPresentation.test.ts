import { describe, expect, it } from 'vitest';
import { captureHeroDetailScroll, restoreHeroDetailScroll } from './HeroDetailScrollPresentation';

describe('HeroDetailScrollPresentation', () => {
  it('captura e restaura scroll da lista de skills', () => {
    const skillsScroll = { scrollTop: 180, className: 'hero-skills-tab-scroll' };
    const container = {
      querySelector: (selector: string) =>
        selector === '.hero-skills-tab-scroll' ? skillsScroll : null,
    } as unknown as HTMLElement;

    const state = captureHeroDetailScroll(container);
    skillsScroll.scrollTop = 0;

    restoreHeroDetailScroll(container, state);
    expect(skillsScroll.scrollTop).toBe(180);
  });

  it('captura e restaura scroll do painel quando não há lista de skills', () => {
    const panel = { scrollTop: 240, className: 'hero-detail-panel' };
    const container = {
      querySelector: (selector: string) =>
        selector === '.hero-skills-tab-scroll' ? null : selector === '.hero-detail-panel' ? panel : null,
    } as unknown as HTMLElement;

    const state = captureHeroDetailScroll(container);
    panel.scrollTop = 0;

    restoreHeroDetailScroll(container, state);
    expect(panel.scrollTop).toBe(240);
  });
});
