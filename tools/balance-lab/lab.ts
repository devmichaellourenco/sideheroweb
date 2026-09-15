import {
  applyPreset,
  computeCombatant,
  createLabDocument,
  defaultEnemyInput,
  defaultHeroInput,
  listEnemyTypeOptions,
  listHeroClassOptions,
  parseLabDocument,
  toTsSnippet,
} from './compute';
import {
  defaultEnemyResists,
  ELEMENT_KEYS,
  LAB_DEFAULT_SKILL_RANK,
  mergeElemFlat,
  mergeElemPercent,
  mergePenetration,
  mergeResists,
  zeroElemFlat,
  zeroElemPercent,
  zeroPenetration,
  zeroResists,
} from './elemental';
import { catalogIdentityFor, resolveLabIdentity } from './identity';
import { OPEN_HERO_IN_SIMULATOR_EVENT, OPEN_ENEMY_IN_SIMULATOR_EVENT } from './navigation';
import type { OpenEnemyDetail } from './navigation';
import {
  initKeyboardShortcuts,
  parseHashDeepLink,
  applyEntityDeepLink,
  registerEntitySelector,
} from './deepLinks';
import {
  defaultFormulaConstants,
  FORMULA_FIELDS,
  FORMULA_GROUPS,
  mergeFormulaConstants,
} from './formulas';
import {
  buildHeroPassiveSlots,
  effectValueLabel,
  listAscensionOptions,
  resetPassiveSlotsToCatalog,
} from './passives';
import type {
  LabBreakdownSection,
  LabCombatantIdentity,
  LabCombatantInput,
  LabCombatantResult,
  LabEnemyRole,
  LabFormulaConstants,
  LabHeroClass,
  LabPassiveSlot,
  LabSide,
} from './types';
import { selectHeroByClass } from './heroCombatUi';
import { selectEnemyByType } from './enemyCombatUi';
import { selectGearById } from './gearItemsUi';
import { renderMissionsEditor, selectMission } from './missionBattlesUi';
import { selectShopById } from './shopUi';
import { selectUpgradeById } from './upgradeTreeUi';
import {
  bindSpriteFallback,
  enemyTriggerHtml,
  openEnemyPicker,
} from './enemyPicker';
import {
  bindWorkspaceGuards,
  hasWorkspaceDrafts,
  startWorkspaceVersionPolling,
  type BalanceLabTab,
} from './workspaceState';
import { mountTab, type LabTab as TabMountLabTab, type TabMountState } from './tabMount';

type PanelId = 'left' | 'right';
type LabTab = Extract<
  BalanceLabTab,
  'sim' | 'missions' | 'xp' | 'levels' | 'gear' | 'shops' | 'heroes' | 'enemies' | 'upgrades' | 'economy' | 'maintenance'
>;

const enemyOptions = listEnemyTypeOptions();
const heroClasses = listHeroClassOptions();

let mode: 'single' | 'compare' = 'single';
let left: LabCombatantInput = defaultHeroInput('knight', 10);
let right: LabCombatantInput = defaultEnemyInput('goblin_raider', 10, 'trash');
let formulas: LabFormulaConstants = defaultFormulaConstants();
let activeTab: LabTab = 'sim';
const tabMountState: TabMountState = {
  missions: false,
  xp: false,
  levels: false,
  gear: false,
  shops: false,
  heroes: false,
  enemies: false,
  upgrades: false,
  economy: false,
  maintenance: false,
};

const mainEl = document.getElementById('lab-main')!;
const modeSelect = document.getElementById('lab-mode') as HTMLSelectElement;
const ioJson = document.getElementById('io-json') as HTMLTextAreaElement;
const ioSnippet = document.getElementById('io-snippet') as HTMLTextAreaElement;
const statusEl = document.getElementById('lab-status')!;
const importFile = document.getElementById('import-file') as HTMLInputElement;

function setStatus(message: string, isError = false): void {
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', isError);
}

function setInput(id: PanelId, next: LabCombatantInput): void {
  if (id === 'left') left = next;
  else right = next;
}

function num(el: HTMLInputElement | null, fallback = 0): number {
  if (!el) return fallback;
  const v = Number(el.value);
  return Number.isFinite(v) ? v : fallback;
}

function readPassivesFromSide(): LabPassiveSlot[] | null {
  const root = document.getElementById('lab-passives-side');
  if (!root || !root.dataset.passiveOwner) return null;
  const slots: LabPassiveSlot[] = [];
  root.querySelectorAll('[data-passive-id]').forEach((card) => {
    const el = card as HTMLElement;
    const id = el.dataset.passiveId!;
    const name = el.dataset.passiveName ?? id;
    const sourceLabel = el.dataset.passiveSource ?? '';
    const enabled = (el.querySelector('[data-passive-enabled]') as HTMLInputElement).checked;
    const effects = Array.from(el.querySelectorAll('[data-effect-kind]')).map((input) => {
      const field = input as HTMLInputElement;
      return {
        kind: field.dataset.effectKind!,
        value: Number(field.value) || 0,
      };
    });
    slots.push({ id, name, sourceLabel, enabled, effects });
  });
  return slots;
}

function readNumAttr(root: HTMLElement, attr: string, key: string): number {
  return num(root.querySelector(`[${attr}="${key}"]`) as HTMLInputElement);
}

