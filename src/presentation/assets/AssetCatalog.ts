import { resolveEnemyDedicatedSpritePath } from './EnemySpriteCatalog';
import { GearSpriteInput, resolveGearSpritePath } from './GearSpriteCatalog';
import { getEnemyRosterEntry } from '../../domain/enemies/EnemyRosterCatalog';
import { HeroSpriteInput, resolveHeroSpritePath } from './HeroSpriteCatalog';

export type HeroClassKey = 'knight' | 'sorcerer' | 'priest' | 'berserker' | 'archer' | 'paladin';
export type GearSlotKey = 'weapon' | 'armor' | 'accessory';
export type GearRarityKey = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

const RARITY_ASSET_FALLBACK: Record<GearRarityKey, 'common' | 'rare' | 'epic'> = {
  common: 'common',
  uncommon: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'epic',
  mythic: 'epic',
};

const HERO_SPRITES: Record<HeroClassKey, string> = {
  knight: 'characters/galneon_aprendiz.png',
  sorcerer: 'characters/nix_aprendiz.png',
  priest: 'characters/elara_aprendiz.png',
  berserker: 'characters/berserker.png',
  archer: 'characters/rain.png',
  paladin: 'characters/valerius.png',
};

const ENEMY_SPRITE_PATHS = {
  common: 'characters/goblin.png',
  boss: 'characters/goblin_boss.png',
  saci: 'characters/saci_boss.png',
  goblinArcher: 'characters/goblin_arqueiro.png',
  goblinArcherAlt: 'characters/goblin_arqueiro_1.png',
  goblinBomber: 'characters/goblin_bombardeiro.png',
  gonodor: 'characters/gonodor_boss.png',
  vorax: 'characters/vorax_final_boss.png',
} as const;

function pickGoblinArcherSprite(enemyId?: string): string {
  if (!enemyId) return ENEMY_SPRITE_PATHS.goblinArcher;
  const hash = enemyId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % 2 === 1 ? ENEMY_SPRITE_PATHS.goblinArcherAlt : ENEMY_SPRITE_PATHS.goblinArcher;
}

const GEAR_SLOT_SPRITES: Record<GearSlotKey, string> = {
  weapon: 'gear/weapon.png',
  armor: 'gear/armor.png',
  accessory: 'gear/accessory.png',
};

const GEAR_RARITY_SPRITES: Record<GearRarityKey, string> = {
  common: 'gear/common.png',
  rare: 'gear/rare.png',
  epic: 'gear/epic.png',
};

const GEAR_FRAME_SPRITES: Record<GearRarityKey, string> = {
  common: 'frames/item-common.png',
  rare: 'frames/item-rare.png',
  epic: 'frames/item-epic.png',
};

export const ASSETS = {
  fonts: {
    body: 'fonts/Alata-Regular.ttf',
    heading: 'fonts/JosefinSans-Bold.ttf',
  },
  characters: {
    glow: 'characters/glow.png',
  },
  ui: {
    brand: 'ui/brand.png',
    gold: 'ui/gold.png',
    chest: 'ui/chest.png',
    chestOpen: 'ui/chest-open.png',
    victoryFrame: 'ui/victory-frame.png',
    victoryGlow: 'ui/victory-glow.png',
    victoryWings: 'ui/victory-wings.png',
    energy: 'ui/gift.png',
    heroes: 'ui/heroes.png',
    campaign: 'ui/campaign.png',
    shop: 'ui/shop.png',
    attack: 'ui/attack.png',
    defense: 'ui/defense.png',
    health: 'ui/health.png',
    inventory: 'ui/inventory.png',
    forge: 'ui/forge.png',
    improvement: 'ui/improvement.png',
    xp: 'ui/xp.png',
    stage: 'ui/stage.png',
    /** Stage Progress — wave comum (reusa battle/swords). */
    stageSwords: 'ui/attack.png',
    /** Stage Progress — baú (opcional). */
    stageChest: 'ui/chest.png',
    rune: 'ui/rune.png',
    achievement: 'ui/achievement.png',
    bookmark: 'ui/bookmark.png',
    pin: 'ui/pin.png',
    unpin: 'ui/unpin.png',
    clear: 'ui/clear.png',
    bookOpen: 'ui/book-open.png',
    arrowPrev: 'ui/arrow-prev.png',
    arrowNext: 'ui/arrow-next.png',
    splashScreen: 'ui/splash_screen.png',
  },
  skills: {
    attack: 'ui/attack.png',
    magic: 'skills/fireball.png',
    heal: 'skills/heal.png',
    buff: 'ui/defense.png',
    debuff: 'ui/defense.png',
    evasion: 'skills/evasion.png',
    physical: 'ui/attack.png',
    weapon: 'gear/weapon.png',
    chest: 'ui/chest.png',
    vitality: 'skills/vitality.png',
    arcane_bolt: 'skills/arcane_bolt.png',
    frost_shard: 'skills/frost_shard.png',
    blizzard: 'skills/blizzard.png',
    fireball: 'skills/fireball.png',
    mana_shield: 'skills/mana_shield.png',
    thrust: 'skills/thrust.png',
    blessing: 'skills/blessing.png',
    smite: 'skills/smite.png',
    iron_skin: 'skills/iron_skin.png',
    power_attack: 'skills/power_attack.png',
  },
  backgrounds: {
    battle: 'backgrounds/battle.png',
    app: 'backgrounds/app.png',
  },
  audio: {
    music: {
      camp: 'audio/music/camp.wav',
      battle: 'audio/music/battle.wav',
    },
    sfx: {
      uiClickMenu: 'audio/sfx/ui_click_menu.ogg',
      uiClickConfirm: 'audio/sfx/ui_click_confirm.ogg',
      uiClickBack: 'audio/sfx/ui_click_back.ogg',
    },
  },
  frames: {
    card: 'frames/card.png',
  },
  buttons: {
    primary: 'buttons/primary.png',
    secondary: 'buttons/secondary.png',
  },
  sliders: {
    frame: 'sliders/frame.png',
    fillHero: 'sliders/fill-hero.png',
    fillEnemy: 'sliders/fill-enemy.png',
  },
} as const;

