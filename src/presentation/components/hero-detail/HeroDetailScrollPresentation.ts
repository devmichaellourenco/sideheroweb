export type HeroDetailScrollState = {
  skillsScrollTop: number | null;
  panelScrollTop: number | null;
};

function hasScrollTop(element: Element | null): element is Element & { scrollTop: number } {
  return Boolean(element && 'scrollTop' in element && typeof element.scrollTop === 'number');
}

export function captureHeroDetailScroll(container: HTMLElement): HeroDetailScrollState {
  const skillsScroll = container.querySelector('.hero-skills-tab-scroll');
  if (hasScrollTop(skillsScroll)) {
    return { skillsScrollTop: skillsScroll.scrollTop, panelScrollTop: null };
  }

  const panel = container.querySelector('.hero-detail-panel');
  return {
    skillsScrollTop: null,
    panelScrollTop: hasScrollTop(panel) ? panel.scrollTop : null,
  };
}

export function restoreHeroDetailScroll(container: HTMLElement, state: HeroDetailScrollState): void {
  if (state.skillsScrollTop !== null) {
    const skillsScroll = container.querySelector('.hero-skills-tab-scroll');
    if (hasScrollTop(skillsScroll)) {
      skillsScroll.scrollTop = state.skillsScrollTop;
    }
    return;
  }

  if (state.panelScrollTop !== null) {
    const panel = container.querySelector('.hero-detail-panel');
    if (hasScrollTop(panel)) {
      panel.scrollTop = state.panelScrollTop;
    }
  }
}
