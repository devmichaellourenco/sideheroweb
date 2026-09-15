import { parseUiThemeId, type UiThemeId } from '../theme/MedievalThemeTokens';
import { applyUiTheme } from '../theme/applyUiTheme';

export interface GamePreferences {
  autoBattle: boolean;
  autoOpenChests: boolean;
  autoEquipLoot: boolean;
  autoBattleSpeed: 1 | 2 | 3;
  logFilterImportant: boolean;
  uiTheme: UiThemeId;
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
}

const STORAGE_KEYS = {
  autoBattle: 'sidehero_auto_battle',
  autoOpenChests: 'sidehero_auto_open_chest',
  autoEquipLoot: 'sidehero_auto_equip_loot',
  autoBattleSpeed: 'sidehero_auto_battle_speed',
  logFilterImportant: 'sidehero_log_filter_important',
  uiTheme: 'sidehero_ui_theme',
  musicEnabled: 'sidehero_music_enabled',
  musicVolume: 'sidehero_music_volume',
  sfxEnabled: 'sidehero_sfx_enabled',
  sfxVolume: 'sidehero_sfx_volume',
} as const;

const DEFAULT_PREFERENCES: GamePreferences = {
  autoBattle: true,
  autoOpenChests: false,
  autoEquipLoot: false,
  autoBattleSpeed: 1,
  logFilterImportant: false,
  uiTheme: 'dark',
  musicEnabled: true,
  musicVolume: 0.55,
  sfxEnabled: true,
  sfxVolume: 0.75,
};

function readFlag(key: string, defaultValue = false): boolean {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === '1';
  } catch {
    return defaultValue;
  }
}

function writeFlag(key: string, enabled: boolean): void {
  try {
    sessionStorage.setItem(key, enabled ? '1' : '0');
  } catch {
    // sessionStorage indisponível
  }
}

function readVolume(key: string, defaultValue: number): number {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.max(0, Math.min(100, parsed)) / 100;
  } catch {
    return defaultValue;
  }
}

function writeVolume(key: string, volume: number): void {
  try {
    sessionStorage.setItem(key, String(Math.round(Math.max(0, Math.min(1, volume)) * 100)));
  } catch {
    // sessionStorage indisponível
  }
}

function readUiTheme(): UiThemeId {
  try {
    return parseUiThemeId(localStorage.getItem(STORAGE_KEYS.uiTheme));
  } catch {
    return DEFAULT_PREFERENCES.uiTheme;
  }
}

function writeUiTheme(theme: UiThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.uiTheme, theme);
  } catch {
    // localStorage indisponível
  }
}

export function loadGamePreferences(): GamePreferences {
  try {
    const speedRaw = sessionStorage.getItem(STORAGE_KEYS.autoBattleSpeed);
    return {
      autoBattle: readFlag(STORAGE_KEYS.autoBattle, true),
      autoOpenChests: readFlag(STORAGE_KEYS.autoOpenChests),
      autoEquipLoot: readFlag(STORAGE_KEYS.autoEquipLoot),
      autoBattleSpeed: speedRaw === '3' ? 3 : speedRaw === '2' ? 2 : 1,
      logFilterImportant: readFlag(STORAGE_KEYS.logFilterImportant),
      uiTheme: readUiTheme(),
      musicEnabled: readFlag(STORAGE_KEYS.musicEnabled, true),
      musicVolume: readVolume(STORAGE_KEYS.musicVolume, DEFAULT_PREFERENCES.musicVolume),
      sfxEnabled: readFlag(STORAGE_KEYS.sfxEnabled, true),
      sfxVolume: readVolume(STORAGE_KEYS.sfxVolume, DEFAULT_PREFERENCES.sfxVolume),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveGamePreferences(preferences: GamePreferences): void {
  writeFlag(STORAGE_KEYS.autoBattle, preferences.autoBattle);
  writeFlag(STORAGE_KEYS.autoOpenChests, preferences.autoOpenChests);
  writeFlag(STORAGE_KEYS.autoEquipLoot, preferences.autoEquipLoot);
  writeFlag(STORAGE_KEYS.logFilterImportant, preferences.logFilterImportant);
  writeFlag(STORAGE_KEYS.musicEnabled, preferences.musicEnabled);
  writeVolume(STORAGE_KEYS.musicVolume, preferences.musicVolume);
  writeFlag(STORAGE_KEYS.sfxEnabled, preferences.sfxEnabled);
  writeVolume(STORAGE_KEYS.sfxVolume, preferences.sfxVolume);
  writeUiTheme(preferences.uiTheme);

  try {
    sessionStorage.setItem(STORAGE_KEYS.autoBattleSpeed, String(preferences.autoBattleSpeed));
  } catch {
    // sessionStorage indisponível
  }
}

export function updateGamePreference<K extends keyof GamePreferences>(
  key: K,
  value: GamePreferences[K],
): GamePreferences {
  const next = { ...loadGamePreferences(), [key]: value };
  saveGamePreferences(next);
  if (key === 'uiTheme') {
    applyUiTheme(next.uiTheme);
  }
  return next;
}

/** Aplica o tema salvo no DOM (bootstrap do painel). */
export function applyStoredUiTheme(): UiThemeId {
  const theme = loadGamePreferences().uiTheme;
  applyUiTheme(theme);
  return theme;
}
