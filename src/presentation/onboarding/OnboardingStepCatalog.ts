import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

export type OnboardingStepId =
  | 'welcome'
  | 'map-locations'
  | 'map-mission-preview'
  | 'map-start-mission'
  | 'first-chest'
  | 'pause-loadout'
  | 'hero-points'
  | 'first-upgrade'
  | 'open-campaign';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  message: string;
  /** Vazio = card sem spotlight (dica não ancorada). */
  anchorSelector: string;
  kicker?: string;
  confirmLabel?: string;
  variant?: 'welcome';
}

/** Boas-vindas e tutorial do mapa vêm antes das dicas contextuais da primeira batalha. */
export const ONBOARDING_STEP_ORDER: OnboardingStepId[] = [
  'welcome',
  'map-locations',
  'map-mission-preview',
  'map-start-mission',
  'first-chest',
  'hero-points',
  'first-upgrade',
  'open-campaign',
];

/** Passos guiados do mapa na primeira sessão (dispensados ao iniciar a primeira missão). */
export const MAP_TUTORIAL_STEP_IDS: OnboardingStepId[] = [
  'welcome',
  'map-locations',
  'map-mission-preview',
  'map-start-mission',
];

function runeInlineIcon(): string {
  return `<img class="onboarding-inline-icon" src="${getAssetUrl(ASSETS.ui.rune)}" alt="" aria-hidden="true" />`;
}

function chestInlineIcon(): string {
  return `<img class="onboarding-inline-icon" src="${getAssetUrl(ASSETS.ui.chest)}" alt="" aria-hidden="true" />`;
}

export const ONBOARDING_STEPS: Record<OnboardingStepId, Omit<OnboardingStep, 'id'>> = {
  welcome: {
    kicker: 'Bem-vindo',
    title: 'Sua jornada começa aqui',
    message:
      'Nix acaba de chegar a Stendra. As batalhas acontecem sozinhas — o seu papel é escolher onde lutar, equipar a equipe e gastar os pontos com sabedoria. Vamos abrir o mapa e escolher a primeira missão.',
    anchorSelector: '',
    confirmLabel: 'Abrir o mapa',
    variant: 'welcome',
  },
  'map-locations': {
    title: 'Locais do mapa',
    message:
      'Cada pino é um local de Stendra. O pino em destaque é a missão principal, que avança a história; os outros são secundárias e patrulhas normais para ganhar XP, ouro e equipamento. Toque no pino para ver os detalhes.',
    anchorSelector: '.campaign-mission-pin--main',
  },
  'map-mission-preview': {
    title: 'Antes de lutar',
    message:
      'O cartão do local mostra quantas waves, o tier de dificuldade e os inimigos que você vai enfrentar — toque em um inimigo para ver os atributos dele. Use isso para saber se a equipe está pronta.',
    anchorSelector: '.campaign-mission-popover',
  },
  'map-start-mission': {
    title: 'Começar a batalha',
    message:
      'Toque em Iniciar missão para partir. Ao terminar você volta ao acampamento, onde abre baús, equipa itens e gasta Aprimoramento antes de escolher a próxima missão no mapa.',
    anchorSelector: '.campaign-phase-preview-start',
    confirmLabel: 'Vamos lá',
  },
  'first-chest': {
    title: 'Seu primeiro baú',
    message: `Derrotar inimigos enche a barra de baús. Toque no ícone ${chestInlineIcon()} Abrir baú para abrir e ganhar equipamento.`,
    anchorSelector: '#open-chest-btn',
  },
  'pause-loadout': {
    title: 'Acampamento',
    message:
      'Após a batalha você volta ao acampamento para editar equipe, inventário e skills antes da próxima missão no mapa.',
    anchorSelector: '#pause-loadout-btn',
  },
  'hero-points': {
    title: 'Aprimoramento',
    message:
      'Você ganhou Aprimoramento ao subir de nível. Abra Heróis e gaste em Status (atributos) ou Skills (rank).',
    anchorSelector: '#open-heroes-btn',
  },
  'first-upgrade': {
    title: 'Runas do acampamento',
    message: `Há uma runa disponível com o ouro acumulado. Toque em ${runeInlineIcon()} Runas para abrir a árvore.`,
    anchorSelector: '#open-upgrades-btn',
  },
  'open-campaign': {
    title: 'Mapa da campanha',
    message:
      'Toque em Campanha para ver a trilha, escolher a próxima fase e acompanhar os atos da jornada.',
    anchorSelector: '#open-campaign-btn',
  },
};
