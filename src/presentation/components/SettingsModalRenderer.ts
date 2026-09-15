import { GameStateDto } from '../../application/dto/GameStateDto';
import { parseUiThemeId, type UiThemeId } from '../theme/MedievalThemeTokens';
import { GamePreferences } from './GamePreferences';

export type SettingsModalHandlers = {
  onPreferenceChange: <K extends keyof GamePreferences>(
    key: K,
    value: GamePreferences[K],
  ) => void;
  onOpenUpgrades: () => void;
  onExportSave?: () => void;
  onImportSave?: () => void;
};

export class SettingsModalRenderer {
  render(
    container: HTMLElement,
    state: GameStateDto,
    preferences: GamePreferences,
    handlers: SettingsModalHandlers,
  ): void {
    container.innerHTML = `
      <p class="settings-intro">Auto-batalha já vem ativa. Outras automações exigem Runas.</p>
      <div class="settings-list">
        ${this.renderThemeSelect(preferences)}
        ${this.renderToggle({
          key: 'musicEnabled',
          title: 'Música',
          hint: 'Trilha de acampamento e batalha',
          unlocked: true,
          checked: preferences.musicEnabled,
        })}
        ${this.renderMusicVolume(preferences)}
        ${this.renderToggle({
          key: 'sfxEnabled',
          title: 'Efeitos sonoros',
          hint: 'Cliques de menu, confirmar e fechar',
          unlocked: true,
          checked: preferences.sfxEnabled,
        })}
        ${this.renderSfxVolume(preferences)}
        ${this.renderToggle({
          key: 'autoBattle',
          title: 'Auto-batalha',
          hint: 'Avança batalhas automaticamente',
          unlocked: state.featureFlags.autoBattle,
          checked: preferences.autoBattle,
        })}
        <!-- AUTO-ABRIR BAÚS DESATIVADO (2026-08): toggle removido -->
        ${this.renderToggle({
          key: 'autoEquipLoot',
          title: 'Auto-equipar loot',
          hint: 'Equipa itens recomendados sem abrir modal',
          unlocked: state.featureFlags.autoEquipLoot,
          checked: preferences.autoEquipLoot,
        })}
        ${this.renderToggle({
          key: 'logFilterImportant',
          title: 'Log resumido',
          hint: 'Mostra só vitórias, baús e equipamentos',
          unlocked: state.featureFlags.logFilter,
          checked: preferences.logFilterImportant,
        })}
        ${this.renderSpeedSelect(state, preferences)}
      </div>
      <section class="settings-backup" aria-label="Backup do save">
        <h3 class="settings-backup-title">Backup do progresso</h3>
        <p class="settings-backup-hint">
          Exporte um arquivo criptografado para guardar fora da extensão. Útil antes de reinstalar.
        </p>
        <div class="settings-backup-actions">
          <button type="button" class="primary-btn settings-backup-btn" data-export-save>
            Exportar save
          </button>
          <button type="button" class="settings-backup-btn settings-backup-btn--secondary" data-import-save>
            Importar save
          </button>
        </div>
      </section>
      <p class="settings-hint">Atalho: <kbd>Espaço</kbd> avança batalha (com painel focado)</p>
    `;

    container.querySelectorAll('[data-pref]').forEach((element) => {
      const key = element.getAttribute('data-pref') as keyof GamePreferences;
      if (!key) return;

      if (element instanceof HTMLInputElement && element.type === 'range') {
        if (element.disabled) return;
        element.addEventListener('input', () => {
          if (key !== 'musicVolume' && key !== 'sfxVolume') return;
          handlers.onPreferenceChange(
            key,
            Number(element.value) as GamePreferences[typeof key],
          );
        });
        return;
      }

      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        if (element.disabled) return;
        element.addEventListener('change', () => {
          handlers.onPreferenceChange(key, element.checked as GamePreferences[typeof key]);
        });
        return;
      }

      if (element instanceof HTMLSelectElement) {
        if (element.disabled) return;
        element.addEventListener('change', () => {
          if (key === 'autoBattleSpeed') {
            const speed = Number(element.value) === 3 ? 3 : Number(element.value) === 2 ? 2 : 1;
            handlers.onPreferenceChange('autoBattleSpeed', speed as GamePreferences['autoBattleSpeed']);
            return;
          }
          if (key === 'uiTheme') {
            handlers.onPreferenceChange('uiTheme', parseUiThemeId(element.value));
          }
        });
      }
    });

