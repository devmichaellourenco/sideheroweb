import { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { getGearTemplate } from '../gear/GearTemplateCatalog';
import { getAscensionById } from '../progression/ClassAscensionCatalog';
import { AscensionId } from '../progression/SkillId';
import {
  ASCENSION_PASSIVE_IDS,
  BASE_CLASS_PASSIVE_IDS,
  getPassiveDefinition,
} from './PassiveCatalog';
import { ActivePassive, PassiveId, PassiveSource } from './PassiveTypes';

export function listAscensionChainIds(ascensionId: AscensionId | null): AscensionId[] {
  const chain: AscensionId[] = [];
  let current: AscensionId | null = ascensionId;

  while (current) {
    chain.unshift(current);
    current = getAscensionById(current)?.prerequisiteAscensionId ?? null;
  }

  return chain;
}

function pushPassive(
  bucket: ActivePassive[],
  id: PassiveId,
  source: PassiveSource,
): void {
  bucket.push({
    id,
    definition: getPassiveDefinition(id),
    source,
  });
}

/** Agrega passivas ativas; mesma PassiveId de fontes distintas permanece (soma nos modifiers). */
export function resolveHeroPassives(hero: Hero): ActivePassive[] {
  const active: ActivePassive[] = [];
  const props = hero.toProps();

  pushPassive(active, BASE_CLASS_PASSIVE_IDS[hero.heroClass], {
    type: 'hero_class',
    heroClass: hero.heroClass,
  });

  for (const ascensionId of listAscensionChainIds(props.ascensionId)) {
    const passiveId = ASCENSION_PASSIVE_IDS[ascensionId];
    if (!passiveId) continue;
    pushPassive(active, passiveId, { type: 'ascension', ascensionId });
  }

  const equipment = props.equipment ?? {};
  for (const gear of Object.values(equipment)) {
    if (!gear) continue;
    const template = getGearTemplate(gear.templateId);
    const passiveIds = template?.passiveIds ?? [];
    for (const passiveId of passiveIds) {
      pushPassive(active, passiveId, { type: 'gear', templateId: gear.templateId });
    }
  }

  return active;
}

/** Passivas do roster do inimigo (opcional; nem todo monstro tem). */
export function resolveEnemyPassives(enemy: Enemy): ActivePassive[] {
  const active: ActivePassive[] = [];
  for (const passiveId of enemy.passiveIds) {
    pushPassive(active, passiveId, {
      type: 'enemy',
      enemyType: enemy.enemyType,
    });
  }
  return active;
}

export function formatPassiveSourceLabel(source: PassiveSource): string {
  switch (source.type) {
    case 'hero_class':
      return 'Classe';
    case 'ascension': {
      const name = getAscensionById(source.ascensionId)?.name ?? source.ascensionId;
      return `Ascensão · ${name}`;
    }
    case 'gear':
      return `Item · ${source.templateId}`;
    case 'enemy':
      return `Inimigo · ${source.enemyType}`;
  }
}
