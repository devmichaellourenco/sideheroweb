export type SkillVfxMotion = 'projectile' | 'melee' | 'aoe' | 'self' | 'rise';

export interface SkillVfxImpactDefinition {
  durationMs: number;
  width: number;
  height: number;
  /** Atraso antes do impacto; padrão = duração do projétil. */
  delayMs?: number;
  /** Arquivo em `public/sprites/skills/svg/`; padrão = `impact_{skillId}.svg`. */
  svgFile?: string;
  /** Folha PNG animada no lugar do SVG de impacto. */
  spriteSheet?: SkillVfxSpriteSheetDefinition;
}

/** Folha de sprites PNG (grade) no lugar do SVG estático. */
export interface SkillVfxSpriteSheetDefinition {
  /** Caminho sob `panel/assets/` (ex.: `skills/vfx/fireball/fireball_sheet.png`). */
  path: string;
  columns: number;
  rows: number;
  /** Duração de um ciclo completo da folha; padrão = durationMs do VFX. */
  frameDurationMs?: number;
}

export interface SkillVfxDefinition {
  skillId: string;
  motion: SkillVfxMotion;
  durationMs: number;
  width: number;
  height: number;
  /** Arquivo em `public/sprites/skills/svg/`; padrão = `{skillId}.svg`. */
  svgFile?: string;
  /** Quando definido, o projétil usa a folha animada em vez do SVG. */
  spriteSheet?: SkillVfxSpriteSheetDefinition;
  /** Rotação do SVG (ex.: raio vertical → projétil horizontal). */
  rotationDeg?: number;
  glow?: 'fire' | 'lightning' | 'heal' | 'slash' | 'cold' | 'holy' | 'poison' | 'arcane' | 'shadow' | 'shield';
  /** Onde ancorar efeitos; `target_column` = coluna do topo da strip até o chão no alvo. */
  placement?: 'caster' | 'target' | 'target_column';
  /** Proporção largura/altura da coluna quando `placement: 'target_column'`. */
  columnAspectRatio?: number;
  /** Enquadramento do SVG dentro do `<object>` (ex.: coluna de nevasca). */
  svgObjectPosition?: string;
  /**
   * Deslocamento vertical em px no ponto de ancoragem.
   * Valores positivos empurram o VFX para baixo (em direção aos pés do alvo).
   */
  offsetY?: number;
  /**
   * Fração da altura do alvo para ancorar o centro do VFX (0 = topo, 0.5 = meio, 1 = base).
   * Padrão: `0.32` (peito) em melee/aoe/projétil; `rise` ancora pela base.
   */
  anchorYRatio?: number;
  impact?: SkillVfxImpactDefinition;
}

const HEAL_VFX: SkillVfxDefinition = {
  skillId: 'minor_heal',
  motion: 'self',
  svgFile: 'heal.svg',
  placement: 'target',
  durationMs: 760,
  width: 108,
  height: 162,
  glow: 'heal',
};

const BLESSING_VFX: SkillVfxDefinition = {
  skillId: 'blessing',
  motion: 'self',
  svgFile: 'blessing.svg',
  placement: 'caster',
  durationMs: 880,
  width: 120,
  height: 140,
  glow: 'holy',
};

