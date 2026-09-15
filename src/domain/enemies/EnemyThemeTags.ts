import { EnemyRosterEntry, getEnemyRosterEntry } from './EnemyRosterCatalog';

/** Tags temáticas para bias soft de pool por mapa. */
export type EnemyThemeTag =
  | 'beast'
  | 'goblin'
  | 'bandit'
  | 'orc'
  | 'undead'
  | 'fire'
  | 'poison'
  | 'physical'
  | 'demon'
  | 'dragon'
  | 'shadow'
  | 'arcane'
  | 'cold';

const ID_TAG_RULES: Array<{ pattern: RegExp; tags: EnemyThemeTag[] }> = [
  { pattern: /rat|bat|wolf|worg|gnoll|spider|hydra|manticore|behemoth|chimera|capelobo|mapinguari/, tags: ['beast'] },
  { pattern: /goblin|kobold/, tags: ['goblin'] },
  { pattern: /bandit/, tags: ['bandit', 'physical'] },
  { pattern: /orc|ogre|troll|minotaur|lizard/, tags: ['orc', 'physical'] },
  { pattern: /skeleton|zombie|undead|wraith|necromancer|lich|death_knight|dead_general|soul_devourer/, tags: ['undead', 'shadow'] },
  { pattern: /fire|infernal|pyro|gonodor|saci/, tags: ['fire'] },
  { pattern: /frost|ice/, tags: ['cold'] },
  { pattern: /poison|spider|slime|aberrant|shadow_arachnid/, tags: ['poison'] },
  { pattern: /demon|cultist|devil/, tags: ['demon', 'fire', 'shadow'] },
  { pattern: /dragon/, tags: ['dragon', 'fire'] },
  { pattern: /gargoyle|void|arcane|mage|elemental/, tags: ['arcane'] },
  { pattern: /morthaven|duke|stone_giant|primordial|titan|warlord/, tags: ['physical', 'shadow'] },
];

export function inferEnemyTagsFromId(enemyType: string): EnemyThemeTag[] {
  const id = enemyType.toLowerCase();
  const tags = new Set<EnemyThemeTag>();

  for (const rule of ID_TAG_RULES) {
    if (rule.pattern.test(id)) {
      for (const tag of rule.tags) tags.add(tag);
    }
  }

  if (tags.size === 0) {
    tags.add('physical');
  }

  return [...tags];
}

export function resolveEnemyTags(entryOrId: EnemyRosterEntry | string): EnemyThemeTag[] {
  const entry =
    typeof entryOrId === 'string' ? getEnemyRosterEntry(entryOrId) : entryOrId;
  if (!entry) {
    return typeof entryOrId === 'string' ? inferEnemyTagsFromId(entryOrId) : ['physical'];
  }

  if (entry.tags && entry.tags.length > 0) {
    return [...entry.tags];
  }

  return inferEnemyTagsFromId(entry.id);
}

export function enemyMatchesPreferredTags(
  entryOrId: EnemyRosterEntry | string,
  preferred: readonly EnemyThemeTag[],
): boolean {
  if (preferred.length === 0) return false;
  const tags = resolveEnemyTags(entryOrId);
  return tags.some((tag) => preferred.includes(tag));
}