function readPanelForm(id: PanelId): LabCombatantInput {
  const root = document.getElementById(`panel-${id}`);
  const previous = id === 'left' ? left : right;
  if (!root) return previous;

  const kind = (root.querySelector('[data-field="kind"]') as HTMLSelectElement).value as LabSide;
  const level = Math.max(1, Math.floor(num(root.querySelector('[data-field="level"]') as HTMLInputElement, 1)));
  const label =
    (root.querySelector('[data-field="label"]') as HTMLInputElement).value.trim() ||
    (kind === 'hero' ? 'Herói' : 'Inimigo');

  const base: LabCombatantInput = {
    kind,
    label,
    level,
    str: Math.max(0, Math.floor(num(root.querySelector('[data-field="str"]') as HTMLInputElement))),
    dex: Math.max(0, Math.floor(num(root.querySelector('[data-field="dex"]') as HTMLInputElement))),
    int: Math.max(0, Math.floor(num(root.querySelector('[data-field="int"]') as HTMLInputElement))),
    baseAttack: num(root.querySelector('[data-field="baseAttack"]') as HTMLInputElement),
    baseDefense: num(root.querySelector('[data-field="baseDefense"]') as HTMLInputElement),
    baseMaxHealth: num(root.querySelector('[data-field="baseMaxHealth"]') as HTMLInputElement),
    gearAttack: num(root.querySelector('[data-field="gearAttack"]') as HTMLInputElement),
    gearDefense: num(root.querySelector('[data-field="gearDefense"]') as HTMLInputElement),
    gearHealth: num(root.querySelector('[data-field="gearHealth"]') as HTMLInputElement),
    attackPercent: num(root.querySelector('[data-field="attackPercent"]') as HTMLInputElement),
    defensePercent: num(root.querySelector('[data-field="defensePercent"]') as HTMLInputElement),
    healthPercent: num(root.querySelector('[data-field="healthPercent"]') as HTMLInputElement),
    physicalMeleeAspd: (root.querySelector('[data-field="physicalMeleeAspd"]') as HTMLInputElement)
      .checked,
    aspdBaseline: num(root.querySelector('[data-field="aspdBaseline"]') as HTMLInputElement),
    critChance: num(root.querySelector('[data-field="critChance"]') as HTMLInputElement),
    critDamage: num(root.querySelector('[data-field="critDamage"]') as HTMLInputElement),
    passives: previous.passives,
    ascensionId: previous.ascensionId ?? null,
    resists: mergeResists({
      fire: readNumAttr(root, 'data-resist', 'fire'),
      cold: readNumAttr(root, 'data-resist', 'cold'),
      lightning: readNumAttr(root, 'data-resist', 'lightning'),
      air: readNumAttr(root, 'data-resist', 'air'),
      allElemental: readNumAttr(root, 'data-resist', 'allElemental'),
    }),
    elementalDamagePercent: mergeElemPercent({
      fire: readNumAttr(root, 'data-elem-pct', 'fire'),
      cold: readNumAttr(root, 'data-elem-pct', 'cold'),
      lightning: readNumAttr(root, 'data-elem-pct', 'lightning'),
      air: readNumAttr(root, 'data-elem-pct', 'air'),
      allElemental: readNumAttr(root, 'data-elem-pct', 'allElemental'),
    }),
    elementalDamageFlat: mergeElemFlat({
      fire: readNumAttr(root, 'data-elem-flat', 'fire'),
      cold: readNumAttr(root, 'data-elem-flat', 'cold'),
      lightning: readNumAttr(root, 'data-elem-flat', 'lightning'),
      air: readNumAttr(root, 'data-elem-flat', 'air'),
    }),
    elementalPenetration: mergePenetration({
      fire: readNumAttr(root, 'data-pen', 'fire'),
      cold: readNumAttr(root, 'data-pen', 'cold'),
      lightning: readNumAttr(root, 'data-pen', 'lightning'),
      air: readNumAttr(root, 'data-pen', 'air'),
      allElemental: readNumAttr(root, 'data-pen', 'allElemental'),
    }),
    physicalDamagePercent: num(
      root.querySelector('[data-field="physicalDamagePercent"]') as HTMLInputElement,
    ),
    identity: readIdentityFromPanel(root, previous),
  };

  if (kind === 'hero') {
    base.heroClass = (root.querySelector('[data-field="heroClass"]') as HTMLSelectElement)
      .value as LabHeroClass;
    const ascSel = root.querySelector('[data-field="ascensionId"]') as HTMLSelectElement | null;
    base.ascensionId = ascSel?.value ? ascSel.value : null;
  } else {
    base.enemyType = (root.querySelector('[data-field="enemyType"]') as HTMLInputElement).value;
    base.enemyRole = (root.querySelector('[data-field="enemyRole"]') as HTMLSelectElement)
      .value as LabEnemyRole;
    base.passives = [];
    base.ascensionId = null;
  }

  return base;
}

function readIdentityFromPanel(
  root: HTMLElement,
  previous: LabCombatantInput,
): LabCombatantIdentity {
  const fallback = resolveLabIdentity(previous);
  const read = (key: keyof LabCombatantIdentity): number => {
    const el = root.querySelector(`[data-identity="${key}"]`) as HTMLInputElement | null;
    if (!el) return fallback[key];
    const value = Number(el.value);
    return Number.isFinite(value) ? value : fallback[key];
  };
  return {
    basicAttackDamageRatio: read('basicAttackDamageRatio'),
    skillCooldownTurnSeconds: read('skillCooldownTurnSeconds'),
    attackSpeedFactor: read('attackSpeedFactor'),
    attackPerLevel: read('attackPerLevel'),
    defensePerLevel: read('defensePerLevel'),
    healthPerLevel: read('healthPerLevel'),
    levelUpAttackGain: read('levelUpAttackGain'),
    levelUpDefenseGain: read('levelUpDefenseGain'),
    levelUpHealthGain: read('levelUpHealthGain'),
  };
}

function readFormulasFromDom(): LabFormulaConstants {
  const root = document.getElementById('panel-formulas');
  if (!root) return formulas;
  const next = { ...formulas };
  for (const meta of FORMULA_FIELDS) {
    const input = root.querySelector(`[data-formula="${meta.key}"]`) as HTMLInputElement | null;
    if (input) next[meta.key] = Number(input.value) || 0;
  }
  return next;
}

function syncFromDom(): void {
  formulas = readFormulasFromDom();
  left = readPanelForm('left');
  if (mode === 'compare') {
    right = readPanelForm('right');
  }
  const side = document.getElementById('lab-passives-side');
  const owner = (side?.dataset.passiveOwner ?? '') as PanelId | '';
  const slots = readPassivesFromSide();
  if (slots && owner === 'left' && left.kind === 'hero') {
    left = { ...left, passives: slots };
  } else if (slots && owner === 'right' && right.kind === 'hero') {
    right = { ...right, passives: slots };
  }
}

function fmt(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '—';
  return digits > 0 ? n.toFixed(digits) : String(Math.round(n));
}

function deltaLine(a: number, b: number, label: string, digits = 0): string {
  const d = a - b;
  const sign = d > 0 ? '+' : '';
  return `${label}: ${sign}${fmt(d, digits)} (E ${fmt(a, digits)} vs D ${fmt(b, digits)})`;
}

function renderResults(id: PanelId, _input: LabCombatantInput): void {
  const box = document.getElementById(`results-${id}`);
  if (!box) return;
  box.innerHTML = '';
}

function renderTotalsBar(result: LabCombatantResult): void {
  const bar = document.getElementById('lab-totals');
  if (!bar) return;
  const cells: Array<[string, string, string]> = [
    ['ATK', fmt(result.attack), 'atk'],
    ['DEF', fmt(result.defense), 'def'],
    ['HP', fmt(result.maxHealth), 'hp'],
    ['ASPD /s', fmt(result.attackSpeed, 3), 'speed'],
    ['Hit básico', fmt(result.basicHit), 'atk'],
    ['DPS est.', fmt(result.estimatedBasicDps, 1), 'atk'],
    ['TTA', `${fmt(result.timeToAction, 2)}s`, 'speed'],
    ['Skills %', `${fmt(result.treeDamagePercent, 1)}%`, 'xp'],
  ];
  bar.innerHTML = `
    <div class="lab-totals-head">
      <h2 class="lab-panel-title">Totais<span>${result.label} · Lv.${result.level}</span></h2>
    </div>
    <div class="lab-totals-row">
      ${cells
        .map(
          ([label, value, tone]) => `
        <div class="lab-stat lab-stat--compact lab-stat--${tone}">
          <strong>${value}</strong>
          <span>${label}</span>
        </div>`,
        )
        .join('')}
    </div>
  `;
}