const SKILL_VFX_BY_ID: Record<string, SkillVfxDefinition> = {
  basic_attack: {
    skillId: 'basic_attack',
    motion: 'melee',
    svgFile: 'basic_attack.svg',
    placement: 'target',
    durationMs: 380,
    width: 53,
    height: 30,
    glow: 'slash',
  },
  fireball: {
    skillId: 'fireball',
    motion: 'projectile',
    durationMs: 560,
    width: 140,
    height: 80,
    glow: 'fire',
    spriteSheet: {
      path: 'skills/vfx/fireball/fireball_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 360,
    },
    impact: {
      durationMs: 520,
      width: 160,
      height: 136,
      spriteSheet: {
        path: 'skills/vfx/fireball/fireball_impact_sheet.png',
        columns: 9,
        rows: 1,
        frameDurationMs: 520,
      },
    },
  },
  arcane_bolt: {
    skillId: 'arcane_bolt',
    motion: 'projectile',
    durationMs: 480,
    width: 148,
    height: 56,
    glow: 'lightning',
    spriteSheet: {
      path: 'skills/vfx/thunder_bolt/thunder_bolt_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 320,
    },
    impact: {
      durationMs: 480,
      width: 148,
      height: 134,
      spriteSheet: {
        path: 'skills/vfx/thunder_bolt/thunder_bolt_impact_sheet.png',
        columns: 9,
        rows: 1,
        frameDurationMs: 480,
      },
    },
  },
  frost_shard: {
    skillId: 'frost_shard',
    motion: 'rise',
    placement: 'target',
    durationMs: 520,
    width: 132,
    height: 132,
    glow: 'cold',
    /** Folha de impacto é a animação completa (cristal sobe do chão); padding inferior do frame. */
    offsetY: 12,
    spriteSheet: {
      path: 'skills/vfx/frost_shard/frost_shard_impact_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 520,
    },
  },
  inn_fei_spark: {
    skillId: 'inn_fei_spark',
    motion: 'rise',
    placement: 'target',
    durationMs: 480,
    width: 132,
    height: 132,
    glow: 'fire',
    offsetY: 12,
    spriteSheet: {
      path: 'skills/vfx/inn_fei_spark/inn_fei_spark_sheet.png',
      columns: 3,
      rows: 2,
      frameDurationMs: 480,
    },
  },
  power_attack: {
    skillId: 'power_attack',
    motion: 'melee',
    placement: 'target',
    durationMs: 420,
    width: 160,
    height: 160,
    glow: 'slash',
    /** Centro do hitbox do inimigo. */
    anchorYRatio: 0.5,
    spriteSheet: {
      path: 'skills/vfx/power_attack/power_attack.png',
      columns: 3,
      rows: 2,
      frameDurationMs: 420,
    },
  },
  thrust: {
    skillId: 'thrust',
    motion: 'melee',
    svgFile: 'thrust.svg',
    placement: 'target',
    durationMs: 340,
    width: 200,
    height: 80,
    glow: 'slash',
  },
  blessing: BLESSING_VFX,
  smite: {
    skillId: 'smite',
    motion: 'melee',
    svgFile: 'smite.svg',
    placement: 'target',
    durationMs: 400,
    width: 160,
    height: 120,
    glow: 'holy',
  },
  mil_guer_cleave: {
    skillId: 'mil_guer_cleave',
    motion: 'aoe',
    svgFile: 'cleave.svg',
    placement: 'target',
    durationMs: 520,
    width: 240,
    height: 108,
    glow: 'slash',
  },
  arc_arq_nova: {
    skillId: 'arc_arq_nova',
    motion: 'aoe',
    svgFile: 'arc_nova.svg',
    placement: 'target',
    durationMs: 620,
    width: 168,
    height: 168,
    glow: 'arcane',
  },
  sag_clr_light: {
    skillId: 'sag_clr_light',
    motion: 'projectile',
    svgFile: 'holy_light.svg',
    rotationDeg: -90,
    durationMs: 380,
    width: 56,
    height: 120,
    glow: 'holy',
  },
  pyro_inferno: {
    skillId: 'pyro_inferno',
    motion: 'aoe',
    svgFile: 'pyro_inferno.svg',
    placement: 'target_column',
    columnAspectRatio: 800 / 600,
    svgObjectPosition: '50% 100%',
    durationMs: 1200,
    width: 170,
    height: 128,
    glow: 'fire',
  },
  pyro_ember: {
    skillId: 'pyro_ember',
    motion: 'projectile',
    svgFile: 'pyro_ember.svg',
    durationMs: 400,
    width: 120,
    height: 56,
    glow: 'fire',
  },
  poison_spit: {
    skillId: 'poison_spit',
    motion: 'projectile',
    svgFile: 'poison_spit.svg',
    durationMs: 380,
    width: 110,
    height: 52,
    glow: 'poison',
  },
  ground_slam: {
    skillId: 'ground_slam',
    motion: 'aoe',
    svgFile: 'ground_slam.svg',
    placement: 'target',
    durationMs: 520,
    width: 200,
    height: 128,
    glow: 'slash',
  },
  dragon_breath: {
    skillId: 'dragon_breath',
    motion: 'aoe',
    svgFile: 'dragon_breath.svg',
    placement: 'target',
    durationMs: 880,
    width: 220,
    height: 110,
    glow: 'fire',
  },
  wraith_drain: {
    skillId: 'wraith_drain',
    motion: 'projectile',
    svgFile: 'wraith_drain.svg',
    rotationDeg: -90,
    durationMs: 420,
    width: 52,
    height: 110,
    glow: 'shadow',
  },
  minor_heal: HEAL_VFX,
  blizzard: {
    skillId: 'blizzard',
    motion: 'aoe',
    svgFile: 'blizzard.svg',
    placement: 'target_column',
    columnAspectRatio: 800 / 600,
    svgObjectPosition: '58% 100%',
    durationMs: 1400,
    width: 170,
    height: 128,
    glow: 'cold',
  },
  wraith_curse: {
    skillId: 'wraith_curse',
    motion: 'self',
    svgFile: 'curse.svg',
    placement: 'target',
    durationMs: 880,
    width: 108,
    height: 108,
    glow: 'shadow',
  },
  arc_arq_rift: {
    skillId: 'arc_arq_rift',
    motion: 'projectile',
    svgFile: 'arc_rift.svg',
    durationMs: 440,
    width: 88,
    height: 88,
    glow: 'arcane',
  },
  inn_sob_comet: {
    skillId: 'inn_sob_comet',
    motion: 'projectile',
    svgFile: 'comet.svg',
    durationMs: 460,
    width: 130,
    height: 72,
    glow: 'holy',
  },
  oracle_sanctuary: {
    skillId: 'oracle_sanctuary',
    motion: 'self',
    svgFile: 'sanctuary.svg',
    placement: 'caster',
    durationMs: 1000,
    width: 140,
    height: 150,
    glow: 'holy',
  },
  vid_gua_aegis: {
    skillId: 'vid_gua_aegis',
    motion: 'self',
    svgFile: 'aegis.svg',
    placement: 'caster',
    durationMs: 920,
    width: 112,
    height: 135,
    glow: 'shield',
  },
  mil_gen_decree: {
    skillId: 'mil_gen_decree',
    motion: 'melee',
    svgFile: 'decree.svg',
    placement: 'target',
    durationMs: 480,
    width: 150,
    height: 130,
    glow: 'holy',
  },
  mar_gla_bleed: {
    skillId: 'mar_gla_bleed',
    motion: 'melee',
    svgFile: 'bleed.svg',
    placement: 'target',
    durationMs: 400,
    width: 200,
    height: 90,
    glow: 'slash',
  },
  sag_san_grace: {
    skillId: 'sag_san_grace',
    motion: 'self',
    svgFile: 'radiance.svg',
    placement: 'target',
    durationMs: 900,
    width: 120,
    height: 140,
    glow: 'heal',
  },
  inn_fil_storm: {
    skillId: 'inn_fil_storm',
    motion: 'aoe',
    svgFile: 'ether_storm.svg',
    placement: 'target_column',
    columnAspectRatio: 800 / 520,
    svgObjectPosition: '50% 100%',
    durationMs: 1100,
    width: 170,
    height: 128,
    glow: 'arcane',
  },
  mar_mes_flow: {
    skillId: 'mar_mes_flow',
    motion: 'melee',
    svgFile: 'martial_flow.svg',
    placement: 'target',
    durationMs: 320,
    width: 200,
    height: 88,
    glow: 'slash',
  },
};

