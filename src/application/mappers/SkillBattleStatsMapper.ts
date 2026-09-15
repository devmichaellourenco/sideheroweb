import { resolveMapCombatIdentity } from '../../domain/campaign/MapCombatIdentityCatalog';
import {
  applyCooldownReduction,
  CombatProfileProvider,
} from '../../domain/combat/CombatProfileProvider';
import {
  buildHeroSkillPowerBreakdown,
  estimateHeroSkillThroughput,
  ThroughputBreakdownLine,
} from '../../domain/combat/DamageThroughputEstimate';
import { DAMAGE_ELEMENT_LABELS } from '../../domain/combat/DamageElement';
import { getHeroCombatIdentity } from '../../domain/combat/HeroCombatIdentityCatalog';
import {
  formatCooldownLabel,
  getCooldownSeconds,
  getInitialCooldownSeconds,
} from '../../domain/combat/SkillCooldownTiming';
import { Hero } from '../../domain/entities/Hero';
import { BASIC_ATTACK_SKILL_ID } from '../../domain/progression/combat/BasicAttackSkill';
import { getTargetPriorityPercent } from '../../domain/progression/combat/CombatSkillTargeting';
import { CombatSkillDefinition } from '../../domain/progression/combat/CombatSkillDefinition';
import { getHeroCombatSkill } from '../../domain/progression/combat/HeroCombatSkillCatalog';
import { SkillCombatKind } from '../../domain/progression/combat/SkillCombatKind';
import { SkillPowerCalculator } from '../../domain/progression/combat/SkillPowerCalculator';
import { resolveActionIntervalSeconds } from '../../domain/combat/CombatSpeedScaling';
import {
  HeroActiveSkillStatDto,
  HeroActiveSkillStatTooltipLineDto,
} from '../dto/GameStateDto';
import { SKILL_BRANCH_LABELS, SkillBranchDto, SkillScopeDto } from '../dto/SkillNodeDto';

const SCALING_LABELS: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
};

const SCOPE_LABELS: Record<SkillScopeDto, string> = {
  universal: 'Universal',
  class: 'Classe',
};

const KIND_LABELS: Record<SkillCombatKind, string> = {
  damage: 'Dano',
  heal_ally: 'Cura',
  buff_attack: 'Buff ATK',
  debuff_defense: 'Debuff DEF',
};

const combatProfiles = new CombatProfileProvider();

function toTooltipLines(lines: ThroughputBreakdownLine[]): HeroActiveSkillStatTooltipLineDto[] {
  return lines.map((line) => ({ text: line.text, icon: line.icon }));
}

function tip(...lines: HeroActiveSkillStatTooltipLineDto[]): HeroActiveSkillStatTooltipLineDto[] {
  return lines;
}

function formatDamageType(combat: CombatSkillDefinition): string {
  if (!combat.damageComponents?.length) {
    return KIND_LABELS.damage;
  }

  const labels = [
    ...new Set(combat.damageComponents.map((entry) => DAMAGE_ELEMENT_LABELS[entry.element])),
  ];
  return labels.join(' + ');
}

function formatTarget(combat: CombatSkillDefinition): string {
  const pool =
    combat.targetPool === 'enemies'
      ? combat.targetScope === 'all'
        ? 'Todos inimigos'
        : '1 inimigo'
      : combat.targetScope === 'all'
        ? 'Todos aliados'
        : '1 aliado';

  const priorityLabels: Record<CombatSkillDefinition['targetPriority'], string> = {
    lowest_hp: 'menor HP',
    lowest_hp_percent: 'menor HP%',
    highest_hp: 'maior HP',
    highest_hp_percent: 'maior HP%',
  };

  if (combat.targetScope === 'single') {
    const percent = getTargetPriorityPercent(combat);
    return `${pool} (${priorityLabels[combat.targetPriority]} · ${percent}%)`;
  }

  return pool;
}

function formatEffectiveCooldown(combat: CombatSkillDefinition, hero: Hero): string {
  const breakdown = describeHeroSkillCooldown(hero, combat.skillId, combat);
  return breakdown.label;
}

function buildTypeTooltip(combat: CombatSkillDefinition): HeroActiveSkillStatTooltipLineDto[] {
  if (combat.kind !== 'damage' || !combat.damageComponents?.length) {
    return tip(
      { text: `Categoria de combate: ${KIND_LABELS[combat.kind]}.` },
      { text: 'Define o papel da skill no motor de combate (dano, cura, buff ou debuff).' },
    );
  }

  return tip(
    { icon: 'rune', text: 'Elementos e entrega deste golpe:' },
    ...combat.damageComponents.map((component) => ({
      icon: 'attack' as const,
      text: `${DAMAGE_ELEMENT_LABELS[component.element]} · ${component.delivery} · peso ${(component.weight * 100).toFixed(0)}%`,
    })),
    {
      text: 'O peso divide o poder entre elementos antes dos bônus de gear.',
    },
  );
}