function liveSectionHtml(
  section: LabBreakdownSection,
  opts: { showFinal?: boolean } = {},
): string {
  const head = opts.showFinal
    ? `<div class="lab-live-head">
        <span class="lab-live-final"><span>${section.finalLabel}</span><strong>${section.finalValue}</strong></span>
      </div>`
    : '';
  return `
    <div class="lab-live">
      ${head}
      <ul class="lab-live-steps">
        ${section.steps
          .map(
            (step) => `
          <li>
            <div class="lab-live-step-main">
              <span class="lab-live-step-label">${step.label}</span>
              <span class="lab-live-step-detail">${step.detail}</span>
            </div>
            ${step.note ? `<span class="lab-live-step-note">${step.note}</span>` : ''}
          </li>`,
          )
          .join('')}
      </ul>
    </div>
  `;
}

function cardFinalHtml(label: string, value: string | number): string {
  return `<span class="lab-live-final"><span>${label}</span><strong>${value}</strong></span>`;
}

function sectionForGroup(
  groupId: string,
  result: LabCombatantResult,
): LabBreakdownSection | null {
  switch (groupId) {
    case 'atk':
      return result.breakdown.attack;
    case 'def':
      return result.breakdown.defense;
    case 'hp':
      return result.breakdown.health;
    case 'aspd':
      return result.breakdown.aspd;
    case 'resists':
      return result.breakdown.resists;
    case 'elemental':
      return result.breakdown.elemental;
    default:
      return null;
  }
}

let selectedSkillId: string | null = null;
let selectedSkillRank = LAB_DEFAULT_SKILL_RANK;

function skillDetailHtml(sample: LabCombatantResult['skillSamples'][number]): string {
  const catalogRows = sample.usesAttackStat
    ? `
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Ratio básico</span>
            <span class="lab-live-step-detail">${fmt(sample.attackFloorRatio, 3)}</span>
          </div>
          <span class="lab-live-step-note">Identidade do combatente: floor(ATK × ratio). Editável no painel Identidade.</span>
        </li>`
    : `
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Base da skill</span>
            <span class="lab-live-step-detail">${fmt(sample.basePower)}</span>
          </div>
          <span class="lab-live-step-note">basePower no catálogo de combate (HeroCombatSkillCatalog)</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">powerPerRank</span>
            <span class="lab-live-step-detail">${fmt(sample.powerPerRank)}</span>
          </div>
          <span class="lab-live-step-note">Ganho por nível da skill no catálogo · multiplica o Rank</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Fator</span>
            <span class="lab-live-step-detail">${fmt(sample.attributeFactor, 4)}</span>
          </div>
          <span class="lab-live-step-note">attributeFactor no catálogo · multiplica ${sample.scalingAttr.toUpperCase()}</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Attr (${sample.scalingAttr.toUpperCase()})</span>
            <span class="lab-live-step-detail">${fmt(sample.attrValue)}</span>
          </div>
          <span class="lab-live-step-note">Valor do Combatente (scaling da skill no SkillCatalog)</span>
        </li>`;

  return `
    <div class="lab-live">
      <ul class="lab-live-steps">
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Skill</span>
            <span class="lab-live-step-detail">${sample.name}</span>
          </div>
          <span class="lab-live-step-note">${sample.skillId}</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Elemento</span>
            <span class="lab-live-step-detail">${sample.elementLabel}</span>
          </div>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Rank</span>
            <span class="lab-live-step-detail">${sample.rank} / máx ${sample.maxRank}</span>
          </div>
          <span class="lab-live-step-note">Nível da skill — altere no campo Rank acima</span>
        </li>
        ${catalogRows}
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Recovery</span>
            <span class="lab-live-step-detail">${fmt(sample.actionRecoverySeconds, 2)}s</span>
          </div>
          <span class="lab-live-step-note">actionRecoverySeconds desta skill (escala com Cast Speed)</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">CD base</span>
            <span class="lab-live-step-detail">${fmt(sample.baseCooldownSeconds, 2)}s</span>
          </div>
          <span class="lab-live-step-note">${sample.cooldownTurns} turns × ${fmt(sample.skillCooldownTurnSeconds, 2)}s (identidade) · −${fmt(sample.cooldownSecondsPerRank, 2)}s/rank</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">CD no rank</span>
            <span class="lab-live-step-detail">${fmt(sample.effectiveCooldownSeconds, 2)}s</span>
          </div>
          <span class="lab-live-step-note">sem piso global · teto CDR ${(sample.maxCooldownReduction * 100).toFixed(0)}% · piso ${(sample.minCooldownReduction * 100).toFixed(0)}%</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Peso</span>
            <span class="lab-live-step-detail">${fmt(sample.weight, 3)}</span>
          </div>
          <span class="lab-live-step-note">weight do damageComponent (fração do raw neste elemento; 1 = 100%)</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Dano % elem</span>
            <span class="lab-live-step-detail">+${fmt(sample.elemPercent)}%</span>
          </div>
          <span class="lab-live-step-note">Combatente: Dano % do elemento + Dano % All (ou Dano % físico)</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Dano flat</span>
            <span class="lab-live-step-detail">+${fmt(sample.elemFlat)}</span>
          </div>
          <span class="lab-live-step-note">Combatente: Dano flat do elemento (0 no físico)</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Raw do catálogo</span>
            <span class="lab-live-step-detail">${fmt(sample.catalogRaw)}</span>
          </div>
          <span class="lab-live-step-note">Base×(powerPerRank×rank)×(attr×fator) — sobe com o Rank</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Piso vs básico</span>
            <span class="lab-live-step-detail">floor(ATK×${sample.attackFloorRatio}) = ${fmt(sample.attackFloor)}</span>
          </div>
          <span class="lab-live-step-note">${
            sample.cappedByAttackFloor
              ? 'Ativo: poder final no piso (skill não fica abaixo do ataque básico)'
              : 'Inativo: raw do catálogo já está acima do piso'
          }</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Raw final</span>
            <span class="lab-live-step-detail">${fmt(sample.rawPower)}</span>
          </div>
          <span class="lab-live-step-note">max(raw catálogo, piso vs ataque básico)</span>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Outgoing</span>
            <span class="lab-live-step-detail">${fmt(sample.outgoing)}</span>
          </div>
        </li>
        <li>
          <div class="lab-live-step-main">
            <span class="lab-live-step-label">Vs si mesmo</span>
            <span class="lab-live-step-detail">${fmt(sample.mitigatedVsSelf)}</span>
          </div>
        </li>
      </ul>
      ${
        sample.cappedByAttackFloor
          ? `<p class="lab-hint lab-hint--tight">Toda skill de dano tem piso ≥ ataque básico (ATK×${fmt(sample.attackFloorRatio, 3)} da identidade). Subir Rank só muda o final quando o raw do catálogo passa esse piso.</p>`
          : ''
      }
    </div>
  `;
}

