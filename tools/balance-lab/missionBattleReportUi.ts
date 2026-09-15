/**
 * Painel Log | Estatísticas abaixo da arena — espelha o overlay do jogo.
 */
import type { SimBattleStatsSnapshot } from './combatSimCatalog';
import { formatBattleLogEntryHtml } from '../../src/presentation/components/BattleLogPresentation';
import {
  DAMAGE_ELEMENT_LABELS,
  DAMAGE_ELEMENTS,
  type DamageElement,
} from '../../src/domain/combat/DamageElement';

export type LabBattleStatsTab =
  | 'general'
  | 'damage'
  | 'healing'
  | 'taken'
  | 'mitigated'
  | 'crits';

const TABS: Array<{ id: LabBattleStatsTab; label: string }> = [
  { id: 'general', label: 'Geral' },
  { id: 'damage', label: 'Dano causado' },
  { id: 'healing', label: 'Cura realizada' },
  { id: 'taken', label: 'Dano sofrido' },
  { id: 'mitigated', label: 'Dano mitigado' },
  { id: 'crits', label: 'Críticos' },
];

let activeStatsTab: LabBattleStatsTab = 'general';
let lastStats: SimBattleStatsSnapshot | null = null;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatStat(value: number): string {
  return String(Math.max(0, Math.floor(value)));
}

function barPercent(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(4, Math.min(100, Math.round((value / max) * 100)));
}

