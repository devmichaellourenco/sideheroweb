/**
 * Registro OpenGameArt de SFX/UI baixados para o Side Hero.
 * Fonte: export automático de créditos OGA (2026).
 *
 * `inUse: true` — mapeado a arquivo local do projeto.
 * Demais entradas — biblioteca disponível; incluir linha de atribuição se passar a usar.
 */
export type OpenGameArtAudioEntry = {
  id: string;
  title: string;
  author: string;
  sourceUrl: string;
  license: string;
  sourceArchive?: string;
  /** Texto exigido pelo autor/licença quando o asset entra no jogo. */
  attributionLine?: string;
  localFile?: string;
  inUse: boolean;
};

/** Linhas obrigatórias nos créditos do jogo (deduplicadas). CC0 em uso não exige linha. */
export const REQUIRED_AUDIO_ATTRIBUTION_LINES: readonly string[] = [
  "Item Handling by Iwan 'qubodup' Gabovitch http://opengameart.org/users/qubodup",
  'Some of the sounds in this project were created by David McKee (ViRiX) soundcloud.com/virix',
  'Single Key Press Sounds by eklee, qubodup',
  'Guns by Gary <http://fossilrecords.net/> licensed under CC-BY-SA 3.0 <http://creativecommons.org/licenses/by-sa/3.0/> hosted by <http://opengameart.org/>',
  'K.L.Jonasson, Winnipeg, Canada. Triki Minut Interactive www.trikiminut.com',
] as const;

/** Atribuições opcionais (autor agradece, mas não exige). */
export const OPTIONAL_AUDIO_ATTRIBUTION_LINES: readonly string[] = [
  'SFX by Circlerun',
  'Credit "Kenney.nl" or "www.kenney.nl"',
  'Credit to "Roppy Chop Studios"',
  'WobbleBoxx Workshop',
  'qubodup',
] as const;

export const OPENGAMEART_AUDIO_REGISTRY: readonly OpenGameArtAudioEntry[] = [
  {
    id: 'item-handling',
    title: 'Item Handling',
    author: "Iwan 'qubodup' Gabovitch",
    sourceUrl: 'https://opengameart.org/content/item-handling',
    license: 'CC-BY 3.0',
    sourceArchive: 'qubodupItemHandling.7z',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[0],
    inUse: false,
  },
  {
    id: 'ui-sound-effects-pack',
    title: 'UI Sound effects pack',
    author: 'ViRiX (David McKee)',
    sourceUrl: 'https://opengameart.org/content/ui-sound-effects-pack',
    license: 'CC-BY 3.0',
    sourceArchive: 'UI pack 1.zip',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[1],
    inUse: false,
  },
  {
    id: 'click-qubodup',
    title: 'Click',
    author: 'qubodup',
    sourceUrl: 'https://opengameart.org/content/click',
    license: 'CC0',
    sourceArchive: 'click.wav',
    inUse: false,
  },
  {
    id: 'ui-accept-or-forward',
    title: 'UI-Accept or Forward',
    author: 'ViRiX (David McKee)',
    sourceUrl: 'https://opengameart.org/content/ui-accept-or-forward',
    license: 'CC-BY 3.0',
    sourceArchive: 'Accept.mp3',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[1],
    inUse: false,
  },
  {
    id: 'ui-decline-or-back',
    title: 'UI Decline or Back',
    author: 'ViRiX (David McKee)',
    sourceUrl: 'https://opengameart.org/content/ui-decline-or-back',
    license: 'CC-BY 3.0',
    sourceArchive: 'Decline.wav',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[1],
    inUse: false,
  },
  {
    id: 'click-ui-menu-sfx',
    title: 'Click UI Menu SFX (yes/no/select)',
    author: 'qubodup',
    sourceUrl: 'https://opengameart.org/content/click-ui-menu-sfx-yesnoselect',
    license: 'CC0',
    sourceArchive: 'click-ui.7z',
    inUse: true,
  },
  {
    id: 'menu-selection-click',
    title: 'Menu Selection Click',
    author: 'NenadSimic',
    sourceUrl: 'https://opengameart.org/content/menu-selection-click',
    license: 'CC-BY 3.0',
    sourceArchive: 'Menu Selection Click.wav',
    inUse: false,
  },
  {
    id: 'single-key-press-sounds',
    title: 'Single Key Press Sounds',
    author: 'eklee, qubodup',
    sourceUrl: 'https://opengameart.org/content/single-key-press-sounds',
    license: 'CC-BY 3.0',
    sourceArchive: 'eklee-KeyPresses-cc0-opengameart.zip',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[2],
    inUse: false,
  },
  {
    id: 'handling-guns',
    title: 'Handling Guns',
    author: 'Gary',
    sourceUrl: 'https://opengameart.org/content/handling-guns',
    license: 'CC-BY-SA 3.0',
    sourceArchive: 'Gary Guns.zip',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[3],
    inUse: false,
  },
  {
    id: 'sci-fi-open-close-interface',
    title: 'Sci-Fi Open/Close Interface SFX',
    author: 'Triki Minut',
    sourceUrl: 'https://opengameart.org/content/sci-fi-openclose-interface-sfx',
    license: 'CC-BY 3.0 / CC-BY-SA 3.0',
    sourceArchive: 'Open-Close-GUI-sfx_ogg.7z',
    attributionLine: REQUIRED_AUDIO_ATTRIBUTION_LINES[4],
    inUse: false,
  },
  {
    id: '50-rpg-sound-effects',
    title: '50 RPG sound effects',
    author: 'Kenney',
    sourceUrl: 'https://opengameart.org/content/50-rpg-sound-effects',
    license: 'CC0',
    sourceArchive: 'RPGsounds_Kenney.zip',
    attributionLine: OPTIONAL_AUDIO_ATTRIBUTION_LINES[1],
    inUse: false,
  },
  {
    id: 'open-chest',
    title: 'Open Chest',
    author: 'spookymodem',
    sourceUrl: 'https://opengameart.org/content/open-chest',
    license: 'CC-BY 3.0',
    sourceArchive: 'Chest Creak.wav',
    inUse: false,
  },
  {
    id: 'inventory-bag',
    title: 'Inventory Bag',
    author: 'spookymodem',
    sourceUrl: 'https://opengameart.org/content/inventory-bag',
    license: 'CC-BY 3.0',
    sourceArchive: 'Item Received.wav',
    inUse: false,
  },
  {
    id: 'spell-scroll',
    title: 'Spell Scroll',
    author: 'spookymodem',
    sourceUrl: 'https://opengameart.org/content/spell-scroll',
    license: 'CC-BY 3.0',
    sourceArchive: 'Unrolling Parchment.wav',
    inUse: false,
  },
] as const;