function patchSkillPicker(result: LabCombatantResult): void {
  const select = document.getElementById('lab-skill-select') as HTMLSelectElement | null;
  const detail = document.getElementById('lab-skill-detail');
  const applied = document.querySelector<HTMLElement>('[data-applied-eq="elemental"]');
  if (!select || !detail) return;

  const samples = result.skillSamples;
  const ids = new Set(samples.map((s) => s.skillId));
  if (!selectedSkillId || !ids.has(selectedSkillId)) {
    selectedSkillId = samples[0]?.skillId ?? null;
  }

  const optionsHtml = samples.length
    ? samples
        .map(
          (s) =>
            `<option value="${s.skillId}" ${s.skillId === selectedSkillId ? 'selected' : ''}>${s.name} (${s.elementLabel})</option>`,
        )
        .join('')
    : `<option value="">Sem skills de dano</option>`;

  if (select.innerHTML !== optionsHtml) {
    const prev = select.value;
    select.innerHTML = optionsHtml;
    if (prev && ids.has(prev)) {
      select.value = prev;
      selectedSkillId = prev;
    } else if (selectedSkillId) {
      select.value = selectedSkillId;
    }
  } else if (selectedSkillId) {
    select.value = selectedSkillId;
  }

  const sample = samples.find((s) => s.skillId === selectedSkillId) ?? samples[0];
  if (!sample) {
    detail.innerHTML = `<p class="lab-hint lab-hint--tight">Nenhuma skill de dano para este combatente.</p>`;
    const cardFinal = document.querySelector<HTMLElement>('[data-card-final="elemental"]');
    if (cardFinal) cardFinal.innerHTML = '';
    if (applied) {
      applied.hidden = true;
      applied.textContent = '';
    }
    return;
  }

  const rankInput = document.getElementById('lab-skill-rank') as HTMLInputElement | null;
  if (rankInput) {
    rankInput.max = String(sample.maxRank);
    rankInput.value = String(sample.rank);
  }
  selectedSkillRank = sample.rank;

  detail.innerHTML = skillDetailHtml(sample);
  const cardFinal = document.querySelector<HTMLElement>('[data-card-final="elemental"]');
  if (cardFinal) cardFinal.innerHTML = cardFinalHtml(sample.name, sample.outgoing);
  if (applied) {
    applied.hidden = false;
    applied.textContent = sample.appliedEquation;
  }
}

function patchFormulaLive(result: LabCombatantResult): void {
  document.querySelectorAll<HTMLElement>('[data-live-section]').forEach((el) => {
    const id = el.dataset.liveSection ?? '';
    if (id === 'passives') {
      el.innerHTML = liveSectionHtml(result.breakdown.passives, { showFinal: true });
      return;
    }
    if (id === 'elemental') {
      return;
    }
    const section = sectionForGroup(id, result);
    if (section) el.innerHTML = liveSectionHtml(section);
  });
  document.querySelectorAll<HTMLElement>('[data-card-final]').forEach((el) => {
    const id = el.dataset.cardFinal ?? '';
    if (id === 'elemental') return;
    const section = sectionForGroup(id, result);
    if (!section) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = cardFinalHtml(section.finalLabel, section.finalValue);
  });
  document.querySelectorAll<HTMLElement>('[data-applied-eq]').forEach((el) => {
    const id = el.dataset.appliedEq ?? '';
    if (id === 'elemental') return;
    const section = sectionForGroup(id, result);
    if (!section?.appliedEquation) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = section.appliedEquation;
  });
  patchSkillPicker(result);
}

function refreshIo(): void {
  const doc = createLabDocument(mode, left, mode === 'compare' ? right : null, formulas);
  ioJson.value = JSON.stringify(doc, null, 2);
  ioSnippet.value = toTsSnippet(
    left,
    computeCombatant(left, formulas, selectedSkillRank),
    formulas,
  );
}

function refreshAll(): void {
  const focus = computeCombatant(left, formulas, selectedSkillRank);
  renderTotalsBar(focus);
  renderResults('left', left);
  if (mode === 'compare') {
    renderResults('right', right);
    const b = computeCombatant(right, formulas, selectedSkillRank);
    const delta = document.getElementById('compare-delta');
    if (delta) {
      delta.innerHTML = [
        deltaLine(focus.attack, b.attack, 'ATK'),
        deltaLine(focus.defense, b.defense, 'DEF'),
        deltaLine(focus.maxHealth, b.maxHealth, 'HP'),
        deltaLine(focus.estimatedBasicDps, b.estimatedBasicDps, 'DPS est.', 1),
        deltaLine(focus.attackSpeed, b.attackSpeed, 'ASPD', 3),
      ].join('<br>');
    }
  }
  patchFormulaLive(focus);
  refreshIo();
}

function field(
  name: string,
  label: string,
  type: 'number' | 'text' | 'checkbox',
  value: string | number | boolean,
  extra = '',
): string {
  if (type === 'checkbox') {
    return `<label class="lab-field ${extra}"><span class="lab-field-name">${label}</span>
      <input type="checkbox" data-field="${name}" ${value ? 'checked' : ''} /></label>`;
  }
  return `<label class="lab-field ${extra}"><span class="lab-field-name">${label}</span>
    <input type="${type}" data-field="${name}" value="${value}" ${type === 'number' ? 'step="any"' : ''} /></label>`;
}

function passivesHtml(input: LabCombatantInput): string {
  if (input.kind !== 'hero') {
    return `<p class="lab-hint">Passivas só para herói.</p>`;
  }
  const slots = input.passives ?? [];
  if (!slots.length) {
    return `<p class="lab-hint">Nenhuma passiva carregada.</p>`;
  }
  return `<div class="lab-passive-grid">${slots
    .map(
      (slot) => `
      <div class="lab-passive-card" data-passive-id="${slot.id}" data-passive-name="${slot.name}" data-passive-source="${slot.sourceLabel}">
        <div class="lab-passive-head">
          <label class="lab-passive-toggle">
            <input type="checkbox" data-passive-enabled ${slot.enabled ? 'checked' : ''} />
            <strong>${slot.name}</strong>
          </label>
          <span class="lab-muted">${slot.sourceLabel}</span>
        </div>
        <div class="lab-const-row">
          ${slot.effects
            .map(
              (effect) => `
            <label class="lab-const">
              <span class="lab-const-label">${effectValueLabel(effect.kind)}</span>
              <input type="number" step="any" data-effect-kind="${effect.kind}" value="${effect.value}" />
            </label>`,
            )
            .join('')}
        </div>
      </div>`,
    )
    .join('')}</div>`;
}