export function getAssetUrl(relativePath: string): string {
  return `./assets/${relativePath}`;
}

export function getHeroSprite(hero: HeroSpriteInput): string {
  return getAssetUrl(resolveHeroSpritePath(hero));
}

/** @deprecated Prefer getHeroSprite({ id, heroClass, ascensionId }). */
export function getHeroSpriteByClass(heroClass: string): string {
  return getAssetUrl(HERO_SPRITES[heroClass as HeroClassKey] ?? HERO_SPRITES.knight);
}

/** Sprite por roster: dedicado por id; variantes especiais; fallback comum/chefe. */
export function getEnemySpriteUrl(enemyType: string, enemyName: string, enemyId?: string): string {
  const dedicated = resolveEnemyDedicatedSpritePath(enemyType);
  if (dedicated) {
    return getAssetUrl(dedicated);
  }

  const entry = getEnemyRosterEntry(enemyType);

  if (entry?.spriteVariant === 'vorax' || enemyType === 'vorax') {
    return getAssetUrl(ENEMY_SPRITE_PATHS.vorax);
  }

  if (entry?.spriteVariant === 'gonodor' || enemyType === 'gonodor') {
    return getAssetUrl(ENEMY_SPRITE_PATHS.gonodor);
  }

  if (entry?.spriteVariant === 'saci' || enemyType === 'saci') {
    return getAssetUrl(ENEMY_SPRITE_PATHS.saci);
  }

  if (entry?.spriteVariant === 'goblin_archer' || enemyType === 'goblin_archer') {
    return getAssetUrl(pickGoblinArcherSprite(enemyId));
  }

  if (entry?.spriteVariant === 'goblin_bomber' || enemyType === 'goblin_bomber') {
    return getAssetUrl(ENEMY_SPRITE_PATHS.goblinBomber);
  }

  if (
    enemyName.startsWith('Elite ') ||
    enemyName.startsWith('Boss ') ||
    entry?.rosterRole === 'subboss' ||
    entry?.rosterRole === 'boss'
  ) {
    return getAssetUrl(ENEMY_SPRITE_PATHS.boss);
  }

  return getAssetUrl(ENEMY_SPRITE_PATHS.common);
}

/** @deprecated Use getEnemySpriteUrl */
export function getEnemySprite(enemyType: string, options?: { isBoss?: boolean }): string {
  if (options?.isBoss) {
    const entry = getEnemyRosterEntry(enemyType);
    if (entry?.spriteVariant === 'saci' || enemyType === 'saci') {
      return getAssetUrl(ENEMY_SPRITE_PATHS.saci);
    }
    if (entry?.spriteVariant === 'vorax' || enemyType === 'vorax') {
      return getAssetUrl(ENEMY_SPRITE_PATHS.vorax);
    }
    if (entry?.spriteVariant === 'gonodor' || enemyType === 'gonodor') {
      return getAssetUrl(ENEMY_SPRITE_PATHS.gonodor);
    }
    return getAssetUrl(ENEMY_SPRITE_PATHS.boss);
  }
  return getEnemySpriteUrl(enemyType, '');
}

export function getGearSlotSprite(slot: string): string {
  return getAssetUrl(GEAR_SLOT_SPRITES[slot as GearSlotKey] ?? GEAR_SLOT_SPRITES.weapon);
}

export function getGearSprite(gear: GearSpriteInput): string {
  return getAssetUrl(resolveGearSpritePath(gear));
}

export function getGearRaritySprite(rarity: string): string {
  const key = (rarity in RARITY_ASSET_FALLBACK ? rarity : 'common') as GearRarityKey;
  const assetKey = RARITY_ASSET_FALLBACK[key];
  return getAssetUrl(GEAR_RARITY_SPRITES[assetKey]);
}

export function getGearFrameSprite(rarity: string): string {
  const key = (rarity in RARITY_ASSET_FALLBACK ? rarity : 'common') as GearRarityKey;
  const assetKey = RARITY_ASSET_FALLBACK[key];
  return getAssetUrl(GEAR_FRAME_SPRITES[assetKey]);
}

export function imgTag(src: string, alt: string, className?: string): string {
  const classAttr = className ? ` class="${className}"` : '';
  return `<img src="${src}" alt="${alt}"${classAttr} loading="lazy" draggable="false" />`;
}
