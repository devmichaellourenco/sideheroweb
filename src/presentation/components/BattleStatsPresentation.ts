import { BattleSessionStatsDto, EnemyDto, GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { DAMAGE_ELEMENT_LABELS, DamageElement, DAMAGE_ELEMENTS } from '../../domain/combat/DamageElement';
import {
  formatActionTimeBarTooltip,
  resolveActionIntervalFromSpeed,
} from './ActionTimeBarPresentation';

export type BattleStatsTabId =
  | 'general'
  | 'damage'
  | 'healing'
  | 'taken'
  | 'mitigated'
  | 'crits';

const BATTLE_STATS_TABS: Array<{ id: BattleStatsTabId; label: string }> = [
  { id: 'general', label: 'Geral' },
  { id: 'damage', label: 'Dano causado' },
  { id: 'healing', label: 'Cura realizada' },
  { id: 'taken', label: 'Dano sofrido' },
  { id: 'mitigated', label: 'Dano mitigado' },
  { id: 'crits', label: 'Críticos' },
];

type HeroStatRow = BattleSessionStatsDto['heroes'][number];

function formatStat(value: number): string {
  return String(Math.max(0, Math.floor(value)));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function barPercent(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(4, Math.min(100, Math.round((value / max) * 100)));
}

function renderCadenceRows(
  party: readonly HeroDto[] | undefined,
  enemies: readonly EnemyDto[] | undefined,
): string {
  const heroRows = (party ?? [])
    .map((hero) => {
      const tta = resolveActionIntervalFromSpeed(hero.attackSpeed);
      return `
        <li class="battle-stats-row battle-stats-row--sub" title="${escapeHtml(formatActionTimeBarTooltip(hero.attackSpeed, hero.actionTimeRemaining, hero.actionTimeTotal))}">
          <span class="battle-stats-label">${escapeHtml(hero.name)}</span>
          <strong class="battle-stats-value">${hero.attackSpeed.toFixed(2)}/s · ${tta.toFixed(2)}s</strong>
        </li>`;
    })
    .join('');

  const enemyRows = (enemies ?? [])
    .map((enemy) => {
      const tta = resolveActionIntervalFromSpeed(enemy.attackSpeed);
      return `
        <li class="battle-stats-row battle-stats-row--sub" title="${escapeHtml(formatActionTimeBarTooltip(enemy.attackSpeed, enemy.actionTimeRemaining, enemy.actionTimeTotal))}">
          <span class="battle-stats-label">${escapeHtml(enemy.name)}</span>
          <strong class="battle-stats-value">${enemy.attackSpeed.toFixed(2)}/s · ${tta.toFixed(2)}s</strong>
        </li>`;
    })
    .join('');

  if (!heroRows && !enemyRows) {
    return '';
  }

  return `
    <h3 class="battle-stats-subtitle">Cadência (ASPD · TTA)</h3>
    <ul class="battle-stats-list">
      ${heroRows}
      ${enemyRows}
    </ul>
  `;
}

function renderGeneralRows(stats: BattleSessionStatsDto): string {
  const elements = (
    Object.entries(stats.damageByElement) as Array<[keyof typeof DAMAGE_ELEMENT_LABELS, number]>
  )
    .filter(([, amount]) => amount > 0)
    .map(
      ([element, amount]) => `
        <li class="battle-stats-row battle-stats-row--sub">
          <span class="battle-stats-label">${DAMAGE_ELEMENT_LABELS[element]}</span>
          <strong class="battle-stats-value">${formatStat(amount)}</strong>
        </li>`,
    )
    .join('');

  return `
    <ul class="battle-stats-list">
      <li class="battle-stats-row">
        <span class="battle-stats-label">Dano causado</span>
        <strong class="battle-stats-value">${formatStat(stats.damageDealt)}</strong>
      </li>
      <li class="battle-stats-row">
        <span class="battle-stats-label">Cura realizada</span>
        <strong class="battle-stats-value">${formatStat(stats.healingDone)}</strong>
      </li>
      <li class="battle-stats-row">
        <span class="battle-stats-label">Dano sofrido</span>
        <strong class="battle-stats-value">${formatStat(stats.damageTaken)}</strong>
      </li>
      <li class="battle-stats-row">
        <span class="battle-stats-label">Dano mitigado</span>
        <strong class="battle-stats-value">${formatStat(stats.damageMitigated)}</strong>
      </li>
      <li class="battle-stats-row">
        <span class="battle-stats-label">Críticos</span>
        <strong class="battle-stats-value">${formatStat(stats.critCount)}</strong>
      </li>
    </ul>
    ${
      elements
        ? `<h3 class="battle-stats-subtitle">Dano por elemento</h3><ul class="battle-stats-list">${elements}</ul>`
        : ''
    }
  `;
}

function renderHeroSection(stats: BattleSessionStatsDto): string {
  if (stats.heroes.length === 0) {
    return '<p class="battle-stats-empty">Ainda sem dados por herói nesta tentativa.</p>';
  }

  return stats.heroes
    .map((hero) => {
      const elementRows = (
        Object.entries(hero.damageByElement) as Array<[keyof typeof DAMAGE_ELEMENT_LABELS, number]>
      )
        .filter(([, amount]) => amount > 0)
        .map(
          ([element, amount]) => `
            <li class="battle-stats-row battle-stats-row--sub">
              <span class="battle-stats-label">${DAMAGE_ELEMENT_LABELS[element]}</span>
              <strong class="battle-stats-value">${formatStat(amount)}</strong>
            </li>`,
        )
        .join('');

      return `
        <article class="battle-stats-hero-card">
          <header class="battle-stats-hero-header">
            <strong>${escapeHtml(hero.name)}</strong>
            <span class="battle-stats-hero-uses">${formatStat(hero.basicAttackUses)} atk · ${formatStat(hero.skillUses)} skills</span>
          </header>
          <ul class="battle-stats-list battle-stats-list--compact">
            <li class="battle-stats-row battle-stats-row--sub">
              <span class="battle-stats-label">Dano</span>
              <strong class="battle-stats-value">${formatStat(hero.damageDealt)}</strong>
            </li>
            <li class="battle-stats-row battle-stats-row--sub">
              <span class="battle-stats-label">Cura</span>
              <strong class="battle-stats-value">${formatStat(hero.healingDone)}</strong>
            </li>
            <li class="battle-stats-row battle-stats-row--sub">
              <span class="battle-stats-label">Sofrido</span>
              <strong class="battle-stats-value">${formatStat(hero.damageTaken)}</strong>
            </li>
            <li class="battle-stats-row battle-stats-row--sub">
              <span class="battle-stats-label">Mitigado</span>
              <strong class="battle-stats-value">${formatStat(hero.damageMitigated)}</strong>
            </li>
            <li class="battle-stats-row battle-stats-row--sub">
              <span class="battle-stats-label">Críticos</span>
              <strong class="battle-stats-value">${formatStat(hero.critCount)}</strong>
            </li>
            ${elementRows}
          </ul>
        </article>`;
    })
    .join('');
}

function renderSkillSection(
  stats: BattleSessionStatsDto,
  party: readonly HeroDto[] | undefined,
): string {
  type SkillRow = BattleSessionStatsDto['skills'][number];
  const rowsByKey = new Map<string, SkillRow>();

  for (const skill of stats.skills) {
    rowsByKey.set(`${skill.heroId}:${skill.skillId}`, skill);
  }

  for (const hero of party ?? []) {
    for (const skill of hero.activeSkills ?? []) {
      if (!skill || skill.id === 'basic_attack') continue;
      const key = `${hero.id}:${skill.id}`;
      if (rowsByKey.has(key)) continue;

      const reload = skill.battleStats.find((entry) => entry.label === 'Recarga');
      rowsByKey.set(key, {
        heroId: hero.id,
        heroName: hero.name,
        skillId: skill.id,
        skillName: skill.name,
        uses: 0,
        damageDealt: 0,
        healingDone: 0,
        cooldownLabel: reload?.value ?? '—',
        cooldownTooltip:
          reload?.tooltipLines?.map((line) => line.text).join('\n') ??
          'Sem cálculo de recarga disponível.',
      });
    }
  }

  const rows = [...rowsByKey.values()].sort(
    (a, b) => b.damageDealt - a.damageDealt || b.healingDone - a.healingDone || b.uses - a.uses,
  );

  if (rows.length === 0) {
    return '<p class="battle-stats-empty">Ainda sem usos de skill nesta tentativa.</p>';
  }

  return `
    <ul class="battle-stats-list">
      ${rows
        .map(
          (skill) => `
        <li class="battle-stats-skill-row">
          <div class="battle-stats-skill-main">
            <strong class="battle-stats-skill-name">${escapeHtml(skill.skillName)}</strong>
            <span class="battle-stats-skill-meta">${escapeHtml(skill.heroName)} · ${formatStat(skill.uses)}x</span>
          </div>
          <div class="battle-stats-skill-nums">
            <span
              class="battle-stats-skill-cd"
              data-bar-label="${escapeHtml(skill.cooldownTooltip).replace(/\n/g, '&#10;')}"
              tabindex="0"
              title="${escapeHtml(skill.cooldownTooltip)}"
            >CD ${escapeHtml(skill.cooldownLabel)}</span>
            <span title="Dano">${formatStat(skill.damageDealt)} dmg</span>
            <span title="Cura">${formatStat(skill.healingDone)} cura</span>
          </div>
        </li>`,
        )
        .join('')}
    </ul>
  `;
}

function renderHeroBarRow(name: string, value: number, max: number): string {
  const pct = barPercent(value, max);
  return `
    <div class="battle-stats-bar-row">
      <span class="battle-stats-bar-name">${escapeHtml(name)}</span>
      <div class="battle-stats-bar-track" aria-hidden="true">
        <span class="battle-stats-bar-fill" style="width: ${pct}%"></span>
      </div>
      <strong class="battle-stats-bar-value">${formatStat(value)}</strong>
    </div>
  `;
}

function renderRankingGroup(
  title: string,
  rows: Array<{ name: string; value: number }>,
): string {
  const withValues = rows.filter((row) => row.value > 0);
  if (withValues.length === 0) return '';

  const sorted = [...withValues].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const max = sorted[0]?.value ?? 0;

  return `
    <section class="battle-stats-rank-group">
      <h3 class="battle-stats-subtitle">${escapeHtml(title)}</h3>
      <div class="battle-stats-rank-list">
        ${sorted.map((row) => renderHeroBarRow(row.name, row.value, max)).join('')}
      </div>
    </section>
  `;
}

function heroMetricRows(
  heroes: readonly HeroStatRow[],
  pick: (hero: HeroStatRow) => number,
): Array<{ name: string; value: number }> {
  return heroes.map((hero) => ({ name: hero.name, value: pick(hero) }));
}

function renderElementMetricTab(
  stats: BattleSessionStatsDto,
  totalPick: (hero: HeroStatRow) => number,
  elementPick: (hero: HeroStatRow, element: DamageElement) => number,
  emptyLabel: string,
): string {
  if (stats.heroes.length === 0) {
    return `<p class="battle-stats-empty">${escapeHtml(emptyLabel)}</p>`;
  }

  const totalGroup = renderRankingGroup('Total', heroMetricRows(stats.heroes, totalPick));
  const elementGroups = DAMAGE_ELEMENTS.map((element: DamageElement) =>
    renderRankingGroup(
      DAMAGE_ELEMENT_LABELS[element],
      heroMetricRows(stats.heroes, (hero) => elementPick(hero, element)),
    ),
  ).join('');

  const content = `${totalGroup}${elementGroups}`;
  return content.trim()
    ? content
    : `<p class="battle-stats-empty">${escapeHtml(emptyLabel)}</p>`;
}

function renderDamageTab(stats: BattleSessionStatsDto): string {
  return renderElementMetricTab(
    stats,
    (hero) => hero.damageDealt,
    (hero, element) => hero.damageByElement[element],
    'Ainda sem dano causado nesta tentativa.',
  );
}

function renderTakenTab(stats: BattleSessionStatsDto): string {
  return renderElementMetricTab(
    stats,
    (hero) => hero.damageTaken,
    (hero, element) => hero.damageTakenByElement[element],
    'Ainda sem dano sofrido nesta tentativa.',
  );
}

function renderMitigatedTab(stats: BattleSessionStatsDto): string {
  return renderElementMetricTab(
    stats,
    (hero) => hero.damageMitigated,
    (hero, element) => hero.damageMitigatedByElement[element],
    'Ainda sem dano mitigado nesta tentativa.',
  );
}

function renderMetricTab(
  stats: BattleSessionStatsDto,
  title: string,
  pick: (hero: HeroStatRow) => number,
  emptyLabel: string,
): string {
  if (stats.heroes.length === 0) {
    return `<p class="battle-stats-empty">${escapeHtml(emptyLabel)}</p>`;
  }

  const group = renderRankingGroup(title, heroMetricRows(stats.heroes, pick));
  return group || `<p class="battle-stats-empty">${escapeHtml(emptyLabel)}</p>`;
}

function renderTabsNav(activeTab: BattleStatsTabId): string {
  return `
    <nav class="battle-stats-tabs" role="tablist" aria-label="Categorias de estatísticas">
      ${BATTLE_STATS_TABS.map(
        (tab) => `
        <button
          type="button"
          class="battle-stats-tab${tab.id === activeTab ? ' battle-stats-tab--active' : ''}"
          role="tab"
          data-battle-stats-tab="${tab.id}"
          aria-selected="${tab.id === activeTab ? 'true' : 'false'}"
        >${escapeHtml(tab.label)}</button>`,
      ).join('')}
    </nav>
  `;
}

function renderTabPanel(id: BattleStatsTabId, activeTab: BattleStatsTabId, content: string): string {
  const hidden = id === activeTab ? '' : ' hidden';
  return `
    <div
      class="battle-stats-tab-panel${hidden}"
      role="tabpanel"
      data-battle-stats-tab-panel="${id}"
      ${id === activeTab ? '' : 'hidden'}
    >${content}</div>
  `;
}

export function renderBattleStatsPanel(
  stats: BattleSessionStatsDto,
  options: {
    live?: boolean;
    paused?: boolean;
    activeTab?: BattleStatsTabId;
    activeParty?: readonly HeroDto[];
    enemies?: readonly EnemyDto[];
  } = {},
): string {
  const activeTab = options.activeTab ?? 'general';
  const lead = options.live
    ? options.paused
      ? 'Totais da tentativa atual · batalha pausada (atualiza ao continuar).'
      : 'Totais da tentativa atual · atualizando em tempo real.'
    : 'Totais da tentativa atual de fase.';

  const generalContent = `
    ${renderGeneralRows(stats)}
    ${renderCadenceRows(options.activeParty, options.enemies)}
    <h3 class="battle-stats-subtitle">Por herói</h3>
    <div class="battle-stats-heroes">${renderHeroSection(stats)}</div>
    <h3 class="battle-stats-subtitle">Por skill</h3>
    ${renderSkillSection(stats, options.activeParty)}
  `;

  return `
    <section class="battle-stats-panel" aria-label="Estatísticas da batalha">
      <p class="battle-stats-lead">${lead}</p>
      ${renderTabsNav(activeTab)}
      ${renderTabPanel('general', activeTab, generalContent)}
      ${renderTabPanel('damage', activeTab, renderDamageTab(stats))}
      ${renderTabPanel(
        'healing',
        activeTab,
        renderMetricTab(
          stats,
          'Total',
          (hero) => hero.healingDone,
          'Ainda sem cura realizada nesta tentativa.',
        ),
      )}
      ${renderTabPanel('taken', activeTab, renderTakenTab(stats))}
      ${renderTabPanel('mitigated', activeTab, renderMitigatedTab(stats))}
      ${renderTabPanel(
        'crits',
        activeTab,
        renderMetricTab(
          stats,
          'Total',
          (hero) => hero.critCount,
          'Ainda sem críticos nesta tentativa.',
        ),
      )}
    </section>
  `;
}

export function renderBattleStatsBody(
  state: GameStateDto,
  activeTab: BattleStatsTabId = 'general',
): string {
  return renderBattleStatsPanel(state.battleSessionStats, {
    live: true,
    paused: state.battlePaused,
    activeTab,
    activeParty: state.activeParty,
    enemies: state.enemies,
  });
}

export { BATTLE_STATS_TABS };