/** Mapeamento dos cliques de UI em uso → arquivos do pack qubodup. */
export const IN_USE_UI_CLICK_SOURCES = {
  menu: { sourceFilename: 'select.wav', packId: 'click-ui-menu-sfx' },
  confirm: { sourceFilename: 'yes.wav', packId: 'click-ui-menu-sfx' },
  back: { sourceFilename: 'no.wav', packId: 'click-ui-menu-sfx' },
} as const;

export function getOpenGameArtAudioEntry(id: string): OpenGameArtAudioEntry | undefined {
  return OPENGAMEART_AUDIO_REGISTRY.find((entry) => entry.id === id);
}

export function getInUseOpenGameArtAudioEntries(): OpenGameArtAudioEntry[] {
  return OPENGAMEART_AUDIO_REGISTRY.filter((entry) => entry.inUse);
}

/** Bloco de créditos para exibir em Configurações / README interno. */
export function formatAudioAttributionBlock(): string {
  const lines: string[] = [
    'Side Hero — áudio de terceiros (OpenGameArt)',
    '',
    'Música (CC0 · RandomMind):',
    '- Medieval: Minstrel Dance — https://opengameart.org/content/medieval-minstrel-dance',
    '- Medieval: Battle — https://opengameart.org/content/medieval-battle',
    '',
    'SFX de UI em uso (CC0 · qubodup · Click UI Menu SFX):',
    '- ui_click_menu.ogg ← select.wav',
    '- ui_click_confirm.ogg ← yes.wav',
    '- ui_click_back.ogg ← no.wav',
    '- https://opengameart.org/content/click-ui-menu-sfx-yesnoselect',
    '',
    'Se outros SFX da biblioteca OGA forem adicionados ao jogo, incluir também:',
    ...REQUIRED_AUDIO_ATTRIBUTION_LINES.map((line) => `- ${line}`),
  ];
  return lines.join('\n');
}
