import type { SystemsMenuId } from '../flows/SystemsMenuNavigation';

export type MenuTooltipQuickActionId = 'chest' | 'chest-all' | 'optimize';

export type MenuTooltipId = SystemsMenuId | MenuTooltipQuickActionId;

export type MenuTooltipCopy = {
  title: string;
  flavor: string;
};

export const MENU_TOOLTIP_COPY: Record<MenuTooltipId, MenuTooltipCopy> = {
  heroes: {
    title: 'Heróis',
    flavor: 'Abre as fichas, skills e ascensões da companhia.',
  },
  formation: {
    title: 'Formação',
    flavor: 'Escolhe quem luta na linha de frente.',
  },
  log: {
    title: 'Log de batalha',
    flavor: 'Mostra golpes, curas e recompensas desta luta.',
  },
  stats: {
    title: 'Estatísticas',
    flavor: 'Mostra dano, cura e recarga desta batalha.',
  },
  campaign: {
    title: 'Mapa',
    flavor: 'Abre missões e o próximo desafio da jornada.',
  },
  shop: {
    title: 'Loja',
    flavor: 'Compra ofertas do acampamento com ouro.',
  },
  inventory: {
    title: 'Inventário',
    flavor: 'Equipa o que os heróis vão vestir.',
  },
  stash: {
    title: 'Baús',
    flavor: 'Guarda itens além da mochila dos heróis.',
  },
  forge: {
    title: 'Forja Divina',
    flavor: 'Funde relíquias em equipamento superior.',
  },
  upgrades: {
    title: 'Runas',
    flavor: 'Compra melhorias permanentes do acampamento.',
  },
  achievements: {
    title: 'Achievements',
    flavor: 'Mostra marcos e feitos da jornada.',
  },
  settings: {
    title: 'Configurações',
    flavor: 'Ajusta automações, tema do painel e backup.',
  },
  chest: {
    title: 'Abrir baú',
    flavor: 'Revela o loot acumulado nas vitórias.',
  },
  'chest-all': {
    title: 'Abrir todos',
    flavor: 'Abre a fila de baús de uma só vez.',
  },
  optimize: {
    title: 'Otimizar equipe',
    flavor: 'Equipa automaticamente o melhor gear disponível.',
  },
};

export function isMenuTooltipId(value: string): value is MenuTooltipId {
  return value in MENU_TOOLTIP_COPY;
}

export function getMenuTooltipCopy(id: MenuTooltipId): MenuTooltipCopy {
  return MENU_TOOLTIP_COPY[id];
}