function buildTargetTooltip(combat: CombatSkillDefinition): HeroActiveSkillStatTooltipLineDto[] {
  const lines = tip(
    {
      icon: 'defense',
      text: `Pool: ${combat.targetPool === 'enemies' ? 'inimigos' : 'aliados'}`,
    },
    {
      text: `Alcance: ${combat.targetScope === 'all' ? 'todos no pool' : 'um único alvo'}`,
    },
  );

  if (combat.targetScope === 'single') {
    const percent = getTargetPriorityPercent(combat);
    lines.push({
      text: `Prioridade ${combat.targetPriority}: ${percent}% de chance de mirar o alvo preferido; senão outro aleatório do pool.`,
    });
  }

  return lines;
}

function buildCooldownTooltip(combat: CombatSkillDefinition, hero: Hero): HeroActiveSkillStatTooltipLineDto[] {
  return describeHeroSkillCooldown(hero, combat.skillId, combat).tooltipLines;
}

export interface HeroSkillCooldownBreakdown {
  label: string;
  effectiveSeconds: number;
  tooltipLines: HeroActiveSkillStatTooltipLineDto[];
  tooltipText: string;
}

/** Recarga efetiva + linhas do cálculo (level, turns, CDR) para UI de estatísticas. */
export function describeHeroSkillCooldown(
  hero: Hero,
  skillId: string,
  combatSkill?: CombatSkillDefinition | null,
): HeroSkillCooldownBreakdown {
  if (skillId === BASIC_ATTACK_SKILL_ID) {
    const profile = combatProfiles.forHero(hero);
    const interval = resolveActionIntervalSeconds(profile.attackSpeed);
    const tooltipLines = tip(
      { text: 'Ataque básico não usa recarga de skill.' },
      {
        icon: 'attack',
        text: `TTA = 1 ÷ ASPD ${profile.attackSpeed.toFixed(2)} = ${interval.toFixed(2)}s`,
      },
    );
    return {
      label: `TTA ${interval.toFixed(2)}s`,
      effectiveSeconds: interval,
      tooltipLines,
      tooltipText: tooltipLines.map((line) => line.text).join('\n'),
    };
  }

  const combat = combatSkill ?? getHeroCombatSkill(skillId);
  if (!combat) {
    const tooltipLines = tip({ text: 'Skill sem definição de combate.' });
    return {
      label: '—',
      effectiveSeconds: 0,
      tooltipLines,
      tooltipText: tooltipLines.map((line) => line.text).join('\n'),
    };
  }

  const rank = Math.max(1, hero.toProps().skillRanks[combat.skillId] ?? 1);
  const turnSeconds = getHeroCombatIdentity(hero.heroClass).skillCooldownTurnSeconds;
  const perRank = combat.cooldownSecondsPerRank ?? 0;
  const rawBase =
    combat.cooldownSeconds !== undefined
      ? Math.max(0, combat.cooldownSeconds)
      : Math.max(0, combat.cooldownTurns) * turnSeconds;
  const afterRank = rawBase - (rank - 1) * perRank;
  const baseSeconds = getCooldownSeconds(combat, { rank, turnSeconds });

  if (baseSeconds <= 0) {
    const tooltipLines = tip(
      { text: 'Esta ação não entra em recarga (ataque contínuo ou skill sem CD).' },
      { icon: 'attack', text: 'A taxa vem da velocidade de ataque do herói.' },
    );
    return {
      label: 'Sem recarga',
      effectiveSeconds: 0,
      tooltipLines,
      tooltipText: tooltipLines.map((line) => line.text).join('\n'),
    };
  }

  const profile = combatProfiles.forHero(hero);
  const effective = applyCooldownReduction(baseSeconds, profile.cooldownReduction, combat);
  const cdrPct = profile.cooldownReduction * 100;
  const cdrCap = combat.maxCooldownReduction !== undefined
    ? ` (teto da skill ${(combat.maxCooldownReduction * 100).toFixed(0)}%)`
    : '';

  const tooltipLines = tip(
    {
      icon: 'rune',
      text:
        combat.cooldownSeconds !== undefined
          ? `Base catálogo = ${rawBase.toFixed(2)}s`
          : `Base = ${combat.cooldownTurns} turns × ${turnSeconds}s (${hero.heroClass}) = ${rawBase.toFixed(2)}s`,
    },
    {
      text:
        rank <= 1
          ? `Level ${rank}: sem redução por level → ${baseSeconds.toFixed(2)}s`
          : `Level ${rank}: ${rawBase.toFixed(2)} − (${rank - 1} × ${perRank}s) = ${Math.max(0, afterRank).toFixed(2)}s`,
    },
    {
      icon: 'improvement',
      text: `CDR do equipamento = ${cdrPct.toFixed(1)}%${cdrCap}`,
    },
    {
      text: `Recarga efetiva = ${baseSeconds.toFixed(2)} × (1 − ${cdrPct.toFixed(1)}%) = ${effective.toFixed(2)}s`,
    },
    {
      icon: 'power_attack',
      text: `Cast speed ${profile.castSpeed.toFixed(2)}× afeta só o recovery pós-cast (ver DPS).`,
    },
  );

  const label =
    Math.abs(effective - baseSeconds) < 0.05
      ? formatCooldownLabel(effective)
      : `${formatCooldownLabel(effective)} (base ${formatCooldownLabel(baseSeconds)}, CDR ${cdrPct.toFixed(0)}%)`;

  return {
    label,
    effectiveSeconds: effective,
    tooltipLines,
    tooltipText: tooltipLines.map((line) => line.text).join('\n'),
  };
}

