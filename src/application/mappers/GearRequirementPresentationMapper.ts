import { GearDto, HeroDto } from '../dto/GameStateDto';
import { GALNEON_HERO_ID } from '../../domain/gear/GalneonGearCatalog';

export interface GearRequirementLineDto {
  label: string;
  met: boolean;
  current: number;
  required: number;
}

export interface GearRequirementEvaluationDto {
  met: boolean;
  lines: GearRequirementLineDto[];
}

export function evaluateGearRequirements(
  hero: HeroDto,
  gear: GearDto,
): GearRequirementEvaluationDto {
  const lines: GearRequirementLineDto[] = [];
  const reqs = gear.requirements;
  const attrs = hero.totalAttributes;

  lines.push({
    label: 'Level',
    met: hero.level >= reqs.minLevel,
    current: hero.level,
    required: reqs.minLevel,
  });

  if (reqs.str !== undefined) {
    lines.push({
      label: 'STR',
      met: attrs.str >= reqs.str,
      current: attrs.str,
      required: reqs.str,
    });
  }
  if (reqs.dex !== undefined) {
    lines.push({
      label: 'DEX',
      met: attrs.dex >= reqs.dex,
      current: attrs.dex,
      required: reqs.dex,
    });
  }
  if (reqs.int !== undefined) {
    lines.push({
      label: 'INT',
      met: attrs.int >= reqs.int,
      current: attrs.int,
      required: reqs.int,
    });
  }
  if (reqs.heroId !== undefined) {
    const heroLabel = reqs.heroId === GALNEON_HERO_ID ? 'Galneon' : 'Herói exclusivo';
    lines.push({
      label: heroLabel,
      met: hero.id === reqs.heroId,
      current: hero.id === reqs.heroId ? 1 : 0,
      required: 1,
    });
  }

  return { met: lines.every((line) => line.met), lines };
}

export function canHeroEquipGear(hero: HeroDto, gear: GearDto): boolean {
  return evaluateGearRequirements(hero, gear).met;
}
