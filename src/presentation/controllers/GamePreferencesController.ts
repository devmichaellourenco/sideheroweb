import { FeatureFlagsDto } from '../../application/dto/FeatureFlagsDto';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { COMBAT_DELTA_SECONDS } from '../../domain/combat/CombatTimingConstants';
import { getFeatureFlags } from '../helpers/FeatureFlagsHelper';
import {
  GamePreferences,
  loadGamePreferences,
  saveGamePreferences,
  updateGamePreference,
} from '../components/GamePreferences';

export class GamePreferencesController {
  preferences: GamePreferences = loadGamePreferences();
  autoBattleEnabled = false;
  autoOpenChests = false;
  autoEquipLoot = false;
  autoBattleSpeed: GamePreferences['autoBattleSpeed'] = 1;
  logFilterImportant = false;
  uiTheme: GamePreferences['uiTheme'] = 'dark';
  musicEnabled = true;
  musicVolume = 0.55;
  sfxEnabled = true;
  sfxVolume = 0.75;

  apply(state: GameStateDto | null): { autoBattleChanged: boolean } {
    const flags = getFeatureFlags(state);
    const clamped = this.clampToFlags(loadGamePreferences(), flags);
    const wasAutoBattle = this.autoBattleEnabled;
    const wasSpeed = this.autoBattleSpeed;

    this.preferences = clamped;
    this.autoBattleEnabled = clamped.autoBattle && flags.autoBattle;
    this.autoOpenChests = clamped.autoOpenChests && flags.autoOpenChests;
    this.autoEquipLoot = clamped.autoEquipLoot && flags.autoEquipLoot;
    this.autoBattleSpeed = Math.min(
      clamped.autoBattleSpeed,
      flags.autoBattleMaxSpeed,
    ) as GamePreferences['autoBattleSpeed'];
    this.logFilterImportant = clamped.logFilterImportant && flags.logFilter;
    this.uiTheme = clamped.uiTheme;
    this.musicEnabled = clamped.musicEnabled;
    this.musicVolume = clamped.musicVolume;
    this.sfxEnabled = clamped.sfxEnabled;
    this.sfxVolume = clamped.sfxVolume;

    const autoBattleChanged =
      wasAutoBattle !== this.autoBattleEnabled || wasSpeed !== this.autoBattleSpeed;

    return { autoBattleChanged };
  }

  enforceGates(state: GameStateDto | null): void {
    const clamped = this.clampToFlags(this.preferences, getFeatureFlags(state));
    if (JSON.stringify(clamped) === JSON.stringify(this.preferences)) return;
    saveGamePreferences(clamped);
    this.apply(state);
  }

  canChange(key: keyof GamePreferences, state: GameStateDto | null): boolean {
    const flags = getFeatureFlags(state);
    switch (key) {
      case 'autoBattle':
      case 'autoBattleSpeed':
        return flags.autoBattle;
      case 'autoOpenChests':
        return flags.autoOpenChests;
      case 'autoEquipLoot':
        return flags.autoEquipLoot;
      case 'logFilterImportant':
        return flags.logFilter;
      case 'uiTheme':
      case 'musicEnabled':
      case 'musicVolume':
      case 'sfxEnabled':
      case 'sfxVolume':
        return true;
      default:
        return true;
    }
  }

  update<K extends keyof GamePreferences>(
    key: K,
    value: GamePreferences[K],
    state: GameStateDto | null,
  ): { applied: boolean; autoBattleChanged: boolean } {
    if (!this.canChange(key, state)) {
      return { applied: false, autoBattleChanged: false };
    }

    const next = updateGamePreference(key, value);
    this.preferences = next;
    const result = this.apply(state);
    return { applied: true, autoBattleChanged: result.autoBattleChanged };
  }

  getAutoBattleIntervalMs(state: GameStateDto | null): number {
    const flags = getFeatureFlags(state);
    const speed = Math.min(this.autoBattleSpeed, flags.autoBattleMaxSpeed);
    // 1× = 1s de parede por COMBAT_DELTA_SECONDS de simulação (TTA/CD em tempo real).
    return Math.floor((COMBAT_DELTA_SECONDS * 1000) / speed);
  }

  private clampToFlags(preferences: GamePreferences, flags: FeatureFlagsDto): GamePreferences {
    return {
      autoBattle: flags.autoBattle ? preferences.autoBattle : false,
      autoOpenChests: flags.autoOpenChests ? preferences.autoOpenChests : false,
      autoEquipLoot: flags.autoEquipLoot ? preferences.autoEquipLoot : false,
      autoBattleSpeed: Math.min(
        preferences.autoBattleSpeed,
        flags.autoBattleMaxSpeed,
      ) as GamePreferences['autoBattleSpeed'],
      logFilterImportant: flags.logFilter ? preferences.logFilterImportant : false,
      uiTheme: preferences.uiTheme === 'light' ? 'light' : 'dark',
      musicEnabled: preferences.musicEnabled,
      musicVolume: Math.max(0, Math.min(1, preferences.musicVolume)),
      sfxEnabled: preferences.sfxEnabled,
      sfxVolume: Math.max(0, Math.min(1, preferences.sfxVolume)),
    };
  }
}