function elementalFieldsHtml(input: LabCombatantInput): string {
  const resists = mergeResists(input.resists);
  const pct = mergeElemPercent(input.elementalDamagePercent);
  const flat = mergeElemFlat(input.elementalDamageFlat);
  const pen = mergePenetration(input.elementalPenetration);
  const labels: Record<(typeof ELEMENT_KEYS)[number] | 'allElemental', string> = {
    fire: 'Fogo',
    cold: 'Gelo',
    lightning: 'Raio',
    air: 'Ar',
    allElemental: 'All elemental',
  };

  const resistRows = (['fire', 'cold', 'lightning', 'air', 'allElemental'] as const)
    .map(
      (key) => `
      <label class="lab-field">
        <span class="lab-field-name">Resist ${labels[key]}</span>
        <input type="number" step="any" data-resist="${key}" value="${resists[key]}" />
      </label>`,
    )
    .join('');

  const pctRows = (['fire', 'cold', 'lightning', 'air', 'allElemental'] as const)
    .map(
      (key) => `
      <label class="lab-field">
        <span class="lab-field-name">Dano % ${labels[key]}</span>
        <input type="number" step="any" data-elem-pct="${key}" value="${pct[key]}" />
      </label>`,
    )
    .join('');

  const flatRows = ELEMENT_KEYS.map(
    (key) => `
      <label class="lab-field">
        <span class="lab-field-name">Dano flat ${labels[key]}</span>
        <input type="number" step="any" data-elem-flat="${key}" value="${flat[key]}" />
      </label>`,
  ).join('');

  const penRows = (['fire', 'cold', 'lightning', 'air', 'allElemental'] as const)
    .map(
      (key) => `
      <label class="lab-field">
        <span class="lab-field-name">Pen % ${labels[key]}</span>
        <input type="number" step="any" data-pen="${key}" value="${pen[key]}" />
      </label>`,
    )
    .join('');

  return `
    <div class="lab-form-section">
      <h3 class="lab-form-section-title">Resistências</h3>
      <p class="lab-hint lab-hint--tight">Inimigo: preset do roster. Herói: tipicamente gear. Físico não usa resist.</p>
      <div class="lab-form-rows">${resistRows}</div>
    </div>
    <div class="lab-form-section">
      <h3 class="lab-form-section-title">Ataque elemental / físico</h3>
      <p class="lab-hint lab-hint--tight">% e flat amplificam skills do elemento; penetração reduz resist do alvo.</p>
      <div class="lab-form-rows">
        ${field('physicalDamagePercent', 'Dano % físico', 'number', input.physicalDamagePercent ?? 0)}
        ${pctRows}
        ${flatRows}
        ${penRows}
      </div>
    </div>
  `;
}

function identityFieldsHtml(input: LabCombatantInput): string {
  const identity = resolveLabIdentity(input);
  const source =
    input.kind === 'hero'
      ? `HeroCombatIdentityCatalog · ${input.heroClass ?? 'knight'}`
      : `EnemyCombatIdentityCatalog · ${input.enemyType ?? 'goblin_raider'}`;
  const rows: Array<[keyof LabCombatantIdentity, string, string]> = [
    ['basicAttackDamageRatio', 'Ratio básico', 'ATK × isto no ataque básico'],
    ['skillCooldownTurnSeconds', 's / turno CD', 'cooldownTurns × isto'],
    ['attackSpeedFactor', 'Fator ASPD', 'baseline × isto'],
    ['attackPerLevel', 'ATK / nível', '(nível − 1) × isto'],
    ['defensePerLevel', 'DEF / nível', '(nível − 1) × isto'],
    ['healthPerLevel', 'HP / nível', '(nível − 1) × isto'],
    ['levelUpAttackGain', 'Level-up ATK', 'ganho em Base ATK ao subir nível'],
    ['levelUpDefenseGain', 'Level-up DEF', 'ganho em Base DEF ao subir nível'],
    ['levelUpHealthGain', 'Level-up HP', 'ganho em Base HP ao subir nível'],
  ];
  return `
    <div class="lab-form-section">
      <h3 class="lab-form-section-title">Identidade de combate</h3>
      <p class="lab-hint lab-hint--tight">${source}. Mudar classe/tipo recarrega o catálogo; edite aqui para what-if.</p>
      <div class="lab-form-rows">
        ${rows
          .map(
            ([key, label, hint]) => `
          <label class="lab-field" title="${hint}">
            <span class="lab-field-name">${label}</span>
            <input type="number" step="any" data-identity="${key}" value="${identity[key]}" />
          </label>`,
          )
          .join('')}
      </div>
    </div>
  `;
}

function panelHtml(id: PanelId, input: LabCombatantInput, title: string): string {
  const heroOpts = heroClasses
    .map((c) => `<option value="${c}" ${input.heroClass === c ? 'selected' : ''}>${c}</option>`)
    .join('');
  const enemyType = input.enemyType ?? 'goblin_raider';
  const enemyPicker = enemyTriggerHtml({
    enemyId: enemyType,
    enemies: enemyOptions,
    openAction: 'open-sim-enemy-picker',
  });
  const roles: LabEnemyRole[] = ['trash', 'elite', 'boss'];
  const roleOpts = roles
    .map((r) => `<option value="${r}" ${input.enemyRole === r ? 'selected' : ''}>${r}</option>`)
    .join('');
  const ascOpts =
    input.kind === 'hero'
      ? [
          `<option value="" ${!input.ascensionId ? 'selected' : ''}>— só classe —</option>`,
          ...listAscensionOptions(input.heroClass ?? 'knight').map(
            (a) =>
              `<option value="${a.id}" ${input.ascensionId === a.id ? 'selected' : ''}>${'·'.repeat(a.depth)} ${a.name}</option>`,
          ),
        ].join('')
      : '';

  return `
    <section class="lab-panel" id="panel-${id}">
      <h2 class="lab-panel-title">${title}<span>${id === 'left' ? 'Esquerda / ativo' : 'Comparar'}</span></h2>
      <div class="lab-form-rows">
        <label class="lab-field">
          <span class="lab-field-name">Tipo</span>
          <select data-field="kind">
            <option value="hero" ${input.kind === 'hero' ? 'selected' : ''}>Herói</option>
            <option value="enemy" ${input.kind === 'enemy' ? 'selected' : ''}>Inimigo</option>
          </select>
        </label>
        ${field('label', 'Rótulo', 'text', input.label)}
        ${field('level', 'Level', 'number', input.level)}

        <label class="lab-field lab-hero-only" ${input.kind !== 'hero' ? 'hidden' : ''}>
          <span class="lab-field-name">Classe</span>
          <select data-field="heroClass">${heroOpts}</select>
        </label>
        <label class="lab-field lab-hero-only" ${input.kind !== 'hero' ? 'hidden' : ''}>
          <span class="lab-field-name">Ascensão</span>
          <select data-field="ascensionId">${ascOpts}</select>
        </label>
        <label class="lab-field lab-enemy-only" ${input.kind !== 'enemy' ? 'hidden' : ''}>
          <span class="lab-field-name">Tipo inimigo</span>
          <div class="lab-enemy-field">
            <input type="hidden" data-field="enemyType" value="${enemyType}" />
            ${enemyPicker}
          </div>
        </label>
        <label class="lab-field lab-enemy-only" ${input.kind !== 'enemy' ? 'hidden' : ''}>
          <span class="lab-field-name">Role</span>
          <select data-field="enemyRole">${roleOpts}</select>
        </label>

        ${field('str', 'STR', 'number', input.str)}
        ${field('dex', 'DEX', 'number', input.dex)}
        ${field('int', 'INT', 'number', input.int)}
        ${field('baseAttack', 'Base ATK', 'number', input.baseAttack)}
        ${field('baseDefense', 'Base DEF', 'number', input.baseDefense)}
        ${field('baseMaxHealth', 'Base HP', 'number', input.baseMaxHealth)}
        ${field('gearAttack', 'Gear ATK', 'number', input.gearAttack)}
        ${field('gearDefense', 'Gear DEF', 'number', input.gearDefense)}
        ${field('gearHealth', 'Gear HP', 'number', input.gearHealth)}
        ${field('attackPercent', 'ATK % gear', 'number', input.attackPercent)}
        ${field('defensePercent', 'DEF % gear', 'number', input.defensePercent)}
        ${field('healthPercent', 'HP % gear', 'number', input.healthPercent)}
        ${field('aspdBaseline', 'ASPD baseline', 'number', input.aspdBaseline ?? 0)}
        ${field('critChance', 'Crit chance', 'number', input.critChance ?? 0)}
        ${field('critDamage', 'Crit dmg', 'number', input.critDamage ?? 0)}
        ${field('physicalMeleeAspd', 'ASPD melee (STR)', 'checkbox', !!input.physicalMeleeAspd)}
      </div>

      ${identityFieldsHtml(input)}

      ${elementalFieldsHtml(input)}

      <div class="lab-actions-row">
        <button type="button" class="lab-btn--info" data-action="preset">Aplicar preset</button>
        <button type="button" class="lab-btn--primary" data-action="recalc">Recalcular</button>
      </div>
      <div class="lab-results" id="results-${id}"></div>
      ${id === 'left' && mode === 'compare' ? '<div class="lab-compare-delta" id="compare-delta"></div>' : ''}
    </section>
  `;
}