export function renderBattleReportShellHtml(): string {
  return `
    <div class="mba-report" id="mba-report">
      <section class="mba-report-panel mba-report-log" aria-label="Log de batalha">
        <header class="mba-report-header">
          <h4>Log de batalha</h4>
        </header>
        <ul id="mba-battle-log" class="mba-battle-log"></ul>
        <p id="mba-battle-log-empty" class="lab-hint mba-report-empty">O log aparece ao iniciar a arena.</p>
      </section>
      <section class="mba-report-panel mba-report-stats" aria-label="Estatísticas de batalha">
        <header class="mba-report-header">
          <h4>Estatísticas de batalha</h4>
        </header>
        <div class="mba-stats-tabs" id="mba-stats-tabs" role="tablist">
          ${TABS.map(
            (tab) =>
              `<button type="button" class="mba-stats-tab${
                tab.id === activeStatsTab ? ' is-active' : ''
              }" data-mba-stats-tab="${tab.id}" role="tab">${escapeHtml(tab.label)}</button>`,
          ).join('')}
        </div>
        <div id="mba-battle-stats" class="mba-battle-stats"></div>
        <p id="mba-battle-stats-empty" class="lab-hint mba-report-empty">As estatísticas acumulam durante a luta.</p>
      </section>
    </div>`;
}

function renderBarRow(name: string, value: number, max: number): string {
  return `
    <div class="mba-stats-bar-row">
      <span class="mba-stats-bar-name">${escapeHtml(name)}</span>
      <div class="mba-stats-bar-track"><span class="mba-stats-bar-fill" style="width:${barPercent(value, max)}%"></span></div>
      <strong class="mba-stats-bar-value">${formatStat(value)}</strong>
    </div>`;
}

function renderRanking(
  title: string,
  rows: Array<{ name: string; value: number }>,
): string {
  const withValues = rows.filter((row) => row.value > 0);
  if (!withValues.length) return '';
  const sorted = [...withValues].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const max = sorted[0]?.value ?? 0;
  return `
    <section class="mba-stats-group">
      <h5 class="mba-stats-subtitle">${escapeHtml(title)}</h5>
      ${sorted.map((row) => renderBarRow(row.name, row.value, max)).join('')}
    </section>`;
}

function renderGeneral(stats: SimBattleStatsSnapshot): string {
  const elements = (
    Object.entries(stats.damageByElement) as Array<[DamageElement, number]>
  )
    .filter(([, amount]) => amount > 0)
    .map(
      ([element, amount]) => `
        <li class="mba-stats-row mba-stats-row--sub">
          <span>${DAMAGE_ELEMENT_LABELS[element]}</span>
          <strong>${formatStat(amount)}</strong>
        </li>`,
    )
    .join('');

  const heroCards = stats.heroes
    .map(
      (hero) => `
      <article class="mba-stats-hero-card">
        <header>
          <strong>${escapeHtml(hero.name)}</strong>
          <span>${formatStat(hero.basicAttackUses)} atk · ${formatStat(hero.skillUses)} skills</span>
        </header>
        <ul class="mba-stats-list">
          <li class="mba-stats-row mba-stats-row--sub"><span>Dano</span><strong>${formatStat(hero.damageDealt)}</strong></li>
          <li class="mba-stats-row mba-stats-row--sub"><span>Cura</span><strong>${formatStat(hero.healingDone)}</strong></li>
          <li class="mba-stats-row mba-stats-row--sub"><span>Sofrido</span><strong>${formatStat(hero.damageTaken)}</strong></li>
          <li class="mba-stats-row mba-stats-row--sub"><span>Mitigado</span><strong>${formatStat(hero.damageMitigated)}</strong></li>
          <li class="mba-stats-row mba-stats-row--sub"><span>Críticos</span><strong>${formatStat(hero.critCount)}</strong></li>
        </ul>
      </article>`,
    )
    .join('');

  const skillRows = stats.skills
    .slice(0, 12)
    .map(
      (skill) => `
      <li class="mba-stats-skill-row">
        <span class="mba-stats-skill-main">
          <strong>${escapeHtml(skill.skillName)}</strong>
          <span>${escapeHtml(skill.heroName)} · ${formatStat(skill.uses)}×</span>
        </span>
        <span class="mba-stats-skill-nums">
          ${skill.damageDealt > 0 ? `<strong>${formatStat(skill.damageDealt)}</strong> dmg` : ''}
          ${skill.healingDone > 0 ? `<strong>${formatStat(skill.healingDone)}</strong> cura` : ''}
        </span>
      </li>`,
    )
    .join('');

  return `
    <ul class="mba-stats-list">
      <li class="mba-stats-row"><span>Dano causado</span><strong>${formatStat(stats.damageDealt)}</strong></li>
      <li class="mba-stats-row"><span>Cura realizada</span><strong>${formatStat(stats.healingDone)}</strong></li>
      <li class="mba-stats-row"><span>Dano sofrido</span><strong>${formatStat(stats.damageTaken)}</strong></li>
      <li class="mba-stats-row"><span>Dano mitigado</span><strong>${formatStat(stats.damageMitigated)}</strong></li>
      <li class="mba-stats-row"><span>Críticos</span><strong>${formatStat(stats.critCount)}</strong></li>
    </ul>
    ${elements ? `<h5 class="mba-stats-subtitle">Dano por elemento</h5><ul class="mba-stats-list">${elements}</ul>` : ''}
    ${heroCards ? `<h5 class="mba-stats-subtitle">Por herói</h5><div class="mba-stats-heroes">${heroCards}</div>` : ''}
    ${skillRows ? `<h5 class="mba-stats-subtitle">Skills</h5><ul class="mba-stats-skill-list">${skillRows}</ul>` : ''}`;
}

function renderMetricTab(
  stats: SimBattleStatsSnapshot,
  totalPick: (hero: SimBattleStatsSnapshot['heroes'][number]) => number,
  elementPick: (
    hero: SimBattleStatsSnapshot['heroes'][number],
    element: DamageElement,
  ) => number,
  emptyLabel: string,
): string {
  if (!stats.heroes.length) {
    return `<p class="lab-hint">${escapeHtml(emptyLabel)}</p>`;
  }
  const total = renderRanking(
    'Total',
    stats.heroes.map((hero) => ({ name: hero.name, value: totalPick(hero) })),
  );
  const byElement = DAMAGE_ELEMENTS.map((element) =>
    renderRanking(
      DAMAGE_ELEMENT_LABELS[element],
      stats.heroes.map((hero) => ({ name: hero.name, value: elementPick(hero, element) })),
    ),
  ).join('');
  const content = `${total}${byElement}`.trim();
  return content || `<p class="lab-hint">${escapeHtml(emptyLabel)}</p>`;
}

function renderStatsBody(stats: SimBattleStatsSnapshot, tab: LabBattleStatsTab): string {
  switch (tab) {
    case 'damage':
      return renderMetricTab(
        stats,
        (h) => h.damageDealt,
        (h, el) => h.damageByElement[el],
        'Ainda sem dano causado nesta tentativa.',
      );
    case 'healing':
      return (
        renderRanking(
          'Cura',
          stats.heroes.map((h) => ({ name: h.name, value: h.healingDone })),
        ) || '<p class="lab-hint">Ainda sem cura nesta tentativa.</p>'
      );
    case 'taken':
      return renderMetricTab(
        stats,
        (h) => h.damageTaken,
        (h, el) => h.damageTakenByElement[el],
        'Ainda sem dano sofrido nesta tentativa.',
      );
    case 'mitigated':
      return renderMetricTab(
        stats,
        (h) => h.damageMitigated,
        (h, el) => h.damageMitigatedByElement[el],
        'Ainda sem mitigação nesta tentativa.',
      );
    case 'crits':
      return (
        renderRanking(
          'Críticos',
          stats.heroes.map((h) => ({ name: h.name, value: h.critCount })),
        ) || '<p class="lab-hint">Ainda sem críticos nesta tentativa.</p>'
      );
    default:
      return renderGeneral(stats);
  }
}

function paintLog(root: HTMLElement, messages: string[]): void {
  const list = root.querySelector<HTMLElement>('#mba-battle-log');
  const empty = root.querySelector<HTMLElement>('#mba-battle-log-empty');
  if (!list) return;

  if (!messages.length) {
    list.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  // Mais recente no topo, como no jogo
  list.innerHTML = [...messages]
    .reverse()
    .map((message) => `<li class="mba-battle-log-entry">${formatBattleLogEntryHtml(message)}</li>`)
    .join('');
}

function paintStats(root: HTMLElement, stats: SimBattleStatsSnapshot | null): void {
  const body = root.querySelector<HTMLElement>('#mba-battle-stats');
  const empty = root.querySelector<HTMLElement>('#mba-battle-stats-empty');
  if (!body) return;

  lastStats = stats;
  const hasData =
    Boolean(stats) &&
    (stats!.damageDealt > 0 ||
      stats!.healingDone > 0 ||
      stats!.damageTaken > 0 ||
      stats!.critCount > 0 ||
      stats!.heroes.length > 0);

  if (!stats || !hasData) {
    body.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  body.innerHTML = renderStatsBody(stats, activeStatsTab);

  root.querySelectorAll<HTMLButtonElement>('[data-mba-stats-tab]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.mbaStatsTab === activeStatsTab);
  });
}

export function paintBattleReport(
  root: HTMLElement,
  logMessages: string[] | undefined,
  stats: SimBattleStatsSnapshot | undefined,
): void {
  paintLog(root, logMessages ?? []);
  paintStats(root, stats ?? null);
}

export function bindBattleReportControls(root: HTMLElement): void {
  const report = root.querySelector<HTMLElement>('#mba-report');
  if (!report || report.dataset.bound === '1') return;
  report.dataset.bound = '1';

  report.querySelectorAll<HTMLButtonElement>('[data-mba-stats-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.mbaStatsTab as LabBattleStatsTab | undefined;
      if (!tab) return;
      activeStatsTab = tab;
      paintStats(root, lastStats);
    });
  });
}

export function resetBattleReportTab(): void {
  activeStatsTab = 'general';
  lastStats = null;
}
