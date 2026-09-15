import { DamageElement, DAMAGE_ELEMENTS } from './DamageElement';
import { CombatFloatingEvent } from '../services/combat/CombatFloatingEvent';

export interface ElementDamageMap {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  air: number;
}

export interface HeroBattleSessionStats {
  heroId: string;
  damageDealt: number;
  healingDone: number;
  damageTaken: number;
  damageMitigated: number;
  critCount: number;
  basicAttackUses: number;
  skillUses: number;
  damageByElement: ElementDamageMap;
  damageTakenByElement: ElementDamageMap;
  damageMitigatedByElement: ElementDamageMap;
}

export interface SkillBattleSessionStats {
  heroId: string;
  skillId: string;
  uses: number;
  damageDealt: number;
  healingDone: number;
}

export interface BattleSessionStatsProps {
  damageDealt: number;
  healingDone: number;
  damageTaken: number;
  damageMitigated: number;
  critCount: number;
  damageByElement: ElementDamageMap;
  damageTakenByElement: ElementDamageMap;
  damageMitigatedByElement: ElementDamageMap;
  heroes: Record<string, HeroBattleSessionStats>;
  skills: Record<string, SkillBattleSessionStats>;
}

/** Contribuição de um golpe resolvido no tick. */
export interface BattleStatsStrike {
  actorSide: 'hero' | 'enemy';
  actorId: string;
  skillId: string | null;
  isBasicAttack: boolean;
  events: readonly CombatFloatingEvent[];
  /** Dano evitado em heróis (armadura/resist/bloqueio). */
  mitigatedDamage: number;
  /** Elemento dominante do golpe (mitigação sem float de dano, ex. dodge total). */
  primaryDamageElement?: DamageElement;
}

export function emptyElementDamageMap(): ElementDamageMap {
  return { physical: 0, fire: 0, cold: 0, lightning: 0, air: 0 };
}

export function emptyBattleSessionStats(): BattleSessionStatsProps {
  return {
    damageDealt: 0,
    healingDone: 0,
    damageTaken: 0,
    damageMitigated: 0,
    critCount: 0,
    damageByElement: emptyElementDamageMap(),
    damageTakenByElement: emptyElementDamageMap(),
    damageMitigatedByElement: emptyElementDamageMap(),
    heroes: {},
    skills: {},
  };
}

function emptyHeroStats(heroId: string): HeroBattleSessionStats {
  return {
    heroId,
    damageDealt: 0,
    healingDone: 0,
    damageTaken: 0,
    damageMitigated: 0,
    critCount: 0,
    basicAttackUses: 0,
    skillUses: 0,
    damageByElement: emptyElementDamageMap(),
    damageTakenByElement: emptyElementDamageMap(),
    damageMitigatedByElement: emptyElementDamageMap(),
  };
}

function skillKey(heroId: string, skillId: string): string {
  return `${heroId}::${skillId}`;
}

function normalizeElementMap(raw: Partial<ElementDamageMap> | null | undefined): ElementDamageMap {
  const next = emptyElementDamageMap();
  for (const element of DAMAGE_ELEMENTS) {
    next[element] = Math.max(0, Math.floor(raw?.[element] ?? 0));
  }
  return next;
}

function normalizeHero(
  heroId: string,
  raw: Partial<HeroBattleSessionStats> | null | undefined,
): HeroBattleSessionStats {
  return {
    heroId,
    damageDealt: Math.max(0, Math.floor(raw?.damageDealt ?? 0)),
    healingDone: Math.max(0, Math.floor(raw?.healingDone ?? 0)),
    damageTaken: Math.max(0, Math.floor(raw?.damageTaken ?? 0)),
    damageMitigated: Math.max(0, Math.floor(raw?.damageMitigated ?? 0)),
    critCount: Math.max(0, Math.floor(raw?.critCount ?? 0)),
    basicAttackUses: Math.max(0, Math.floor(raw?.basicAttackUses ?? 0)),
    skillUses: Math.max(0, Math.floor(raw?.skillUses ?? 0)),
    damageByElement: normalizeElementMap(raw?.damageByElement),
    damageTakenByElement: normalizeElementMap(raw?.damageTakenByElement),
    damageMitigatedByElement: normalizeElementMap(raw?.damageMitigatedByElement),
  };
}

