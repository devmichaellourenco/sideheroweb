/**
 * Caminhos canônicos usados pelo Balance Lab server.
 * Centraliza todos os paths para evitar duplicação.
 */
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const root = join(__dirname, '../..');

// ── Override files ─────────────────────────────────────────────────────────

export const OVERRIDES_PATH = join(
  root,
  'src/domain/campaign/data/phase-battle-overrides.json',
);
export const BACKUPS_DIR = join(
  root,
  'src/domain/campaign/data/backups/phase-battle-overrides',
);

export const REWARD_OVERRIDES_PATH = join(
  root,
  'src/domain/campaign/data/phase-reward-overrides.json',
);
export const REWARD_BACKUPS_DIR = join(
  root,
  'src/domain/campaign/data/backups/phase-reward-overrides',
);

export const HERO_COMBAT_PATH = join(
  root,
  'src/domain/progression/data/hero-combat-overrides.json',
);
export const HERO_COMBAT_BACKUPS_DIR = join(
  root,
  'src/domain/progression/data/backups/hero-combat-overrides',
);

export const HERO_LEVEL_XP_PATH = join(
  root,
  'src/domain/progression/data/hero-level-xp-overrides.json',
);
export const HERO_LEVEL_XP_BACKUPS_DIR = join(
  root,
  'src/domain/progression/data/backups/hero-level-xp-overrides',
);

export const GEAR_ITEM_OVERRIDES_PATH = join(
  root,
  'src/domain/gear/data/gear-item-overrides.json',
);
export const GEAR_ITEM_BACKUPS_DIR = join(
  root,
  'src/domain/gear/data/backups/gear-item-overrides',
);

export const SHOP_OVERRIDES_PATH = join(
  root,
  'src/domain/shop/data/shop-overrides.json',
);
export const SHOP_BACKUPS_DIR = join(
  root,
  'src/domain/shop/data/backups/shop-overrides',
);

export const MISSION_OVERRIDES_PATH = join(
  root,
  'src/domain/campaign/data/mission-overrides.json',
);
export const MISSION_BACKUPS_DIR = join(
  root,
  'src/domain/campaign/data/backups/mission-overrides',
);

export const ENEMY_COMBAT_PATH = join(
  root,
  'src/domain/enemies/data/enemy-combat-overrides.json',
);
export const ENEMY_COMBAT_BACKUPS_DIR = join(
  root,
  'src/domain/enemies/data/backups/enemy-combat-overrides',
);

export const UPGRADE_OVERRIDES_PATH = join(
  root,
  'src/domain/upgrades/data/upgrade-overrides.json',
);
export const UPGRADE_BACKUPS_DIR = join(
  root,
  'src/domain/upgrades/data/backups/upgrade-overrides',
);

// ── Canonical JSON catalogs (JSON-backed — promotable automatically) ────────

export const GEAR_CATALOG_PATH = join(
  root,
  'src/domain/gear/data/gear-items.catalog.json',
);
export const SHOP_CATALOG_PATH = join(
  root,
  'src/domain/shop/data/shops.catalog.json',
);

// ── Assets ─────────────────────────────────────────────────────────────────

export const PANEL_ASSETS_DIR = join(root, 'dist/panel/assets');
export const PUBLIC_ENEMY_SPRITES_DIR = join(root, 'public/sprites/enemies');

/**
 * Mapa de scopes monitorados: chave → { override, backupsDir, catalog? }.
 * Usado por /api/workspace-version e /api/backups.
 */
export const SCOPE_MAP = {
  'phase-battle': {
    override: OVERRIDES_PATH,
    backupsDir: BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: false,
  },
  'phase-reward': {
    override: REWARD_OVERRIDES_PATH,
    backupsDir: REWARD_BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: false,
  },
  'hero-combat': {
    override: HERO_COMBAT_PATH,
    backupsDir: HERO_COMBAT_BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: true,
  },
  'hero-level-xp': {
    override: HERO_LEVEL_XP_PATH,
    backupsDir: HERO_LEVEL_XP_BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: true,
  },
  'gear-items': {
    override: GEAR_ITEM_OVERRIDES_PATH,
    backupsDir: GEAR_ITEM_BACKUPS_DIR,
    catalog: GEAR_CATALOG_PATH,
    tsBackedOnly: false,
  },
  shops: {
    override: SHOP_OVERRIDES_PATH,
    backupsDir: SHOP_BACKUPS_DIR,
    catalog: SHOP_CATALOG_PATH,
    tsBackedOnly: false,
  },
  missions: {
    override: MISSION_OVERRIDES_PATH,
    backupsDir: MISSION_BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: false,
  },
  'enemy-combat': {
    override: ENEMY_COMBAT_PATH,
    backupsDir: ENEMY_COMBAT_BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: true,
  },
  upgrades: {
    override: UPGRADE_OVERRIDES_PATH,
    backupsDir: UPGRADE_BACKUPS_DIR,
    catalog: null,
    tsBackedOnly: true,
  },
};