/** DPS alinhado ao combate: poder + bônus de gear + crit esperado + taxa (ASPD ou CD/CDR + recovery). */
function appendDamageThroughputStats(
  stats: HeroActiveSkillStatDto[],
  combat: CombatSkillDefinition,
  hero: Hero,
  powerCalculator: SkillPowerCalculator,
  mapId?: string,
): void {
  const mapIdentity = mapId ? resolveMapCombatIdentity(mapId) : null;
  const estimate = estimateHeroSkillThroughput(hero, combat, powerCalculator, combatProfiles, {
    targetResists: mapIdentity?.typicalTrashResists,
    stageLevel: hero.level,
  });
  if (!estimate) return;

  if (estimate.efficacyLabel && estimate.efficacyRatio !== null) {
    stats.push({
      label: 'Eficácia vs mapa',
      value: `${estimate.efficacyLabel} (${Math.round(estimate.efficacyRatio * 100)}%)`,
      emphasize: true,
      tooltipLines: tip(
        {
          text: mapIdentity
            ? `Vs resists típicas de ${mapIdentity.threatLabel}. Favorável: ${mapIdentity.favoredLabel}.`
            : 'Vs resists típicas da área atual.',
        },
        ...toTooltipLines(estimate.hitBreakdown.filter((line) => line.text.includes('Eficácia'))),
      ),
    });
  }

  if (estimate.effectiveCooldownSeconds === null) {
    stats.push({
      label: 'Dano/hit esperado',
      value: `~${estimate.expectedDamagePerHit.toFixed(1)} (poder × gear × crit)`,
      tooltipLines: toTooltipLines(estimate.hitBreakdown),
    });
    stats.push({
      label: 'APS efetiva',
      value: `${estimate.ratePerSecond.toFixed(2)}/s (vel. ${estimate.attackSpeed.toFixed(2)})`,
      tooltipLines: toTooltipLines(estimate.rateBreakdown),
    });
    stats.push({
      label: 'DPS estimado',
      value: `~${estimate.dps.toFixed(1)} (ataque contínuo)`,
      emphasize: true,
      tooltipLines: toTooltipLines(estimate.dpsBreakdown),
    });
    return;
  }

  stats.push({
    label: 'Dano/cast esperado',
    value: `~${estimate.expectedDamagePerHit.toFixed(1)} (poder × gear × crit)`,
    tooltipLines: toTooltipLines(estimate.hitBreakdown),
  });
  stats.push({
    label: 'Casts/s',
    value: `${estimate.ratePerSecond.toFixed(2)}/s`,
    tooltipLines: toTooltipLines(estimate.rateBreakdown),
  });
  stats.push({
    label: 'DPS estimado',
    value: `~${estimate.dps.toFixed(1)} (cast contínuo da skill)`,
    emphasize: true,
    tooltipLines: toTooltipLines(estimate.dpsBreakdown),
  });
}

export function formatScalingLabel(scalingKey: string): string {
  return SCALING_LABELS[scalingKey] ?? scalingKey.toUpperCase();
}

export function formatScopeLabel(scope: SkillScopeDto): string {
  return SCOPE_LABELS[scope];
}

export function formatBranchLabel(branch: SkillBranchDto): string {
  return SKILL_BRANCH_LABELS[branch];
}

