/**
 * Animações de ataque do corpo do herói (spritesheet no slot da strip).
 * Distinto do VFX de skill no alvo (`SkillVfxCatalog`).
 */

export interface HeroAttackAnimSheet {
  /** Caminho sob `assets/` (após copy-assets). */
  path: string;
  columns: number;
  rows: number;
  /** Duração de um ciclo completo da folha. */
  frameDurationMs: number;
}

/** Portrait estático → skillId → folha de ataque. */
const ATTACK_ANIMS_BY_SPRITE: Record<string, Partial<Record<string, HeroAttackAnimSheet>>> = {
  'characters/galneon_aprendiz.png': {
    basic_attack: {
      path: 'characters/galneon_aprendiz_basic_attack_sheet.png',
      columns: 4,
      rows: 2,
      frameDurationMs: 560,
    },
  },
  'characters/elara_aprendiz.png': {
    basic_attack: {
      path: 'characters/elara_aprendiz_basic_attack_sheet.png',
      columns: 4,
      rows: 2,
      frameDurationMs: 560,
    },
  },
  'characters/nix_aprendiz.png': {
    basic_attack: {
      path: 'characters/nix_aprendiz_basic_attack_sheet.png',
      columns: 4,
      rows: 2,
      frameDurationMs: 560,
    },
  },
};

/** Extrai `characters/....png` de um URL de asset do painel. */
export function extractCharacterSpritePath(src: string): string | null {
  const match = src.match(/characters\/[^/?#]+\.png/i);
  return match ? match[0].replace(/\\/g, '/') : null;
}

export function getHeroAttackAnimSheet(
  staticSpritePath: string,
  skillId: string,
): HeroAttackAnimSheet | null {
  return ATTACK_ANIMS_BY_SPRITE[staticSpritePath]?.[skillId] ?? null;
}

export function listHeroAttackAnimSpritePaths(): string[] {
  return Object.keys(ATTACK_ANIMS_BY_SPRITE);
}