function formulasPanelHtml(): string {
  const passiveOwner = left.kind === 'hero' ? left : mode === 'compare' && right.kind === 'hero' ? right : null;
  const ownerId: PanelId | null =
    left.kind === 'hero' ? 'left' : mode === 'compare' && right.kind === 'hero' ? 'right' : null;

  const groupsHtml = FORMULA_GROUPS.map((group) => {
    if (group.id === 'elemental') {
      return `
    <article class="lab-formula-card lab-formula-card--skills" data-formula-group="${group.id}">
      <header class="lab-formula-card-head">
        <div class="lab-formula-card-title">
          <h3>${group.title}</h3>
          <div class="lab-formula-card-final" data-card-final="${group.id}"></div>
        </div>
        <p class="lab-formula-meaning">${group.meaning}</p>
      </header>
      <code class="lab-formula-eq">${group.equation}</code>
      <code class="lab-formula-eq lab-formula-eq--applied" data-applied-eq="${group.id}"></code>
      <label class="lab-field lab-skill-picker">
        <span class="lab-field-name">Skill</span>
        <select id="lab-skill-select"></select>
      </label>
      <label class="lab-field lab-skill-picker">
        <span class="lab-field-name">Rank</span>
        <input type="number" id="lab-skill-rank" min="1" step="1" value="${selectedSkillRank}" />
      </label>
      <div class="lab-live-host" id="lab-skill-detail" data-live-section="elemental"></div>
    </article>`;
    }

    return `
    <article class="lab-formula-card" data-formula-group="${group.id}">
      <header class="lab-formula-card-head">
        <div class="lab-formula-card-title">
          <h3>${group.title}</h3>
          <div class="lab-formula-card-final" data-card-final="${group.id}"></div>
        </div>
        <p class="lab-formula-meaning">${group.meaning}</p>
      </header>
      <code class="lab-formula-eq">${group.equation}</code>
      <code class="lab-formula-eq lab-formula-eq--applied" data-applied-eq="${group.id}"></code>
      <div class="lab-const-row">
        ${group.fields
          .map(
            (meta) => `
          <label class="lab-const" title="${meta.formulaHint}">
            <span class="lab-const-label">${meta.label}</span>
            <input type="number" step="any" data-formula="${meta.key}" value="${formulas[meta.key]}" />
            <span class="lab-const-hint">${meta.formulaHint}</span>
          </label>`,
          )
          .join('')}
      </div>
      <div class="lab-live-host" data-live-section="${group.id}"></div>
    </article>`;
  }).join('');

  return `
    <aside class="lab-panel lab-panel--formulas" id="panel-formulas">
      <div class="lab-side-head">
        <h2 class="lab-panel-title">Fórmulas e constantes<span>pesos globais + breakdown</span></h2>
        <button type="button" class="lab-btn--warn" id="btn-reset-formulas">Reset domínio</button>
      </div>

      <div class="lab-formula-grid">${groupsHtml}</div>

      <div class="lab-passives" id="lab-passives-side" data-passive-owner="${ownerId ?? ''}">
        <div class="lab-passives-head">
          <div>
            <h3>Passivas do herói</h3>
            ${
              passiveOwner && ownerId
                ? `<p class="lab-hint lab-hint--tight">Coeficientes de <strong>${passiveOwner.label}</strong> (${ownerId === 'left' ? 'ativo' : 'B'}). Ligue/desligue e ajuste os %.</p>`
                : `<p class="lab-hint lab-hint--tight">Selecione um herói no painel esquerdo para editar passivas.</p>`
            }
          </div>
          <button type="button" class="lab-btn--warn" id="btn-reset-passives" ${
            !passiveOwner ? 'disabled' : ''
          }>Reset catálogo</button>
        </div>
        <div class="lab-live-host lab-live-host--passives" data-live-section="passives"></div>
        ${passiveOwner && ownerId ? `<div data-passives-root>${passivesHtml(passiveOwner)}</div>` : ''}
      </div>
    </aside>
  `;
}

function wireLiveInputs(root: HTMLElement, onChange: () => void): void {
  root.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('change', onChange);
    if (el instanceof HTMLInputElement && (el.type === 'number' || el.type === 'text')) {
      el.addEventListener('input', onChange);
    }
  });
}

