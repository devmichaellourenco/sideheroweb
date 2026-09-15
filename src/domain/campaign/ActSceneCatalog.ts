import { MapId } from './CampaignIds';
import { releasedCampaignMaps } from './CampaignReleaseScope';

export interface ActSceneDefinition {
  id: string;
  mapId: MapId;
  actNumber: number;
  title: string;
  /** O que já aconteceu até este ponto. */
  recap: string;
  /** O que o grupo enfrentará neste ato. */
  preview: string;
}

export function buildActSceneId(mapId: MapId, actNumber: number): string {
  return `${mapId}-act-${actNumber}`;
}

/** Epílogo exibido uma vez ao concluir a campanha (4-50) no jogo base. */
export const SEASON_FINALE_EPILOGUE_ID = 'morthaven-season-epilogue';

export const SEASON_FINALE_EPILOGUE: ActSceneDefinition = {
  id: SEASON_FINALE_EPILOGUE_ID,
  mapId: 'morthaven',
  actNumber: 5,
  title: 'Fim da jornada',
  recap:
    'O Duque de Morthaven caiu. A party atravessou Stendra, Gruftall, Valdris e o castelo sombrio — e encerrou a ameaça que pairava sobre o reino.',
  preview:
    'Esta é a última fase do jogo base. No acampamento, use o **mapa** para missões principais, secundárias e normais (farm). Novas regiões, se vierem, serão conteúdo futuro — não um reinício de temporada.',
};

type ActCopy = Pick<ActSceneDefinition, 'title' | 'recap' | 'preview'>;

const SCENES_BY_MAP: Record<
  MapId,
  { acts: [ActCopy, ActCopy, ActCopy, ActCopy, ActCopy] }