const SKILL_VFX_ALIASES: Record<string, string> = {
  oracle_mend: 'minor_heal',
  regenerate: 'minor_heal',
  sag_alt_radiance: 'minor_heal',
  vid_clr_touch: 'minor_heal',
  vid_clr_renew: 'minor_heal',
  sag_clr_ward: 'blessing',
  arc_mag_ward: 'blessing',
  mil_guer_rally: 'blessing',
  mil_cap_order: 'blessing',
  mil_gen_banner: 'blessing',
  sag_alt_chorus: 'blessing',
  sag_clr_smite: 'smite',
  sag_san_judgment: 'smite',
  inquisitor_judgment: 'smite',
  arc_mag_bolt: 'arcane_bolt',
  arcane_surge: 'arcane_bolt',
  arcane_focus: 'arcane_bolt',
  arcane_touch: 'arcane_bolt',
  goblin_stab: 'thrust',
  mil_cap_lance: 'thrust',
  orc_smash: 'power_attack',
  mar_gla_slash: 'power_attack',
  wild_bite: 'basic_attack',
  dragon_bite: 'basic_attack',
  reaver_cleave: 'mil_guer_cleave',
  mil_gen_siege: 'mil_guer_cleave',
  mar_cam_cyclone: 'mil_guer_cleave',
  arc_imp_storm: 'arc_arq_nova',
  saci_wind: 'arc_arq_nova',
  saci_fire: 'pyro_ember',
  inn_fei_flame: 'pyro_ember',
  inquisitor_flame: 'pyro_ember',
  frost_breath: 'blizzard',
  slime_acid: 'poison_spit',
  arc_mag_weave: 'wraith_curse',
  arc_arq_bind: 'wraith_curse',
  mar_gla_feint: 'wraith_curse',
  inn_sob_veil: 'wraith_curse',
  inn_fei_whisper: 'wraith_curse',
  mil_cap_phalanx: 'wraith_curse',
  inn_fil_ether: 'arc_arq_rift',
  inn_sob_lance: 'inn_sob_comet',
  sag_alt_sanctuary: 'oracle_sanctuary',
  vid_clr_bloom: 'oracle_sanctuary',
  mil_guer_hold: 'vid_gua_aegis',
  mar_mes_zen: 'vid_gua_aegis',
  arc_imp_decree: 'mil_gen_decree',
  mar_cam_crown: 'mil_gen_decree',
  vid_gua_pulse: 'sag_san_grace',
  vid_fil_rebirth: 'sag_san_grace',
  vid_fil_aurora: 'sag_san_grace',
  vid_fil_dawn: 'sag_san_grace',
  inn_fil_ascend: 'sag_san_grace',
  mar_cam_glory: 'sag_san_grace',
  vid_gua_spring: 'sag_san_grace',
  mar_mes_rebuke: 'mar_mes_flow',
  arc_imp_crown: 'blessing',
  sag_san_benediction: 'blessing',
};