function wirePanel(id: PanelId): void {
  const root = document.getElementById(`panel-${id}`);
  if (!root) return;

  const kindSelect = root.querySelector('[data-field="kind"]') as HTMLSelectElement;
  const heroClassSelect = root.querySelector('[data-field="heroClass"]') as HTMLSelectElement | null;
  const ascensionSelect = root.querySelector('[data-field="ascensionId"]') as HTMLSelectElement | null;

  const toggleKindUi = (): void => {
    const isHero = kindSelect.value === 'hero';
    root.querySelectorAll('.lab-hero-only').forEach((el) => {
      (el as HTMLElement).hidden = !isHero;
    });
    root.querySelectorAll('.lab-enemy-only').forEach((el) => {
      (el as HTMLElement).hidden = isHero;
    });
  };

  kindSelect.addEventListener('change', () => {
    toggleKindUi();
    const current = readPanelForm(id);
    const next =
      current.kind === 'hero'
        ? {
            ...defaultHeroInput(current.heroClass ?? 'knight', current.level),
            label: current.label,
          }
        : {
            ...defaultEnemyInput(
              current.enemyType ?? 'goblin_raider',
              current.level,
              current.enemyRole ?? 'trash',
            ),
            label: current.label,
          };
    setInput(id, next);
    render();
  });

  const rebuildPassives = (): void => {
    const current = readPanelForm(id);
    if (current.kind !== 'hero') return;
    const heroClass = (heroClassSelect?.value as LabHeroClass) ?? 'knight';
    const ascensionId = ascensionSelect?.value || null;
    const next: LabCombatantInput = {
      ...current,
      heroClass,
      ascensionId,
      passives: buildHeroPassiveSlots(heroClass, ascensionId, current.passives),
    };
    if (heroClassSelect && current.heroClass !== heroClass) {
      const preset = defaultHeroInput(heroClass, current.level);
      next.str = preset.str;
      next.dex = preset.dex;
      next.int = preset.int;
      next.baseAttack = preset.baseAttack;
      next.baseDefense = preset.baseDefense;
      next.baseMaxHealth = preset.baseMaxHealth;
      next.physicalMeleeAspd = preset.physicalMeleeAspd;
      next.identity = preset.identity;
      next.passives = buildHeroPassiveSlots(heroClass, ascensionId);
    }
    setInput(id, next);
    render();
  };

  heroClassSelect?.addEventListener('change', rebuildPassives);
  ascensionSelect?.addEventListener('change', rebuildPassives);

  const enemyTypeInput = root.querySelector('[data-field="enemyType"]') as HTMLInputElement | null;
  root.querySelector('[data-action="open-sim-enemy-picker"]')?.addEventListener('click', () => {
    const current = readPanelForm(id);
    openEnemyPicker({
      enemies: enemyOptions,
      selectedId: current.enemyType ?? 'goblin_raider',
      onPick: (pickedId) => {
        const latest = readPanelForm(id);
        if (latest.kind !== 'enemy') return;
        const next = {
          ...latest,
          enemyType: pickedId,
          identity: catalogIdentityFor({ ...latest, enemyType: pickedId }),
          resists: defaultEnemyResists(pickedId, latest.level),
        };
        setInput(id, next);
        render();
      },
    });
  });

  root.querySelectorAll<HTMLImageElement>('img[data-enemy-thumb]').forEach(bindSpriteFallback);

  root.querySelector('[data-action="preset"]')?.addEventListener('click', () => {
    const current = readPanelForm(id);
    setInput(id, applyPreset(current));
    render();
    setStatus(`Preset aplicado (${id}).`);
  });

  root.querySelector('[data-action="recalc"]')?.addEventListener('click', () => {
    syncFromDom();
    refreshAll();
    setStatus('Recalculado.');
  });

  wireLiveInputs(root, () => {
    if (document.activeElement === kindSelect) return;
    if (document.activeElement === heroClassSelect) return;
    if (document.activeElement === ascensionSelect) return;
    if (document.activeElement === enemyTypeInput) return;
    syncFromDom();
    refreshAll();
  });
}

function wireFormulasPanel(): void {
  const root = document.getElementById('panel-formulas');
  if (!root) return;
  document.getElementById('btn-reset-formulas')?.addEventListener('click', () => {
    formulas = defaultFormulaConstants();
    render();
    setStatus('Pesos globais restaurados do domínio. Identidade fica no combatente.');
  });
  document.getElementById('btn-reset-passives')?.addEventListener('click', () => {
    syncFromDom();
    const side = document.getElementById('lab-passives-side');
    const owner = (side?.dataset.passiveOwner ?? '') as PanelId | '';
    if (owner === 'left' && left.kind === 'hero') {
      left = {
        ...left,
        passives: resetPassiveSlotsToCatalog(
          buildHeroPassiveSlots(left.heroClass ?? 'knight', left.ascensionId ?? null),
        ),
      };
    } else if (owner === 'right' && right.kind === 'hero') {
      right = {
        ...right,
        passives: resetPassiveSlotsToCatalog(
          buildHeroPassiveSlots(right.heroClass ?? 'knight', right.ascensionId ?? null),
        ),
      };
    }
    render();
    setStatus('Passivas restauradas do catálogo.');
  });

  const skillSelect = document.getElementById('lab-skill-select') as HTMLSelectElement | null;
  const skillRankInput = document.getElementById('lab-skill-rank') as HTMLInputElement | null;

  skillSelect?.addEventListener('change', () => {
    selectedSkillId = skillSelect.value || null;
    syncFromDom();
    refreshAll();
  });

  const onRankChange = (): void => {
    const max = Number(skillRankInput?.max || 99);
    selectedSkillRank = Math.max(1, Math.min(max, Math.floor(Number(skillRankInput?.value) || 1)));
    if (skillRankInput) skillRankInput.value = String(selectedSkillRank);
    syncFromDom();
    refreshAll();
  };
  skillRankInput?.addEventListener('change', onRankChange);
  skillRankInput?.addEventListener('input', onRankChange);

  wireLiveInputs(root, () => {
    if (document.activeElement === skillSelect) return;
    if (document.activeElement === skillRankInput) return;
    syncFromDom();
    refreshAll();
  });
}

function render(): void {
  mainEl.className = `lab-main lab-main--${mode}`;
  const totals = `<section class="lab-panel lab-totals" id="lab-totals"></section>`;
  if (mode === 'single') {
    mainEl.innerHTML = totals + panelHtml('left', left, 'Combatente') + formulasPanelHtml();
    wirePanel('left');
  } else {
    mainEl.innerHTML =
      totals +
      panelHtml('left', left, 'Combatente A') +
      panelHtml('right', right, 'Combatente B') +
      formulasPanelHtml();
    wirePanel('left');
    wirePanel('right');
  }
  wireFormulasPanel();
  refreshAll();
}

function applyDocument(raw: string): void {
  const doc = parseLabDocument(raw);
  mode = doc.mode;
  left = doc.left;
  right = doc.right ?? defaultEnemyInput('goblin_raider', left.level, 'trash');
  formulas = mergeFormulaConstants(doc.formulas);
  modeSelect.value = mode;
  render();
  setStatus(`Importado (${mode}) — ${doc.exportedAt ?? 'sem data'}.`);
}

