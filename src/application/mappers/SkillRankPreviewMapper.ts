import { Hero } from '../../domain/entities/Hero';
import { SkillNodeStatusDto } from '../dto/SkillNodeDto';
import { buildSkillBattleStats } from './SkillBattleStatsMapper';

export interface SkillRankSlotDto {
  rank: number;
  filled: boolean;
  isNext: boolean;
  canAllocate: boolean;
  previewTitle: string;
  previewLines: string[];
}

const EMPHASIZED_LABELS = new Set([
  'Poder',
  'Recarga',
  'DPS estimado',
  'Dano/cast esperado',
  'Dano/hit esperado',
  'Esquiva',
  'Bloqueio',
  'Redução de dano',
  'HP bônus',
]);

function heroAtSkillRank(hero: Hero, skillId: string, rank: number): Hero {
  const props = hero.toProps();
  const skillRanks = { ...props.skillRanks };
  if (rank <= 0) {
    delete skillRanks[skillId];
  } else {
    skillRanks[skillId] = rank;
  }
  return Hero.restore({ ...props, skillRanks });
}

function pickComparableStats(skillId: string, hero: Hero, scaling: string) {
  return buildSkillBattleStats(hero, skillId, scaling).filter(
    (stat) => EMPHASIZED_LABELS.has(stat.label) || stat.emphasize,
  );
}

function formatStatDelta(before: string, after: string): string | null {
  if (before === after) return null;
  return `${before} → ${after}`;
}

/** Ganho incremental ao subir de `fromRank` → `toRank` (sempre detalhado para planejar build). */
function buildRankGainLines(
  hero: Hero,
  skillId: string,
  scaling: string,
  fromRank: number,
  toRank: number,
): string[] {
  if (toRank <= 0) return [];

  const beforeHero = heroAtSkillRank(hero, skillId, Math.max(0, fromRank));
  const afterHero = heroAtSkillRank(hero, skillId, toRank);

  const beforeStats = pickComparableStats(skillId, beforeHero, scaling);
  const afterStats = pickComparableStats(skillId, afterHero, scaling);

  const lines: string[] = [];
  if (fromRank <= 0) {
    lines.push('Desbloqueia a skill para equipar e usar em batalha.');
  }

  for (const after of afterStats) {
    const before = beforeStats.find((entry) => entry.label === after.label);
    if (!before) {
      lines.push(`${after.label}: ${after.value}`);
      continue;
    }
    const delta = formatStatDelta(before.value, after.value);
    if (delta) {
      lines.push(`${after.label}: ${delta}`);
    }
  }

  if (lines.length === (fromRank <= 0 ? 1 : 0)) {
    lines.push(`Level ${toRank}: melhora os valores de combate da skill.`);
  }

  return lines;
}

function buildActiveRankLines(
  hero: Hero,
  skillId: string,
  scaling: string,
  rank: number,
): string[] {
  const atRank = heroAtSkillRank(hero, skillId, rank);
  const stats = pickComparableStats(skillId, atRank, scaling);
  if (stats.length === 0) {
    return [`Level ${rank} ativo.`];
  }
  return stats.slice(0, 4).map((stat) => `${stat.label}: ${stat.value}`);
}

function availabilityNote(input: {
  status: SkillNodeStatusDto;
  canAllocate: boolean;
  isNext: boolean;
  rank: number;
  currentRank: number;
}): string | null {
  if (input.status === 'locked') {
    return 'Skill bloqueada — requisitos não atendidos.';
  }
  if (input.canAllocate) return null;
  if (input.isNext) {
    return 'Sem pontos de Aprimoramento ou requisitos pendentes.';
  }
  if (input.rank > input.currentRank + 1) {
    return `Requer level ${input.rank - 1} antes.`;
  }
  return null;
}

export function buildSkillRankSlots(input: {
  hero: Hero;
  skillId: string;
  scaling: string;
  maxRank: number;
  currentRank: number;
  status: SkillNodeStatusDto;
  canAllocateRank: boolean;
  canSpendPoint: boolean;
}): SkillRankSlotDto[] {
  const slots: SkillRankSlotDto[] = [];

  for (let rank = 1; rank <= input.maxRank; rank += 1) {
    const filled = input.currentRank >= rank;
    const isNext = input.currentRank === rank - 1;
    const canAllocate =
      isNext &&
      input.canAllocateRank &&
      input.canSpendPoint &&
      input.status !== 'locked' &&
      input.currentRank < input.maxRank;

    let previewTitle: string;
    let previewLines: string[];

    if (filled) {
      previewTitle = `Level ${rank} ativo`;
      previewLines = buildActiveRankLines(input.hero, input.skillId, input.scaling, rank);
    } else {
      // Sempre mostra o ganho daquele ponto (rank-1 → rank), mesmo se ainda não for o próximo.
      previewTitle = `Level ${rank}`;
      previewLines = buildRankGainLines(
        input.hero,
        input.skillId,
        input.scaling,
        rank - 1,
        rank,
      );
      const note = availabilityNote({
        status: input.status,
        canAllocate,
        isNext,
        rank,
        currentRank: input.currentRank,
      });
      if (note) previewLines.push(note);
    }

    slots.push({
      rank,
      filled,
      isNext,
      canAllocate,
      previewTitle,
      previewLines,
    });
  }

  return slots;
}