function normalizeSkill(
  raw: Partial<SkillBattleSessionStats> & { heroId: string; skillId: string },
): SkillBattleSessionStats {
  return {
    heroId: raw.heroId,
    skillId: raw.skillId,
    uses: Math.max(0, Math.floor(raw.uses ?? 0)),
    damageDealt: Math.max(0, Math.floor(raw.damageDealt ?? 0)),
    healingDone: Math.max(0, Math.floor(raw.healingDone ?? 0)),
  };
}

export function normalizeBattleSessionStats(
  raw: Partial<BattleSessionStatsProps> | null | undefined,
): BattleSessionStatsProps {
  const heroesRaw = raw?.heroes ?? {};
  const skillsRaw = raw?.skills ?? {};
  const heroes: Record<string, HeroBattleSessionStats> = {};
  const skills: Record<string, SkillBattleSessionStats> = {};

  for (const [id, entry] of Object.entries(heroesRaw)) {
    heroes[id] = normalizeHero(id, entry);
  }

  for (const [key, entry] of Object.entries(skillsRaw)) {
    if (!entry?.heroId || !entry?.skillId) continue;
    skills[key] = normalizeSkill(entry);
  }

  return {
    damageDealt: Math.max(0, Math.floor(raw?.damageDealt ?? 0)),
    healingDone: Math.max(0, Math.floor(raw?.healingDone ?? 0)),
    damageTaken: Math.max(0, Math.floor(raw?.damageTaken ?? 0)),
    damageMitigated: Math.max(0, Math.floor(raw?.damageMitigated ?? 0)),
    critCount: Math.max(0, Math.floor(raw?.critCount ?? 0)),
    damageByElement: normalizeElementMap(raw?.damageByElement),
    damageTakenByElement: normalizeElementMap(raw?.damageTakenByElement),
    damageMitigatedByElement: normalizeElementMap(raw?.damageMitigatedByElement),
    heroes,
    skills,
  };
}

function ensureHero(
  heroes: Record<string, HeroBattleSessionStats>,
  heroId: string,
): HeroBattleSessionStats {
  if (!heroes[heroId]) {
    heroes[heroId] = emptyHeroStats(heroId);
  }
  return heroes[heroId];
}

function ensureSkill(
  skills: Record<string, SkillBattleSessionStats>,
  heroId: string,
  skillId: string,
): SkillBattleSessionStats {
  const key = skillKey(heroId, skillId);
  if (!skills[key]) {
    skills[key] = { heroId, skillId, uses: 0, damageDealt: 0, healingDone: 0 };
  }
  return skills[key];
}

function addElement(
  map: ElementDamageMap,
  element: DamageElement | undefined,
  amount: number,
): void {
  if (!element || amount <= 0) return;
  map[element] += amount;
}

function resolveStrikeElement(
  strike: BattleStatsStrike,
  eventElement?: DamageElement,
): DamageElement {
  return eventElement ?? strike.primaryDamageElement ?? 'physical';
}

/** Acumula floats legados (sem atribuição de skill). */
export function accumulateBattleSessionStats(
  current: BattleSessionStatsProps,
  events: readonly CombatFloatingEvent[],
): BattleSessionStatsProps {
  return accumulateBattleStatsStrikes(current, [
    {
      actorSide: 'enemy',
      actorId: '',
      skillId: null,
      isBasicAttack: false,
      events,
      mitigatedDamage: 0,
    },
  ]);
}

