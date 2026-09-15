import { Hero } from '../../domain/entities/Hero';
import {
  formatPassiveSourceLabel,
  resolveHeroPassives,
  summarizeActivePassive,
} from '../../domain/passives';
import { ActivePassiveDto } from '../dto/GameStateDto';

export function mapHeroActivePassives(hero: Hero): ActivePassiveDto[] {
  return resolveHeroPassives(hero).map((active) => ({
    id: active.id,
    name: active.definition.name,
    description: active.definition.description,
    sourceLabel: formatPassiveSourceLabel(active.source),
    effectiveSummary: summarizeActivePassive(hero, active),
  }));
}
