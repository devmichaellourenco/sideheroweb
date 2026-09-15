/**
 * Gerenciamento de abas do Balance Lab.
 * Extrai a lógica de ativação e mount lazy de abas de lab.ts.
 */
import { mountMissionsTab } from './missionBattlesUi';
import { mountPhaseRewardsTab } from './phaseRewardsUi';
import { mountHeroLevelXpTab } from './heroLevelXpUi';
import { mountGearItemsTab } from './gearItemsUi';
import { mountShopsTab } from './shopUi';
import { mountHeroCombatTab } from './heroCombatUi';
import { mountEnemyCombatTab } from './enemyCombatUi';
import { mountUpgradeTreeTab } from './upgradeTreeUi';
import { mountEconomyAuditTab } from './economyAuditUi';
import { mountMaintenanceTab } from './maintenanceUi';
import { setWorkspaceActiveTab, type BalanceLabTab } from './workspaceState';
import { updateHashDeepLink } from './deepLinks';

export type LabTab = Extract<
  BalanceLabTab,
  | 'sim'
  | 'missions'
  | 'xp'
  | 'levels'
  | 'gear'
  | 'shops'
  | 'heroes'
  | 'enemies'
  | 'upgrades'
  | 'economy'
  | 'maintenance'
>;

export interface TabMountState {
  missions: boolean;
  xp: boolean;
  levels: boolean;
  gear: boolean;
  shops: boolean;
  heroes: boolean;
  enemies: boolean;
  upgrades: boolean;
  economy: boolean;
  maintenance: boolean;
}

export interface TabMountOptions {
  state: TabMountState;
  panels: Record<string, HTMLElement | null>;
  onStatus: (msg: string, isError?: boolean) => void;
}

const TAB_PANEL_IDS: Record<LabTab, string> = {
  sim: 'lab-panel-sim',
  missions: 'lab-panel-missions',
  xp: 'lab-panel-xp',
  levels: 'lab-panel-levels',
  gear: 'lab-panel-gear',
  shops: 'lab-panel-shops',
  heroes: 'lab-panel-heroes',
  enemies: 'lab-panel-enemies',
  upgrades: 'lab-panel-upgrades',
  economy: 'lab-panel-economy',
  maintenance: 'lab-panel-maintenance',
};

function togglePanels(activeTab: LabTab): void {
  for (const [tab, panelId] of Object.entries(TAB_PANEL_IDS)) {
    document.getElementById(panelId)?.toggleAttribute('hidden', tab !== activeTab);
  }
}

function toggleTabButtons(activeTab: LabTab): void {
  document.querySelectorAll<HTMLButtonElement>('[data-lab-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.labTab === activeTab);
  });
}

/**
 * Monta (lazy) a aba especificada e ativa o painel correspondente.
 * Retorna uma promise que resolve quando o mount estiver completo.
 */
export async function mountTab(
  tab: LabTab,
  state: TabMountState,
  onStatus: (msg: string, isError?: boolean) => void,
  entityKey?: string,
  entityValue?: string,
): Promise<void> {
  setWorkspaceActiveTab(tab);
  updateHashDeepLink(tab, entityKey, entityValue);
  toggleTabButtons(tab);
  togglePanels(tab);

  if (tab === 'missions' && !state.missions) {
    state.missions = true;
    try {
      await mountMissionsTab();
      onStatus('Aba Missões: edite waves e salve em phase-battle-overrides.json');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar missões', true);
      state.missions = false;
    }
  }

  if (tab === 'xp' && !state.xp) {
    state.xp = true;
    try {
      await mountPhaseRewardsTab();
      onStatus('Aba XP por fase: totais de kill por fase (domínio atual)');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar XP por fase', true);
      state.xp = false;
    }
  }

  if (tab === 'levels' && !state.levels) {
    state.levels = true;
    try {
      await mountHeroLevelXpTab();
      onStatus('Aba XP por nível: curva de level-up dos heróis');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar XP por nível', true);
      state.levels = false;
    }
  }

  if (tab === 'gear' && !state.gear) {
    state.gear = true;
    try {
      await mountGearItemsTab();
      onStatus('Aba Itens: edite nome, raridade, requisitos e stats do catálogo');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar itens', true);
      state.gear = false;
    }
  }

  if (tab === 'shops' && !state.shops) {
    state.shops = true;
    try {
      await mountShopsTab();
      onStatus('Aba Lojas: crie, duplique, edite e exclua lojas');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar lojas', true);
      state.shops = false;
    }
  }

  if (tab === 'heroes' && !state.heroes) {
    state.heroes = true;
    try {
      await mountHeroCombatTab();
      onStatus('Aba Personagens: edite skills, identidade e passivas');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar personagens', true);
      state.heroes = false;
    }
  }

  if (tab === 'enemies' && !state.enemies) {
    state.enemies = true;
    try {
      await mountEnemyCombatTab();
      onStatus('Aba Inimigos: edite identidade e skills de monstro e salve');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar inimigos', true);
      state.enemies = false;
    }
  }

  if (tab === 'upgrades' && !state.upgrades) {
    state.upgrades = true;
    try {
      await mountUpgradeTreeTab();
      onStatus('Aba Melhorias: edite custo, nome e descrição e salve');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar melhorias', true);
      state.upgrades = false;
    }
  }

  if (tab === 'economy' && !state.economy) {
    state.economy = true;
    try {
      await mountEconomyAuditTab();
      onStatus('Aba Economia: ouro por fase + lojas');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar economia', true);
      state.economy = false;
    }
  }

  if (tab === 'maintenance' && !state.maintenance) {
    state.maintenance = true;
    try {
      await mountMaintenanceTab();
      onStatus('Aba Manutenção: promoção de overrides e histórico de backups');
    } catch (err) {
      onStatus(err instanceof Error ? err.message : 'Falha ao carregar manutenção', true);
      state.maintenance = false;
    }
  }
}