export function getSkillVfxDefinition(skillId: string): SkillVfxDefinition | null {
  const baseId = SKILL_VFX_ALIASES[skillId] ?? skillId;
  const definition = SKILL_VFX_BY_ID[baseId];
  if (!definition) return null;
  if (skillId === baseId) return definition;
  return { ...definition, skillId };
}

/** SVG animado em `public/sprites/skills/svg/{skillId}.svg` → `panel/assets/skills/svg/`. */
export function getSkillVfxSvgPath(skillId: string, svgFile?: string): string {
  return `skills/svg/${svgFile ?? `${skillId}.svg`}`;
}

/** Folha PNG em `public/sprites/skills/vfx/...` → `panel/assets/skills/vfx/...`. */
export function getSkillVfxSpriteSheetPath(
  sheet?: SkillVfxSpriteSheetDefinition,
): string | null {
  return sheet?.path ?? null;
}

/** Impacto em `public/sprites/skills/svg/impact_{skillId}.svg` (ou nome custom no catálogo). */
export function getSkillVfxImpactSvgPath(
  skillId: string,
  impact?: SkillVfxImpactDefinition,
): string | null {
  if (!impact) return null;
  const file = impact.svgFile ?? `impact_${skillId}.svg`;
  return `skills/svg/${file}`;
}

export function listSkillVfxIds(): string[] {
  return Object.keys(SKILL_VFX_BY_ID);
}