function downloadJson(): void {
  syncFromDom();
  refreshIo();
  const blob = new Blob([ioJson.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `side-hero-balance-lab-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('JSON exportado (download).');
}

async function copyText(text: string, okMsg: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(okMsg);
  } catch {
    setStatus('Não foi possível copiar (permissão do navegador).', true);
  }
}

modeSelect.addEventListener('change', () => {
  syncFromDom();
  mode = modeSelect.value as 'single' | 'compare';
  render();
  setStatus(mode === 'compare' ? 'Modo lado a lado.' : 'Modo 1 combatente.');
});

document.getElementById('btn-export-json')?.addEventListener('click', () => {
  syncFromDom();
  refreshIo();
  downloadJson();
});

document.getElementById('btn-import-json')?.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    applyDocument(await file.text());
  } catch (err) {
    setStatus(err instanceof Error ? err.message : 'Falha no import', true);
  }
  importFile.value = '';
});

document.getElementById('btn-apply-json')?.addEventListener('click', () => {
  try {
    applyDocument(ioJson.value);
  } catch (err) {
    setStatus(err instanceof Error ? err.message : 'JSON inválido', true);
  }
});

document.getElementById('btn-copy-json')?.addEventListener('click', () => {
  syncFromDom();
  refreshIo();
  void copyText(ioJson.value, 'JSON copiado.');
});

document.getElementById('btn-copy-snippet')?.addEventListener('click', () => {
  syncFromDom();
  refreshIo();
  void copyText(ioSnippet.value, 'Snippet TS copiado.');
});

async function switchLabTab(tab: LabTab, entityKey?: string, entityValue?: string): Promise<void> {
  activeTab = tab;
  await mountTab(tab as TabMountLabTab, tabMountState, setStatus, entityKey, entityValue);
}

document.querySelectorAll<HTMLButtonElement>('[data-lab-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const tab = button.dataset.labTab as LabTab | undefined;
    if (!tab || tab === activeTab) return;
    void switchLabTab(tab);
  });
});

window.addEventListener('hashchange', () => {
  const parsed = parseHashDeepLink(window.location.hash);
  if (!parsed) return;
  const tab = parsed.tab as LabTab;
  const exists = document.querySelector(`[data-lab-tab="${tab}"]`);
  if (!exists) return;
  if (tab !== activeTab) {
    void switchLabTab(tab, parsed.entityKey, parsed.entityValue).then(() => {
      if (parsed.entityKey && parsed.entityValue) applyEntityDeepLink(parsed);
    });
  } else if (parsed.entityKey && parsed.entityValue) {
    applyEntityDeepLink(parsed);
  }
});

window.addEventListener(OPEN_HERO_IN_SIMULATOR_EVENT, (event) => {
  const heroClass = (event as CustomEvent<{ heroClass: string }>).detail.heroClass;
  if (!heroClasses.includes(heroClass as LabHeroClass)) return;
  left = defaultHeroInput(heroClass as LabHeroClass, 10);
  mode = 'single';
  modeSelect.value = mode;
  render();
  void switchLabTab('sim');
  setStatus(`${heroClass} carregado no Simulador no nível 10.`);
});

window.addEventListener(OPEN_ENEMY_IN_SIMULATOR_EVENT, (event) => {
  const { enemyType, level, role } = (event as CustomEvent<OpenEnemyDetail>).detail;
  const found = enemyOptions.find((opt) => opt.id === enemyType);
  if (!found) {
    setStatus(`Inimigo "${enemyType}" não encontrado no catálogo.`, true);
    return;
  }
  left = defaultEnemyInput(enemyType, level, role);
  mode = 'single';
  modeSelect.value = mode;
  render();
  void switchLabTab('sim');
  setStatus(`${enemyType} (${role}) Lv.${level} carregado no Simulador.`);
});

// Registrar seletores de entidade para deep-links
registerEntitySelector('enemies', (id) => { selectEnemyByType(id); });
registerEntitySelector('heroes', (cls) => { selectHeroByClass(cls); });
registerEntitySelector('gear', (id) => { selectGearById(id); });
registerEntitySelector('shops', (id) => { selectShopById(id); });
registerEntitySelector('upgrades', (id) => { selectUpgradeById(id); });
// Aceita missionId ou phaseTemplateId após o mount.
registerEntitySelector('missions', (id) => {
  void selectMission(id).then(() => renderMissionsEditor());
});

const labTabs: readonly LabTab[] = [
  'sim', 'missions', 'xp', 'levels', 'gear', 'shops', 'heroes', 'enemies', 'upgrades', 'economy', 'maintenance',
];

// Atalhos de teclado Alt+←/→ e Ctrl/Cmd+1..0
initKeyboardShortcuts({
  tabs: labTabs,
  getActiveTab: () => activeTab,
  onSwitchTab: (tab) => { void switchLabTab(tab as LabTab); },
});

bindWorkspaceGuards();
modeSelect.value = mode;
render();
setStatus('Lab pronto: identidade no combatente; pesos globais e passivas à direita.');

const initialParsed = parseHashDeepLink(window.location.hash);
if (initialParsed) {
  const initialTab = initialParsed.tab as LabTab;
  if (document.querySelector(`[data-lab-tab="${initialTab}"]`) && initialTab !== 'sim') {
    void switchLabTab(initialTab, initialParsed.entityKey, initialParsed.entityValue).then(() => {
      if (initialParsed.entityKey && initialParsed.entityValue) applyEntityDeepLink(initialParsed);
    });
  }
}

// ── Auto-reload: polling de versão do workspace ───────────────────────────────

const externalChangeBanner = document.getElementById('lab-external-change-banner');
const externalChangeMsg = document.getElementById('lab-external-change-msg');

function showExternalChangeBanner(hasDrafts: boolean): void {
  if (!externalChangeBanner) return;
  if (hasDrafts) {
    if (externalChangeMsg) {
      externalChangeMsg.textContent = '⚠ Mudança externa detectada. Você tem drafts não salvos — dados não foram recarregados.';
    }
    const reloadBtn = document.getElementById('btn-reload-data');
    if (reloadBtn) reloadBtn.hidden = true;
  } else {
    if (externalChangeMsg) {
      externalChangeMsg.textContent = '⚠ Mudança externa detectada nos arquivos de override.';
    }
    const reloadBtn = document.getElementById('btn-reload-data');
    if (reloadBtn) reloadBtn.hidden = false;
  }
  externalChangeBanner.hidden = false;
}

document.getElementById('btn-dismiss-banner')?.addEventListener('click', () => {
  if (externalChangeBanner) externalChangeBanner.hidden = true;
});

document.getElementById('btn-reload-data')?.addEventListener('click', () => {
  if (externalChangeBanner) externalChangeBanner.hidden = true;
  // Recarrega a aba ativa forçando re-mount
  const tab = activeTab;
  const reloadableTabs: Array<keyof TabMountState> = [
    'missions', 'xp', 'levels', 'gear', 'shops', 'heroes', 'enemies', 'upgrades', 'economy',
  ];
  if (reloadableTabs.includes(tab as keyof TabMountState)) {
    tabMountState[tab as keyof TabMountState] = false;
    void switchLabTab(tab);
  }
  setStatus('Dados recarregados.');
});

startWorkspaceVersionPolling((hasDrafts) => {
  showExternalChangeBanner(hasDrafts);
});
