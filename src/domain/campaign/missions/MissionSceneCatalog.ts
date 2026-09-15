import { MapId } from '../CampaignIds';

/** Cena narrativa exclusiva de missão (side / especiais). */
export interface MissionSceneDefinition {
  id: string;
  mapId: MapId;
  title: string;
  recap: string;
  preview: string;
}

const SCENES: MissionSceneDefinition[] = [
  {
    id: 'side:stendra_ash_trail',
    mapId: 'stendra',
    title: 'Cinzas no caminho',
    recap:
      'A Trilha de Cinzas revelou fogueiras abandonadas e rastros de bandoleiros que fugiram antes do confronto.',
    preview:
      'Nix guarda um mapa marcado a carvão — o esconderijo ainda espera quem ouse seguir a fumaça.',
  },
  {
    id: 'side:stendra_hidden_cache',
    mapId: 'stendra',
    title: 'O esconderijo',
    recap:
      'Sob as raízes, um baú selado com o emblema de Stendra guardava um talismã esquecido pela milícia.',
    preview: 'O artefato pulsa com calor residual — uma lembrança de que as planícies ainda escondem segredos.',
  },
  {
    id: 'side:gruftall_ash_scout',
    mapId: 'gruftall',
    title: 'Batedor nas cinzas',
    recap:
      'Um batedor de Gruftall sobreviveu o suficiente para apontar uma rota entre as ruínas sufocantes.',
    preview: 'A terra cinzenta não perdoa atrasos — a próxima patrulha será mais profunda.',
  },
  {
    id: 'side:valdris_whisper',
    mapId: 'valdris',
    title: 'Sussurro nas ruínas',
    recap:
      'Entre colunas quebradas, um eco pediu que a party não se esquecesse dos nomes dos mortos.',
    preview: 'Valdris responde a quem escuta — e castiga quem ignora o aviso.',
  },
  {
    id: 'side:morthaven_seal_run',
    mapId: 'morthaven',
    title: 'Corrida ao selo',
    recap:
      'Um correio do castelo entregou um fragmento de selo antes de desaparecer nas muralhas.',
    preview: 'O Duque ainda não sabe que o fragmento mudou de mãos.',
  },
];

const BY_ID = new Map(SCENES.map((scene) => [scene.id, scene]));

export function listMissionScenes(): readonly MissionSceneDefinition[] {
  return SCENES;
}

export function resolveMissionScene(sceneId: string): MissionSceneDefinition | null {
  return BY_ID.get(sceneId) ?? null;
}
