/**
 * Tokens canônicos do tema Side Hero.
 * Light = pergaminho + tinta. Dark = inversão harmônica (fundo↔texto) + acentos
 * legíveis no escuro. Espelhar light em `:root` e dark em `html[data-ui-theme='dark']`.
 *
 * Regra: variável = contexto de uso (não só o hex).
 */
export type UiThemeId = 'light' | 'dark';

export const UI_THEME_IDS: readonly UiThemeId[] = ['light', 'dark'] as const;

export const MEDIEVAL_THEME = {
  /* —— Base chrome —— */
  sealGold: '#c9a227',
  sealGoldDark: '#8a6510',
  parchment0: '#fff9ed',
  parchment1: '#f3e4bc',
  parchment2: '#e8d4a0',
  /** Poço atrás de sprites: dourado → creme (não branco prateado). */
  iconWell: '#e8d4a0',
  iconWellDeep: '#c9a050',
  iconWellBorder: '#c9a227',
  ink: '#1f1710',
  inkMuted: '#3d3428',
  forest: '#2f6b38',
  forestHi: '#3f8a49',
  bg: '#f3e4bc',
  surface: '#fff9ed',
  accent: '#8b3a2f',
  text: '#1f1710',
  muted: '#3d3428',
  strip: '#2a2118',
  floor: '#3d2e1f',

  /* —— Semântica chrome —— */
  danger: '#8a2828',
  info: '#1a5a8a',
  crit: '#8a6510',
  elementFire: '#b85a10',
  elementCold: '#156a8a',
  elementLightning: '#8a7010',
  elementAir: '#3f7f73',
  /** Roxo da legenda "Heróis" na árvore — não acoplar a elemento Ar. */
  legendHeroes: '#6a3a8a',
  /** Título do caminho de ascensão arcano — não acoplar a elemento Ar. */
  ascensionArcane: '#6a3a8a',

  /* —— CTA / rótulos sobre cor —— */
  forestCtaLabel: '#fff9ed',
  onAccentLabel: '#ffffff',
  onDarkGoldLabel: '#ffe6a8',
  onDarkMutedLabel: '#b8c8e8',
  onDarkIceLabel: '#d8e4ff',
  onDarkWarmLabel: '#ffe08a',
  onDarkBrightGoldLabel: '#ffe9a8',

  /* —— Badges comparação inventário —— */
  badgeUpgradeInk: '#0f1f12',
  badgeUpgradeFill: '#7ee787',
  badgeDowngradeFill: '#ff6b6b',
  destroyActionLabel: '#ffcdd2',
  metaOwnedLabel: '#9dffb0',
  skillChipOk: '#8fd694',
  skillChipBad: '#e88a8a',
  emptySlotMuted: '#9aa3b2',
  rosterActiveLabel: '#9dffb0',

  /* —— Barras HP / XP (contexto HUD) —— */
  hpFillStart: '#2d7a3e',
  hpFillMid: '#4caf6a',
  hpFillEnd: '#8be8a8',
  xpFillMid: '#f5d76e',
  xpFillEnd: '#ffe9a8',

  /* —— Scrollbar —— */
  scrollbarThumb: '#c9892f',
  scrollbarThumbHi: '#f8d56b',
  scrollbarThumbLo: '#a56f22',
  scrollbarThumbHoverHi: '#ffe494',

  /* —— Toast / Wow —— */
  toastOnDarkLabel: '#ffe6a8',
  wowProgressGoldStart: '#d4a82a',
  wowProgressGoldEnd: '#f5c542',
  toastVictoryDeep: '#6b241c',
  metaCtaDeep: '#6b241c',

  /* —— Battle strip / floats —— */
  stripSkyStart: '#1a3a5c',
  floatDamage: '#ff3d5c',
  floatFire: '#ff7a1a',
  floatCold: '#42d8ff',
  floatLightning: '#fff44d',
  floatAir: '#7ee8d0',
  floatCrit: '#ffcc00',
  floatCritBuff: '#ffcc00',
  floatCritHeal: '#fff44d',
  floatHeal: '#2dffb0',
  floatLevelUp: '#ffe566',
  waveMarkerGoldLabel: '#ffe9a8',
  waveMarkerEliteLabel: '#d4a0ff',
  waveMarkerBossLabel: '#ffe08a',
  enemyResistLabel: '#9fd4ff',
  elementPipFire: '#ff8c42',
  elementPipCold: '#5eb8ff',
  elementPipLightning: '#c9a0ff',
  elementPipAir: '#5fc9b0',
  elementPipPhysical: '#c8c8c8',
  resistStrongLabel: '#b8d8ff',
  resistWeakLabel: '#ffc0c0',

  /* —— Campanha / mapas —— */
  mapStendra: '#6ecf8a',
  mapGruftall: '#a89b8c',
  mapGruftallTooltip: '#9a8b7a',
  mapValdris: '#6eb8ff',
  mapMorthaven: '#a98cff',
  mapBrokenSky: '#58d7e8',
  mapCrimsonAbyss: '#ff6b6b',
  mapEternalForge: '#ff9a4a',
  mapAncientGrove: '#7fd46a',
  mapTwilightTower: '#b07cff',
  mapVoidThrone: '#f5c542',
} as const;