export function accumulateBattleStatsStrikes(
  current: BattleSessionStatsProps,
  strikes: readonly BattleStatsStrike[],
): BattleSessionStatsProps {
  const next = normalizeBattleSessionStats(current);

  for (const strike of strikes) {
    let strikeDamageDealt = 0;
    let strikeHealingDone = 0;

    for (const event of strike.events) {
      if (event.kind === 'damage' || event.kind === 'crit') {
        if (event.target === 'enemy') {
          next.damageDealt += event.amount;
          strikeDamageDealt += event.amount;
          addElement(next.damageByElement, event.damageElement, event.amount);
          if (event.kind === 'crit') next.critCount += 1;

          if (strike.actorSide === 'hero') {
            const hero = ensureHero(next.heroes, strike.actorId);
            hero.damageDealt += event.amount;
            addElement(hero.damageByElement, event.damageElement, event.amount);
            if (event.kind === 'crit') hero.critCount += 1;
          }
        } else if (event.target === 'hero') {
          next.damageTaken += event.amount;
          addElement(next.damageTakenByElement, event.damageElement, event.amount);
          const hero = ensureHero(next.heroes, event.targetId);
          hero.damageTaken += event.amount;
          addElement(hero.damageTakenByElement, event.damageElement, event.amount);
        }
      } else if (
        (event.kind === 'heal' || event.kind === 'crit-heal') &&
        event.target === 'hero'
      ) {
        next.healingDone += event.amount;
        strikeHealingDone += event.amount;
        if (event.kind === 'crit-heal') next.critCount += 1;

        if (strike.actorSide === 'hero') {
          const healer = ensureHero(next.heroes, strike.actorId);
          healer.healingDone += event.amount;
          if (event.kind === 'crit-heal') healer.critCount += 1;
        }
      }
    }

    if (strike.mitigatedDamage > 0) {
      next.damageMitigated += strike.mitigatedDamage;

      const takenEvents = strike.events.filter(
        (event) =>
          (event.kind === 'damage' || event.kind === 'crit') && event.target === 'hero',
      );
      const takenTotal = takenEvents.reduce((sum, event) => sum + event.amount, 0);

      if (takenEvents.length === 1) {
        const element = resolveStrikeElement(strike, takenEvents[0].damageElement);
        const hero = ensureHero(next.heroes, takenEvents[0].targetId);
        hero.damageMitigated += strike.mitigatedDamage;
        addElement(hero.damageMitigatedByElement, element, strike.mitigatedDamage);
        addElement(next.damageMitigatedByElement, element, strike.mitigatedDamage);
      } else if (takenTotal > 0) {
        let attributed = 0;
        for (let index = 0; index < takenEvents.length; index += 1) {
          const event = takenEvents[index];
          const isLast = index === takenEvents.length - 1;
          const share = isLast
            ? strike.mitigatedDamage - attributed
            : Math.floor((strike.mitigatedDamage * event.amount) / takenTotal);
          attributed += share;
          const element = resolveStrikeElement(strike, event.damageElement);
          const hero = ensureHero(next.heroes, event.targetId);
          hero.damageMitigated += share;
          addElement(hero.damageMitigatedByElement, element, share);
          addElement(next.damageMitigatedByElement, element, share);
        }
      } else {
        const element = resolveStrikeElement(strike);
        addElement(next.damageMitigatedByElement, element, strike.mitigatedDamage);
      }
    }

    if (strike.actorSide === 'hero' && strike.skillId) {
      const hero = ensureHero(next.heroes, strike.actorId);
      if (strike.isBasicAttack) {
        hero.basicAttackUses += 1;
      } else {
        hero.skillUses += 1;
      }

      const skill = ensureSkill(next.skills, strike.actorId, strike.skillId);
      skill.uses += 1;
      skill.damageDealt += strikeDamageDealt;
      skill.healingDone += strikeHealingDone;
    }
  }

  return next;
}