export function buildSkillBattleStats(
  hero: Hero,
  skillId: string,
  scalingKey: string,
  powerCalculator = new SkillPowerCalculator(),
  mapId?: string,
): HeroActiveSkillStatDto[] {
  const combat = getHeroCombatSkill(skillId);
  if (!combat) return [];

  const mapIdentity = mapId ? resolveMapCombatIdentity(mapId) : null;
  const estimate =
    combat.kind === 'damage'
      ? estimateHeroSkillThroughput(hero, combat, powerCalculator, combatProfiles, {
          targetResists: mapIdentity?.typicalTrashResists,
          stageLevel: hero.level,
        })
      : null;

  const stats: HeroActiveSkillStatDto[] = [
    {
      label: 'Tipo',
      value: combat.kind === 'damage' ? formatDamageType(combat) : KIND_LABELS[combat.kind],
      tooltipLines: buildTypeTooltip(combat),
    },
    {
      label: 'Alvo',
      value: formatTarget(combat),
      tooltipLines: buildTargetTooltip(combat),
    },
  ];

  if (combat.usesAttackStat) {
    const estimatedPower = powerCalculator.calculateForHero(combat, hero);
    stats.push({
      label: 'Poder',
      value: `~${estimatedPower} (50% do ATK)`,
      tooltipLines: toTooltipLines(buildHeroSkillPowerBreakdown(combat, hero, estimatedPower)),
    });
  } else {
    const estimatedPower = powerCalculator.calculateForHero(combat, hero);
    const scaling = formatScalingLabel(scalingKey);
    stats.push({
      label: 'Poder',
      value: `~${estimatedPower} (escala ${scaling})`,
      tooltipLines: toTooltipLines(buildHeroSkillPowerBreakdown(combat, hero, estimatedPower)),
    });
  }

  if (estimate && combat.kind === 'damage') {
    const gearSummary =
      estimate.physicalDamagePercent !== 0
        ? `físico +${estimate.physicalDamagePercent}%`
        : `${estimate.gearBreakdown.length} componente(s)`;
    stats.push({
      label: 'Bônus de gear no dano',
      value: gearSummary,
      tooltipLines: toTooltipLines(estimate.gearBreakdown),
    });
    stats.push({
      label: 'Fator de crit',
      value: `${estimate.critFactor.toFixed(3)}× (${(estimate.critChance * 100).toFixed(1)}% · ${estimate.critDamage.toFixed(2)}×)`,
      tooltipLines: tip(
        {
          icon: 'power_attack',
          text: `Chance de crítico = ${(estimate.critChance * 100).toFixed(1)}%`,
        },
        {
          icon: 'attack',
          text: `Multiplicador de crítico = ${estimate.critDamage.toFixed(2)}×`,
        },
        {
          text: `Fator esperado = 1 + chance × (multiplicador − 1) = ${estimate.critFactor.toFixed(3)}`,
        },
        {
          text: 'O fator multiplica o dano médio por acerto (não o pico do crítico puro).',
        },
      ),
    });
  }

  appendDamageThroughputStats(stats, combat, hero, powerCalculator, mapId);

  stats.push({
    label: 'Recarga',
    value: formatEffectiveCooldown(combat, hero),
    tooltipLines: buildCooldownTooltip(combat, hero),
  });

  const initialSeconds = getInitialCooldownSeconds(combat, {
    turnSeconds: getHeroCombatIdentity(hero.heroClass).skillCooldownTurnSeconds,
  });
  if (initialSeconds > 0) {
    stats.push({
      label: 'Início',
      value: `Aguarda ${formatCooldownLabel(initialSeconds)}`,
      tooltipLines: tip(
        {
          icon: 'rune',
          text: `Ao entrar em combate, a skill começa com ${initialSeconds.toFixed(2)}s de espera.`,
        },
        { text: 'Depois do primeiro cast, vale a recarga normal (com CDR).' },
      ),
    });
  }

  if (combat.healConditionThreshold !== undefined) {
    const threshold = Math.round(combat.healConditionThreshold * 100);
    stats.push({
      label: 'Condição',
      value: `Só se aliado abaixo de ${threshold}% HP`,
      tooltipLines: tip(
        {
          icon: 'health',
          text: `Só dispara se o alvo escolhido estiver com HP% < ${threshold}%.`,
        },
        { text: 'Evita gastar o cast de cura em aliados ainda saudáveis.' },
      ),
    });
  }

  if (combat.effectDurationTurns !== undefined && combat.effectDurationTurns > 0) {
    const turns =
      combat.effectDurationTurns === 1 ? '1 turno' : `${combat.effectDurationTurns} turnos`;
    stats.push({
      label: 'Duração',
      value: turns,
      tooltipLines: tip(
        {
          icon: 'improvement',
          text: `O efeito permanece por ${combat.effectDurationTurns} turno(s) de combate.`,
        },
        { text: 'Turnos seguem o ritmo do tick de batalha, não o relógio de parede.' },
      ),
    });
  }

  return stats;
}
