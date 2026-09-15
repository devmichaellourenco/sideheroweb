import type { SystemsMenuId } from '../flows/SystemsMenuNavigation';

export type MenuTooltipQuickActionId = 'chest' | 'chest-all' | 'optimize';

export type MenuTooltipId = SystemsMenuId | MenuTooltipQuickActionId;

export type MenuTooltipKind = 'sistema' | 'acao' | 'registro';

export type MenuTooltipCopy = {
  title: string;
  flavor: string;
  kind: MenuTooltipKind;
};

export const MENU_TOOLTIP_KIND_LABEL: Record<MenuTooltipKind, string> = {
  sistema: 'Sistema',
  acao: 'Ação',
  registro: 'Registro',
};

export const MENU_TOOLTIP_COPY: Record<MenuTooltipId, MenuTooltipCopy> = {
  heroes: {
    title: 'Heróis',
    flavor: 'Fichas, skills e ascensões da companhia.',
    kind: 'sistema',
  },
  formation: {
    title: 'Formação',
    flavor: 'Escolha quem luta na linha de frente.',
    kind: 'sistema',
  },
  log: {
    title: 'Crônica de batalha',
    flavor: 'Golpes, curas e recompensas registrados em pergaminho.',
    kind: 'registro',
  },
  stats: {
    title: 'Estatísticas',
    flavor: 'Dano, cura e desempenho detalhado por skill.',
    kind: 'registro',
  },
  campaign: {
    title: 'Mapa da campanha',
    flavor: 'Missões, rotas e próximos desafios da jornada.',
    kind: 'sistema',
  },
  shop: {
    title: 'Loja',
    flavor: 'Ofertas do acampamento trocadas por ouro.',
    kind: 'sistema',
  },
  inventory: {
    title: 'Inventário',
    flavor: 'Equipamentos prontos para vestir na party.',
    kind: 'sistema',
  },
  stash: {
    title: 'Baú de itens',
    flavor: 'Reserva extra além da mochila dos heróis.',
    kind: 'sistema',
  },
  forge: {
    title: 'Forja Divina',
    flavor: 'Fundir relíquias em gear superior.',
    kind: 'sistema',
  },
  upgrades: {
    title: 'Runas',
    flavor: 'Melhorias permanentes gravadas no acampamento.',
    kind: 'sistema',
  },
  achievements: {
    title: 'Conquistas',
    flavor: 'Marcos da jornada e feitos memoráveis.',
    kind: 'registro',
  },
  settings: {
    title: 'Configurações',
    flavor: 'Automações, tema do painel e backup do save.',
    kind: 'sistema',
  },
  chest: {
    title: 'Abrir baú',
    flavor: 'Revela o loot acumulado nas vitórias.',
    kind: 'acao',
  },
  'chest-all': {
    title: 'Abrir todos',
    flavor: 'Esvazia a fila de baús de uma só vez.',
    kind: 'acao',
  },
  optimize: {
    title: 'Otimizar equipe',
    flavor: 'Equipa automaticamente o melhor gear disponível.',
    kind: 'acao',
  },
};

export function isMenuTooltipId(value: string): value is MenuTooltipId {
  return value in MENU_TOOLTIP_COPY;
}

export function getMenuTooltipCopy(id: MenuTooltipId): MenuTooltipCopy {
  return MENU_TOOLTIP_COPY[id];
}