/**
 * Tema escuro: fundo ← tinta do claro; texto ← pergaminho do claro;
 * acentos clareados/saturados para contraste no escuro.
 * Battle tokens espelhados iguais ao light (batalha isolada no CSS).
 */
export const MEDIEVAL_THEME_DARK: { readonly [K in keyof typeof MEDIEVAL_THEME]: string } = {
  /* Fundo = tinta; superfície = madeira do strip claro; texto = pergaminho */
  sealGold: '#e0c050',
  sealGoldDark: '#c9a227',
  parchment0: '#2a2118',
  parchment1: '#1f1710',
  parchment2: '#16110c',
  /* Poço de ícone: dourado → creme (contraste sem fundo branco) */
  iconWell: '#e8d4a0',
  iconWellDeep: '#c9a050',
  iconWellBorder: '#c9a227',
  ink: '#fff9ed',
  inkMuted: '#d4c4a0',
  forest: '#4a9e58',
  forestHi: '#5cb86a',
  bg: '#1f1710',
  surface: '#2a2118',
  accent: '#c45a4e',
  text: '#fff9ed',
  muted: '#d4c4a0',
  strip: '#0f0c0a',
  floor: '#1a1410',

  danger: '#e07070',
  info: '#5a9fd4',
  crit: '#e0c050',
  elementFire: '#ff9a4a',
  elementCold: '#5eb8ff',
  elementLightning: '#e8d060',
  elementAir: '#78cbb8',
  legendHeroes: '#c9a0ff',
  ascensionArcane: '#c9a0ff',

  forestCtaLabel: '#fff9ed',
  onAccentLabel: '#ffffff',
  onDarkGoldLabel: '#ffe6a8',
  onDarkMutedLabel: '#b8c8e8',
  onDarkIceLabel: '#d8e4ff',
  onDarkWarmLabel: '#ffe08a',
  onDarkBrightGoldLabel: '#ffe9a8',

  badgeUpgradeInk: '#0f1f12',
  badgeUpgradeFill: '#7ee787',
  badgeDowngradeFill: '#ff8a8a',
  destroyActionLabel: '#ffcdd2',
  metaOwnedLabel: '#9dffb0',
  skillChipOk: '#8fd694',
  skillChipBad: '#e88a8a',
  emptySlotMuted: '#9aa3b2',
  rosterActiveLabel: '#9dffb0',

  hpFillStart: '#2d7a3e',
  hpFillMid: '#4caf6a',
  hpFillEnd: '#8be8a8',
  xpFillMid: '#f5d76e',
  xpFillEnd: '#ffe9a8',

  scrollbarThumb: '#d4a82a',
  scrollbarThumbHi: '#ffe494',
  scrollbarThumbLo: '#c9892f',
  scrollbarThumbHoverHi: '#fff0b0',

  toastOnDarkLabel: '#ffe6a8',
  wowProgressGoldStart: '#d4a82a',
  wowProgressGoldEnd: '#f5c542',
  toastVictoryDeep: '#8a3028',
  metaCtaDeep: '#8a3028',

  /* Battle: iguais ao light (CSS também isola .battle-stage) */
  stripSkyStart: MEDIEVAL_THEME.stripSkyStart,
  floatDamage: MEDIEVAL_THEME.floatDamage,
  floatFire: MEDIEVAL_THEME.floatFire,
  floatCold: MEDIEVAL_THEME.floatCold,
  floatLightning: MEDIEVAL_THEME.floatLightning,
  floatAir: MEDIEVAL_THEME.floatAir,
  floatCrit: MEDIEVAL_THEME.floatCrit,
  floatCritBuff: MEDIEVAL_THEME.floatCritBuff,
  floatCritHeal: MEDIEVAL_THEME.floatCritHeal,
  floatHeal: MEDIEVAL_THEME.floatHeal,
  floatLevelUp: MEDIEVAL_THEME.floatLevelUp,
  waveMarkerGoldLabel: MEDIEVAL_THEME.waveMarkerGoldLabel,
  waveMarkerEliteLabel: MEDIEVAL_THEME.waveMarkerEliteLabel,
  waveMarkerBossLabel: MEDIEVAL_THEME.waveMarkerBossLabel,
  enemyResistLabel: MEDIEVAL_THEME.enemyResistLabel,
  elementPipFire: MEDIEVAL_THEME.elementPipFire,
  elementPipCold: MEDIEVAL_THEME.elementPipCold,
  elementPipLightning: MEDIEVAL_THEME.elementPipLightning,
  elementPipAir: MEDIEVAL_THEME.elementPipAir,
  elementPipPhysical: MEDIEVAL_THEME.elementPipPhysical,
  resistStrongLabel: MEDIEVAL_THEME.resistStrongLabel,
  resistWeakLabel: MEDIEVAL_THEME.resistWeakLabel,

  mapStendra: MEDIEVAL_THEME.mapStendra,
  mapGruftall: MEDIEVAL_THEME.mapGruftall,
  mapGruftallTooltip: MEDIEVAL_THEME.mapGruftallTooltip,
  mapValdris: MEDIEVAL_THEME.mapValdris,
  mapMorthaven: MEDIEVAL_THEME.mapMorthaven,
  mapBrokenSky: MEDIEVAL_THEME.mapBrokenSky,
  mapCrimsonAbyss: MEDIEVAL_THEME.mapCrimsonAbyss,
  mapEternalForge: MEDIEVAL_THEME.mapEternalForge,
  mapAncientGrove: MEDIEVAL_THEME.mapAncientGrove,
  mapTwilightTower: MEDIEVAL_THEME.mapTwilightTower,
  mapVoidThrone: MEDIEVAL_THEME.mapVoidThrone,
};

export type MedievalThemeToken = keyof typeof MEDIEVAL_THEME;

export const MEDIEVAL_THEME_BY_ID: Record<UiThemeId, typeof MEDIEVAL_THEME | typeof MEDIEVAL_THEME_DARK> = {
  light: MEDIEVAL_THEME,
  dark: MEDIEVAL_THEME_DARK,
};

/** Aliases semânticos → token canônico (documentação / futuros temas). */
export const MEDIEVAL_THEME_SEMANTICS = {
  damage: 'danger',
  worse: 'danger',
  heal: 'forest',
  better: 'forest',
  critical: 'crit',
  mitigation: 'info',
  skillEmphasis: 'sealGoldDark',
  ctaLabel: 'forestCtaLabel',
  inventoryUpgrade: 'badgeUpgradeFill',
  inventoryDowngrade: 'badgeDowngradeFill',
} as const;

export function parseUiThemeId(raw: string | null | undefined): UiThemeId {
  return raw === 'light' ? 'light' : 'dark';
}