> = {
  stendra: {
    acts: [
      {
        title: 'Ecos nas Planícies',
        recap:
          'Galneon, Nix e Elara deixam o acampamento inicial rumo a Stendra, onde relatos de saques se multiplicam.',
        preview:
          'Goblins e bandoleiros emboscam os aventureiros nas encostas verdes.',
      },
      {
        title: 'Trilha dos Salteadores',
        recap:
          'Os heróis dispersaram bandos menores, mas as caravanas ainda desaparecem nas encruzilhadas.',
        preview:
          'Emboscadas coordenadas e líderes mais audazes bloqueiam a estrada principal. O perigo deixa de ser acidental.',
      },
      {
        title: 'Ruínas da Vigília',
        recap:
          'A estrada ficou mais segura, porém torres antigas voltaram a acender luzes na noite.',
        preview:
          'Patrulhas misturam mortos-vivos e arqueiros em ruínas estreitas. Cada canto esconde um emboscador.',
      },
      {
        title: 'Sopro do Guardião',
        recap:
          'Os heróis mapearam os esconderijos locais; um poder elemental pulsa sob o forte quebrado.',
        preview:
          'Elementais e capitães corrompidos guardam o caminho para o coração de Stendra. A pressão aumenta.',
      },
      {
        title: 'Julgamento de Stendra',
        recap:
          'Resta apenas o núcleo do conflito. O Saci, um dos Guardiões Elementais da Floresta de Stendra, desperta para testar os aventureiros.',
        preview:
          'O Saci decidirá se os aventureiros merecem avançar além das planícies.',
      },
    ],
  },
  gruftall: {
    acts: [
      {
        title: 'Fronteira de Cinzas',
        recap:
          'Após Stendra, o ar quente e seco anuncia Gruftall, terra sob a sombra de Gonodor.',
        preview:
          'Monstros errantes e scavengers vagam entre crateras. Os aventureiros precisam se adaptar ao terreno hostil.',
      },
      {
        title: 'Cinzas Profundas',
        recap:
          'A travessia inicial provou que Gruftall não perdoa hesitação. cinzas grossas encobrem armadilhas.',
        preview:
          'Patrulhas maiores e conjuradores goblins testam asresistências. O calor drena forças lentamente.',
      },
      {
        title: 'Ruína Fumegante',
        recap:
          'Os heróis encontraram acampamentos abandonados. Sinais de que algo maior varreu a região.',
        preview:
          'Elites e aberrações de cinza bloqueiam as passagens estreitas entre torres desmoronadas.',
      },
      {
        title: 'Voz de Gonodor',
        recap:
          'Ecos de estrondos e chao tremendo  distante percorrem as ruínas. O nome Gonodor volta em canções de medo.',
        preview:
          'A influência destrutiva do titã é palpável. Ondas de monstros mais brutais e sincronizadas.',
      },
      {
        title: 'Centelha de Gonodor',
        recap:
          'O epicentro do poder destrutivo finalmente responde. Apenas uma centelha, dizem, mas é suficiente para incendiar um exército.',
        preview:
          'O confronto com a Centelha de Gonodor marca o fim de a passagem de Gruftall e exibe Valdris para aqueles que sobreviverem.',
      },
    ],
  },
  valdris: {
    acts: [
      {
        title: 'Névoa Espectral',
        recap:
          'Valdris surge como um vale de colunas quebradas, onde a luz do dia não dissipa o frio.',
        preview:
          'Mortos-vivos e predadores das ruínas caçam em silêncio. Os aventureiros avançam entre sussuros de mortos-vivos e sombras.',
      },
      {
        title: 'Tumbas Abertas',
        recap:
          'Os primeiros salões foram limpos, mas novas portas se abriram sozinhas nas profundezas.',
        preview:
          'Necromantes menores e enxames de esqueletos testam a cura e o controle de área do grupo.',
      },
      {
        title: 'Sussurros do Vale',
        recap:
          'Inscrições antigas contam sobre um espectro que vigia Valdris desde a queda da cidade.',
        preview:
          'Elites espectrais e elementalistas corrompidos atacam em pares. Coordenação é essencial.',
      },
      {
        title: 'Corte Quebrada',
        recap:
          'O espectro de Valdris manipula os vivos restantes. os aventureiros interrompem rituais em câmaras ocultas.',
        preview:
          'Capitães orcs e invocações mistas guardam o penúltimo anel do vale. A pressão aumenta.',
      },
      {
        title: 'Espectro de Valdris',
        recap:
          'O vale inteiro treme quando o guardião espectral se manifesta para aniquilar os intrusos.',
        preview:
          'Derrotar o espectro abre o caminho para Morthaven. O castelo decadente e último bastião para recuperar a chave para o Céu Quebrado.',
      },
    ],
  },
  morthaven: {
    acts: [
      {
        title: 'Muralhas de Morthaven',
        recap:
          'O castelo sombrio de Morthaven domina o horizonte; seus lordes preferem a escuridão à paz.',
        preview:
          'Orcs, trolls menores e cultistas patrulham os primeiros pátios. Os aventureiros entram pela brecha leste.',
      },
      {
        title: 'Salões Opressores',
        recap:
          'Os pátios externos caíram, mas corredores internos ainda fervilham de servos armados.',
        preview:
          'Necromantes renegados e bestas de cerco estreitam o campo de batalha em salões baixos.',
      },
      {
        title: 'Criptas do Duque',
        recap:
          'Rumores apontam o Duque de Morthaven como a mente por trás dos ataques coordenados.',
        preview:
          'Elites vampíricas e constructos de carne bloqueiam as criptas. Cada vitória revela mais do complô.',
      },
      {
        title: 'Ascensão ao Trono Menor',
        recap:
          'O Duque recuou para a torre central; só restam os mais leais, e os mais monstruosos.',
        preview:
          'Trolls das montanhas e magos de sangue defendem a escadaria final do castelo.',
      },
      {
        title: 'Duque de Morthaven',
        recap:
          'No ápice do castelo, o Duque concentra o que resta de seu domínio para esmagar os heróis.',
        preview:
          'Este é o **fim**. A chave para o Céu Quebrado foi recuperada. Um novo patamar de poder e ameaças aguarda.',
      },
    ],
  },
  broken_sky: { acts: placeholderActs('Céu Quebrado') },
  crimson_abyss: { acts: placeholderActs('Abismo Carmesim') },
  eternal_forge: { acts: placeholderActs('Forja Eterna') },
  ancient_grove: { acts: placeholderActs('Bosque Antigo') },
  twilight_tower: { acts: placeholderActs('Torre do Crepúsculo') },
  void_throne: { acts: placeholderActs('Trono do Vazio') },
};

