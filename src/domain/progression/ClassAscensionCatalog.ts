import { HeroClass } from '../entities/HeroClass';
import { ClassAscension } from './ClassAscension';
import { applyAscensionOverride } from './HeroCombatOverrides';
import { AscensionId } from './SkillId';

export const CLASS_ASCENSION_CATALOG: ClassAscension[] = [
  {
    id: 'knight_military_guerreiro',
    heroClass: 'knight',
    name: 'Guerreiro',
    pathLabel: 'Caminho Militar',
    description: 'Disciplina de campo. Golpes firmes e presença na linha de frente.',
    prerequisiteAscensionId: null,
    requirements: [
      { type: 'hero_level', min: 12 },
      { type: 'attribute', key: 'str', min: 12 },
      { type: 'skill_rank', skillId: 'thrust', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'knight_martial_gladiador',
    heroClass: 'knight',
    name: 'Gladiador',
    pathLabel: 'Caminho Marcial',
    description: 'Combate de arena. Velocidade, pressão e golpes precisos.',
    prerequisiteAscensionId: null,
    requirements: [
      { type: 'hero_level', min: 12 },
      { type: 'attribute', key: 'str', min: 11 },
      { type: 'attribute', key: 'dex', min: 10 },
      { type: 'skill_rank', skillId: 'thrust', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'knight_military_capitao',
    heroClass: 'knight',
    name: 'Capitão',
    pathLabel: 'Caminho Militar',
    description: 'Liderança tática. Fortalece a equipe e domina o ritmo da batalha.',
    prerequisiteAscensionId: 'knight_military_guerreiro',
    requirements: [
      { type: 'hero_level', min: 22 },
      { type: 'attribute', key: 'str', min: 16 },
      { type: 'ascension', ascensionId: 'knight_military_guerreiro' },
      { type: 'skill_rank', skillId: 'mil_guer_rally', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'knight_martial_mestre',
    heroClass: 'knight',
    name: 'Mestre Marcial',
    pathLabel: 'Caminho Marcial',
    description: 'Maestria corporal. Fluxo ofensivo e punição imediata.',
    prerequisiteAscensionId: 'knight_martial_gladiador',
    requirements: [
      { type: 'hero_level', min: 22 },
      { type: 'attribute', key: 'str', min: 15 },
      { type: 'attribute', key: 'dex', min: 14 },
      { type: 'ascension', ascensionId: 'knight_martial_gladiador' },
      { type: 'skill_rank', skillId: 'mar_gla_bleed', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'knight_military_general',
    heroClass: 'knight',
    name: 'General',
    pathLabel: 'Caminho Militar',
    description: 'Comando supremo. Devastador em campo e ícone da vanguarda.',
    prerequisiteAscensionId: 'knight_military_capitao',
    requirements: [
      { type: 'hero_level', min: 35 },
      { type: 'attribute', key: 'str', min: 22 },
      { type: 'ascension', ascensionId: 'knight_military_capitao' },
      { type: 'skill_rank', skillId: 'mil_cap_phalanx', minRank: 1 },
    ],
    pointsGranted: 3,
  },
  {
    id: 'knight_martial_campeao',
    heroClass: 'knight',
    name: 'Campeão',
    pathLabel: 'Caminho Marcial',
    description: 'Ápice do duelo. Velocidade letal e domínio absoluto da arena.',
    prerequisiteAscensionId: 'knight_martial_mestre',
    requirements: [
      { type: 'hero_level', min: 35 },
      { type: 'attribute', key: 'str', min: 18 },
      { type: 'attribute', key: 'dex', min: 18 },
      { type: 'ascension', ascensionId: 'knight_martial_mestre' },
      { type: 'skill_rank', skillId: 'mar_mes_flow', minRank: 1 },
    ],
    pointsGranted: 3,
  },
  {
    id: 'sorcerer_arcane_maga',
    heroClass: 'sorcerer',
    name: 'Maga',
    pathLabel: 'Caminho Arcano',
    description: 'Estudo arcano. Rajadas precisas e controle mágico.',
    prerequisiteAscensionId: null,
    requirements: [
      { type: 'hero_level', min: 12 },
      { type: 'attribute', key: 'int', min: 12 },
      { type: 'skill_rank', skillId: 'arcane_bolt', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'sorcerer_innate_feiticeira',
    heroClass: 'sorcerer',
    name: 'Feiticeira',
    pathLabel: 'Caminho Inato',
    description: 'Magia inata. Instinto, velocidade e fogo interior.',
    prerequisiteAscensionId: null,
    requirements: [
      { type: 'hero_level', min: 12 },
      { type: 'attribute', key: 'int', min: 11 },
      { type: 'attribute', key: 'dex', min: 10 },
      { type: 'skill_rank', skillId: 'arcane_bolt', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'sorcerer_arcane_arquimaga',
    heroClass: 'sorcerer',
    name: 'Arquimaga',
    pathLabel: 'Caminho Arcano',
    description: 'Domínio profundo. Explosões arcanas e aprisionamento.',
    prerequisiteAscensionId: 'sorcerer_arcane_maga',
    requirements: [
      { type: 'hero_level', min: 22 },
      { type: 'attribute', key: 'int', min: 16 },
      { type: 'ascension', ascensionId: 'sorcerer_arcane_maga' },
      { type: 'skill_rank', skillId: 'arc_mag_bolt', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'sorcerer_innate_soberana',
    heroClass: 'sorcerer',
    name: 'Soberana Astral',
    pathLabel: 'Caminho Inato',
    description: 'Poder celestial. Cometas e véus de energia estelar.',
    prerequisiteAscensionId: 'sorcerer_innate_feiticeira',
    requirements: [
      { type: 'hero_level', min: 22 },
      { type: 'attribute', key: 'int', min: 15 },
      { type: 'attribute', key: 'dex', min: 14 },
      { type: 'ascension', ascensionId: 'sorcerer_innate_feiticeira' },
      { type: 'skill_rank', skillId: 'inn_fei_whisper', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'sorcerer_arcane_imperatriz',
    heroClass: 'sorcerer',
    name: 'Imperatriz Arcana',
    pathLabel: 'Caminho Arcano',
    description: 'Ápice do arcano. Decretos devastadores e tempestades imperiais.',
    prerequisiteAscensionId: 'sorcerer_arcane_arquimaga',
    requirements: [
      { type: 'hero_level', min: 35 },
      { type: 'attribute', key: 'int', min: 22 },
      { type: 'ascension', ascensionId: 'sorcerer_arcane_arquimaga' },
      { type: 'skill_rank', skillId: 'arc_arq_nova', minRank: 1 },
    ],
    pointsGranted: 3,
  },
  {
    id: 'sorcerer_innate_filha_eter',
    heroClass: 'sorcerer',
    name: 'Filha do Éter',
    pathLabel: 'Caminho Inato',
    description: 'União com o éter. Tormentas e ascensão transcendente.',
    prerequisiteAscensionId: 'sorcerer_innate_soberana',
    requirements: [
      { type: 'hero_level', min: 35 },
      { type: 'attribute', key: 'int', min: 18 },
      { type: 'attribute', key: 'dex', min: 18 },
      { type: 'ascension', ascensionId: 'sorcerer_innate_soberana' },
      { type: 'skill_rank', skillId: 'inn_sob_comet', minRank: 1 },
    ],
    pointsGranted: 3,
  },
  {
    id: 'priest_sacred_cleriga',
    heroClass: 'priest',
    name: 'Clériga Sagrada',
    pathLabel: 'Caminho Sagrado',
    description: 'Fé e castigo. Luz divina e proteção sagrada.',
    prerequisiteAscensionId: null,
    requirements: [
      { type: 'hero_level', min: 12 },
      { type: 'attribute', key: 'int', min: 12 },
      { type: 'skill_rank', skillId: 'minor_heal', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'priest_life_cleriga',
    heroClass: 'priest',
    name: 'Clériga da Vida',
    pathLabel: 'Caminho da Vida',
    description: 'Cura e renovação. Vitalidade para aliados feridos.',
    prerequisiteAscensionId: null,
    requirements: [
      { type: 'hero_level', min: 12 },
      { type: 'attribute', key: 'int', min: 11 },
      { type: 'attribute', key: 'dex', min: 10 },
      { type: 'skill_rank', skillId: 'minor_heal', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'priest_sacred_alta_sacerdotisa',
    heroClass: 'priest',
    name: 'Alta Sacerdotisa',
    pathLabel: 'Caminho Sagrado',
    description: 'Autoridade sagrada. Radiância e santificação em combate.',
    prerequisiteAscensionId: 'priest_sacred_cleriga',
    requirements: [
      { type: 'hero_level', min: 22 },
      { type: 'attribute', key: 'int', min: 16 },
      { type: 'ascension', ascensionId: 'priest_sacred_cleriga' },
      { type: 'skill_rank', skillId: 'sag_clr_light', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'priest_life_guardia',
    heroClass: 'priest',
    name: 'Guardiã da Vida',
    pathLabel: 'Caminho da Vida',
    description: 'Proteção vital. Égides e fontes de cura sustentada.',
    prerequisiteAscensionId: 'priest_life_cleriga',
    requirements: [
      { type: 'hero_level', min: 22 },
      { type: 'attribute', key: 'int', min: 15 },
      { type: 'attribute', key: 'dex', min: 14 },
      { type: 'ascension', ascensionId: 'priest_life_cleriga' },
      { type: 'skill_rank', skillId: 'vid_clr_touch', minRank: 1 },
    ],
    pointsGranted: 2,
  },
  {
    id: 'priest_sacred_santa',
    heroClass: 'priest',
    name: 'Santa',
    pathLabel: 'Caminho Sagrado',
    description: 'Ápice da fé. Graça divina e julgamento final.',
    prerequisiteAscensionId: 'priest_sacred_alta_sacerdotisa',
    requirements: [
      { type: 'hero_level', min: 35 },
      { type: 'attribute', key: 'int', min: 22 },
      { type: 'ascension', ascensionId: 'priest_sacred_alta_sacerdotisa' },
      { type: 'skill_rank', skillId: 'sag_alt_radiance', minRank: 1 },
    ],
    pointsGranted: 3,
  },
  {
    id: 'priest_life_filha_aurora',
    heroClass: 'priest',
    name: 'Filha da Aurora',
    pathLabel: 'Caminho da Vida',
    description: 'Luz da aurora. Renascimento e cura transcendente.',
    prerequisiteAscensionId: 'priest_life_guardia',
    requirements: [
      { type: 'hero_level', min: 35 },
      { type: 'attribute', key: 'int', min: 18 },
      { type: 'attribute', key: 'dex', min: 18 },
      { type: 'ascension', ascensionId: 'priest_life_guardia' },
      { type: 'skill_rank', skillId: 'vid_gua_pulse', minRank: 1 },
    ],
    pointsGranted: 3,
  },
];

const ascensionMap = new Map<AscensionId, ClassAscension>(
  CLASS_ASCENSION_CATALOG.map((entry) => [entry.id, entry]),
);

/** Catálogo canônico, sem override do Balance Lab. */
export function getCatalogAscensionById(
  ascensionId: AscensionId,
): ClassAscension | undefined {
  return ascensionMap.get(ascensionId);
}

export function getAscensionById(ascensionId: AscensionId): ClassAscension | undefined {
  const baseline = getCatalogAscensionById(ascensionId);
  return baseline ? applyAscensionOverride(baseline) : undefined;
}

export function getAscensionsForClass(heroClass: HeroClass): ClassAscension[] {
  return CLASS_ASCENSION_CATALOG.filter((entry) => entry.heroClass === heroClass).map(
    (entry) => applyAscensionOverride(entry),
  );
}

export function getNextAscensionOptions(
  heroClass: HeroClass,
  currentAscensionId: AscensionId | null,
): ClassAscension[] {
  return getAscensionsForClass(heroClass).filter(
    (entry) => entry.prerequisiteAscensionId === currentAscensionId,
  );
}
