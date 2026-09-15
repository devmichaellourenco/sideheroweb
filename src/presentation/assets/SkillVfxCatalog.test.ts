import { describe, expect, it } from 'vitest';
import {
  getSkillVfxDefinition,
  getSkillVfxImpactSvgPath,
  getSkillVfxSvgPath,
  listSkillVfxIds,
} from './SkillVfxCatalog';

describe('SkillVfxCatalog', () => {
  it('registra basic_attack com basic_attack.svg no alvo', () => {
    const definition = getSkillVfxDefinition('basic_attack');
    expect(definition?.motion).toBe('melee');
    expect(definition?.svgFile).toBe('basic_attack.svg');
    expect(definition?.placement).toBe('target');
    expect(getSkillVfxSvgPath('basic_attack', definition?.svgFile)).toBe(
      'skills/svg/basic_attack.svg',
    );
  });

  it('registra fireball com folha de sprites em linha (9x1)', () => {
    expect(listSkillVfxIds()).toContain('fireball');
    const definition = getSkillVfxDefinition('fireball');
    expect(definition?.motion).toBe('projectile');
    expect(definition?.spriteSheet).toEqual({
      path: 'skills/vfx/fireball/fireball_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 360,
    });
  });

  it('registra impacto da fireball com folha de sprites', () => {
    const impact = getSkillVfxDefinition('fireball')?.impact;
    expect(impact?.spriteSheet).toEqual({
      path: 'skills/vfx/fireball/fireball_impact_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 520,
    });
  });

  it('registra arcane_bolt com folha thunder_bolt e impacto', () => {
    const definition = getSkillVfxDefinition('arcane_bolt');
    expect(definition?.motion).toBe('projectile');
    expect(definition?.spriteSheet).toEqual({
      path: 'skills/vfx/thunder_bolt/thunder_bolt_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 320,
    });
    expect(definition?.impact?.spriteSheet).toEqual({
      path: 'skills/vfx/thunder_bolt/thunder_bolt_impact_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 480,
    });
  });

  it('registra arcane_bolt com thunder_bolt.svg', () => {
    // legado: aliases ainda resolvem a skill; SVG permanece no disco para fallback
    expect(getSkillVfxSvgPath('arcane_bolt', 'thunder_bolt.svg')).toBe(
      'skills/svg/thunder_bolt.svg',
    );
  });

  it('registra frost_shard como rise com folha de impacto no chão do alvo', () => {
    const definition = getSkillVfxDefinition('frost_shard');
    expect(definition?.motion).toBe('rise');
    expect(definition?.placement).toBe('target');
    expect(definition?.offsetY).toBe(12);
    expect(definition?.spriteSheet).toEqual({
      path: 'skills/vfx/frost_shard/frost_shard_impact_sheet.png',
      columns: 9,
      rows: 1,
      frameDurationMs: 520,
    });
    expect(definition?.impact).toBeUndefined();
  });

  it('registra inn_fei_spark como rise no chão (igual frost_shard)', () => {
    const definition = getSkillVfxDefinition('inn_fei_spark');
    expect(definition?.motion).toBe('rise');
    expect(definition?.placement).toBe('target');
    expect(definition?.offsetY).toBe(12);
    expect(definition?.glow).toBe('fire');
    expect(definition?.spriteSheet).toEqual({
      path: 'skills/vfx/inn_fei_spark/inn_fei_spark_sheet.png',
      columns: 3,
      rows: 2,
      frameDurationMs: 480,
    });
  });

  it('registra power_attack com spritesheet no centro do alvo', () => {
    const definition = getSkillVfxDefinition('power_attack');
    expect(definition?.motion).toBe('melee');
    expect(definition?.placement).toBe('target');
    expect(definition?.anchorYRatio).toBe(0.5);
    expect(definition?.spriteSheet).toEqual({
      path: 'skills/vfx/power_attack/power_attack.png',
      columns: 3,
      rows: 2,
      frameDurationMs: 420,
    });
  });

  it('registra minor_heal com heal.svg no alvo', () => {
    const definition = getSkillVfxDefinition('minor_heal');
    expect(definition?.svgFile).toBe('heal.svg');
    expect(definition?.placement).toBe('target');
    expect(definition?.glow).toBe('heal');
    expect(getSkillVfxSvgPath('minor_heal', definition?.svgFile)).toBe('skills/svg/heal.svg');
  });

  it('reutiliza VFX de cura em oracle_mend', () => {
    expect(getSkillVfxDefinition('oracle_mend')?.svgFile).toBe('heal.svg');
  });

  it('registra blizzard como coluna vertical com blizzard.svg', () => {
    const definition = getSkillVfxDefinition('blizzard');
    expect(definition?.motion).toBe('aoe');
    expect(definition?.svgFile).toBe('blizzard.svg');
    expect(definition?.placement).toBe('target_column');
    expect(definition?.columnAspectRatio).toBeCloseTo(800 / 600);
    expect(definition?.durationMs).toBe(1400);
    expect(definition?.glow).toBe('cold');
    expect(getSkillVfxSvgPath('blizzard', definition?.svgFile)).toBe('skills/svg/blizzard.svg');
  });

  it('registra skills da party padrão (Galneon, Nix, Elara)', () => {
    const partySkills = [
      'power_attack',
      'thrust',
      'frost_shard',
      'blessing',
      'smite',
    ] as const;

    for (const skillId of partySkills) {
      expect(getSkillVfxDefinition(skillId)).not.toBeNull();
    }

    expect(getSkillVfxDefinition('frost_shard')?.motion).toBe('rise');
    expect(getSkillVfxDefinition('power_attack')?.motion).toBe('melee');
    expect(getSkillVfxDefinition('power_attack')?.spriteSheet?.path).toContain('power_attack.png');
    expect(getSkillVfxDefinition('thrust')?.svgFile).toBe('thrust.svg');
    expect(getSkillVfxDefinition('blessing')?.placement).toBe('caster');
    expect(getSkillVfxDefinition('smite')?.glow).toBe('holy');
  });

  it('registra ascensão tier 1 e skills comuns de inimigos', () => {
    const nextBatch = [
      'mil_guer_cleave',
      'arc_mag_bolt',
      'arc_arq_nova',
      'sag_clr_light',
      'pyro_inferno',
      'pyro_ember',
      'goblin_stab',
      'orc_smash',
      'poison_spit',
      'ground_slam',
      'dragon_breath',
      'wraith_drain',
      'frost_breath',
    ] as const;

    for (const skillId of nextBatch) {
      expect(getSkillVfxDefinition(skillId)).not.toBeNull();
    }

    expect(getSkillVfxDefinition('arc_mag_bolt')?.spriteSheet?.path).toBe(
      'skills/vfx/thunder_bolt/thunder_bolt_sheet.png',
    );
    expect(getSkillVfxDefinition('goblin_stab')?.svgFile).toBe('thrust.svg');
    expect(getSkillVfxDefinition('reaver_cleave')?.svgFile).toBe('cleave.svg');
    expect(getSkillVfxDefinition('frost_breath')?.svgFile).toBe('blizzard.svg');
    expect(getSkillVfxDefinition('saci_fire')?.svgFile).toBe('pyro_ember.svg');
  });

  it('registra ascensões, curas avançadas e debuffs', () => {
    const batch = [
      'wraith_curse',
      'arc_arq_rift',
      'inn_sob_comet',
      'oracle_sanctuary',
      'vid_gua_aegis',
      'mil_gen_decree',
      'mar_gla_bleed',
      'sag_san_grace',
      'inn_fil_storm',
      'mar_mes_flow',
      'arc_mag_weave',
      'vid_clr_bloom',
      'mar_cam_crown',
    ] as const;

    for (const skillId of batch) {
      expect(getSkillVfxDefinition(skillId)).not.toBeNull();
    }

    expect(getSkillVfxDefinition('arc_arq_bind')?.svgFile).toBe('curse.svg');
    expect(getSkillVfxDefinition('inn_fil_ether')?.svgFile).toBe('arc_rift.svg');
    expect(getSkillVfxDefinition('vid_gua_pulse')?.svgFile).toBe('radiance.svg');
    expect(getSkillVfxDefinition('mil_guer_hold')?.glow).toBe('shield');
  });

  it('retorna null para skills sem VFX', () => {
    expect(getSkillVfxDefinition('unknown_skill_without_vfx')).toBeNull();
  });
});