function placeholderActs(regionName: string): [ActCopy, ActCopy, ActCopy, ActCopy, ActCopy] {
  return [1, 2, 3, 4, 5].map((actNumber) => ({
    title: `${regionName} — Ato ${actNumber}`,
    recap: 'Narrativa reservada para DLC futura.',
    preview: 'Conteúdo será liberado em expansão.',
  })) as [ActCopy, ActCopy, ActCopy, ActCopy, ActCopy];
}

function buildCatalog(): ActSceneDefinition[] {
  const scenes: ActSceneDefinition[] = [];

  for (const map of releasedCampaignMaps()) {
    const copy = SCENES_BY_MAP[map.id];
    if (!copy) continue;

    copy.acts.forEach((act, index) => {
      const actNumber = index + 1;
      scenes.push({
        id: buildActSceneId(map.id, actNumber),
        mapId: map.id,
        actNumber,
        ...act,
      });
    });
  }

  return scenes;
}

export const ACT_SCENE_CATALOG: ActSceneDefinition[] = buildCatalog();

const sceneById = new Map(ACT_SCENE_CATALOG.map((scene) => [scene.id, scene]));

export function resolveActScene(mapId: MapId, actNumber: number): ActSceneDefinition | null {
  return sceneById.get(buildActSceneId(mapId, actNumber)) ?? null;
}

export function resolveActSceneById(sceneId: string): ActSceneDefinition | null {
  if (sceneId === SEASON_FINALE_EPILOGUE_ID) {
    return SEASON_FINALE_EPILOGUE;
  }
  return sceneById.get(sceneId) ?? null;
}

export function listActScenesForMap(mapId: MapId): ActSceneDefinition[] {
  return ACT_SCENE_CATALOG.filter((scene) => scene.mapId === mapId);
}

/** Arte full-bleed por cena (proporção do painel) — fallback: banner da região. */
const ACT_SCENE_IMAGE_OVERRIDES: Partial<Record<string, string>> = {
  'stendra-act-1': 'campaign/stendra/scene_1.png',
  'stendra-act-2': 'campaign/stendra/scene_2.png',
  'stendra-act-3': 'campaign/stendra/scene_3.png',
  'stendra-act-4': 'campaign/stendra/scene_4.png',
  'stendra-act-5': 'campaign/stendra/scene_5.png',
  'gruftall-act-1': 'campaign/grutfall/scene_1.png',
  'valdris-act-1': 'campaign/valdris/scene_1.png',
  'morthaven-act-1': 'campaign/morthaven/scene_1.png',
};

/** Caminho relativo de asset para a cena (arte dedicada ou banner da região). */
export function actSceneImageAssetPath(mapId: MapId, actNumber?: number): string | null {
  if (actNumber != null) {
    const dedicated = ACT_SCENE_IMAGE_OVERRIDES[buildActSceneId(mapId, actNumber)];
    if (dedicated) return dedicated;
  }

  const paths: Partial<Record<MapId, string>> = {
    stendra: 'campaign/stendra/campaign_stendra_banner.png',
    gruftall: 'campaign/grutfall/campaign_grutfall_banner.png',
    valdris: 'campaign/valdris/campaign_valdris_banner.png',
    morthaven: 'campaign/morthaven/campaign_morthaven_banner.png',
  };
  return paths[mapId] ?? null;
}