    container.querySelector('[data-open-upgrades]')?.addEventListener('click', () => {
      handlers.onOpenUpgrades();
    });

    container.querySelector('[data-export-save]')?.addEventListener('click', () => {
      handlers.onExportSave?.();
    });

    container.querySelector('[data-import-save]')?.addEventListener('click', () => {
      handlers.onImportSave?.();
    });
  }

  private renderToggle(options: {
    key: keyof GamePreferences;
    title: string;
    hint: string;
    unlocked: boolean;
    checked: boolean;
  }): string {
    if (!options.unlocked) {
      return `
        <div class="settings-item settings-item-locked">
          <span class="settings-item-text">
            <strong>${options.title}</strong>
            <small>Desbloqueie em <button type="button" class="settings-link-btn" data-open-upgrades>Runas</button></small>
          </span>
        </div>
      `;
    }

    return `
      <label class="settings-item">
        <input type="checkbox" data-pref="${options.key}" ${options.checked ? 'checked' : ''} />
        <span class="settings-item-text">
          <strong>${options.title}</strong>
          <small>${options.hint}</small>
        </span>
      </label>
    `;
  }

  private renderThemeSelect(preferences: GamePreferences): string {
    const options: { value: UiThemeId; label: string }[] = [
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Escuro' },
    ];
    const selected = preferences.uiTheme === 'light' ? 'light' : 'dark';

    return `
      <label class="settings-item settings-item-select">
        <span class="settings-item-text">
          <strong>Tema do painel</strong>
          <small>A batalha permanece no visual atual</small>
        </span>
        <select data-pref="uiTheme" class="settings-speed-select" aria-label="Tema do painel">
          ${options
            .map(
              (option) => `
                <option value="${option.value}" ${selected === option.value ? 'selected' : ''}>
                  ${option.label}
                </option>
              `,
            )
            .join('')}
        </select>
      </label>
    `;
  }

  private renderMusicVolume(preferences: GamePreferences): string {
    const volumePercent = Math.round(preferences.musicVolume * 100);
    const disabled = preferences.musicEnabled ? '' : 'disabled';

    return `
      <label class="settings-item settings-item-range">
        <span class="settings-item-text">
          <strong>Volume da música</strong>
          <small>${volumePercent}%</small>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value="${preferences.musicVolume}"
          data-pref="musicVolume"
          class="settings-volume-range"
          aria-label="Volume da música"
          ${disabled}
        />
      </label>
    `;
  }

  private renderSfxVolume(preferences: GamePreferences): string {
    const volumePercent = Math.round(preferences.sfxVolume * 100);
    const disabled = preferences.sfxEnabled ? '' : 'disabled';

    return `
      <label class="settings-item settings-item-range">
        <span class="settings-item-text">
          <strong>Volume dos efeitos</strong>
          <small>${volumePercent}%</small>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value="${preferences.sfxVolume}"
          data-pref="sfxVolume"
          class="settings-volume-range"
          aria-label="Volume dos efeitos sonoros"
          ${disabled}
        />
      </label>
    `;
  }

  private renderSpeedSelect(state: GameStateDto, preferences: GamePreferences): string {
    const maxSpeed = state.featureFlags.autoBattleMaxSpeed;

    const options = [
      { value: 1, label: '1x', enabled: true },
      { value: 2, label: '2x', enabled: maxSpeed >= 2 },
      { value: 3, label: '3x', enabled: maxSpeed >= 3 },
    ];

    const selected = Math.min(preferences.autoBattleSpeed, maxSpeed);

    return `
      <label class="settings-item settings-item-select">
        <span class="settings-item-text">
          <strong>Velocidade da auto-batalha</strong>
          <small>Intervalo entre ticks automáticos</small>
        </span>
        <select data-pref="autoBattleSpeed" class="settings-speed-select" aria-label="Velocidade da auto-batalha">
          ${options
            .map(
              (option) => `
                <option value="${option.value}" ${selected === option.value ? 'selected' : ''} ${option.enabled ? '' : 'disabled'}>
                  ${option.label}${option.enabled ? '' : ' (bloqueado)'}
                </option>
              `,
            )
            .join('')}
        </select>
      </label>
    `;
  }
}
