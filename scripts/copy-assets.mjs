import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const resourcesRoot = join(root, 'public', 'ResourcesData');
const heroesSpritesRoot = join(root, 'public', 'sprites', 'heroes');
const enemiesSpritesRoot = join(root, 'public', 'sprites', 'enemies');
const skillsSpritesRoot = join(root, 'public', 'sprites', 'skills');
const itemsSpritesRoot = join(root, 'public', 'sprites', 'items');
const campaignSpritesRoot = join(root, 'public', 'sprites', 'campaign');
const publicRoot = join(root, 'public');
let outRoot = join(root, 'dist', 'assets');

/** Sprites de heróis em public/sprites/heroes. */
const HERO_SPRITE_MAP = [
  ['galneon_aprendiz.png', 'characters/galneon_aprendiz.png'],
  [
    'galneon/galneon_aprendiz_basic_attack_sheet.png',
    'characters/galneon_aprendiz_basic_attack_sheet.png',
  ],
  ['galneon_guerreiro.png', 'characters/galneon_guerreiro.png'],
  ['galneon_capitao.png', 'characters/galneon_capitao.png'],
  ['galneon_general.png', 'characters/galneon_general.png'],
  ['galneon_gladiador.png', 'characters/galneon_gladiador.png'],
  ['galneon_mestre_marcial.png', 'characters/galneon_mestre_marcial.png'],
  ['galneon_campeao.png', 'characters/galneon_campeao.png'],
  ['nix_aprendiz.png', 'characters/nix_aprendiz.png'],
  [
    'nix/nix_aprendiz_basic_attack_sheet.png',
    'characters/nix_aprendiz_basic_attack_sheet.png',
  ],
  ['nix_maga.png', 'characters/nix_maga.png'],
  ['nix_arquimaga.png', 'characters/nix_arquimaga.png'],
  ['nix_imperatriz_arcana.png', 'characters/nix_imperatriz_arcana.png'],
  ['nix_feiticeira.png', 'characters/nix_feiticeira.png'],
  ['nix_soberana_astral.png', 'characters/nix_soberana_astral.png'],
  ['nix_filha_do_eter.png', 'characters/nix_filha_do_eter.png'],
  ['elara_aprendiz.png', 'characters/elara_aprendiz.png'],
  [
    'elara/elara_aprendiz_basic_attack_sheet.png',
    'characters/elara_aprendiz_basic_attack_sheet.png',
  ],
  ['elara_cleriga_sagrada.png', 'characters/elara_cleriga_sagrada.png'],
  ['elara_alta_sacerdotiza.png', 'characters/elara_alta_sacerdotiza.png'],
  ['elara_santa.png', 'characters/elara_santa.png'],
  ['elara_cleriga_da_vida.png', 'characters/elara_cleriga_da_vida.png'],
  ['elara_guardia_da_vida.png', 'characters/elara_guardia_da_vida.png'],
  ['elara_filha_da_aurora.png', 'characters/elara_filha_da_aurora.png'],
  ['berserker.png', 'characters/berserker.png'],
  ['rain.png', 'characters/rain.png'],
  ['valerius.png', 'characters/valerius.png'],
];

/** Sprites de skills em public/sprites/skills (nome do arquivo = skillId). */
const SKILL_SPRITE_MAP = [
  ['vitality.png', 'skills/vitality.png'],
  ['arcane_bolt.png', 'skills/arcane_bolt.png'],
  ['fireball.png', 'skills/fireball.png'],
  ['heal.png', 'skills/heal.png'],
  ['mana_shield.png', 'skills/mana_shield.png'],
  ['thrust.png', 'skills/thrust.png'],
  ['blessing.png', 'skills/blessing.png'],
  ['iron_skin.png', 'skills/iron_skin.png'],
  ['power_attack.png', 'skills/power_attack.png'],
  ['evasion.png', 'skills/evasion.png'],
  ['frost_shard.png', 'skills/frost_shard.png'],
  ['blizzard.png', 'skills/blizzard.png'],
  ['smite.png', 'skills/smite.png'],
];

/** Copia todos os PNGs de inimigos para characters/ (mesmo basename). */
async function copyEnemySprites() {
  const destDir = join(outRoot, 'characters');
  await mkdir(destDir, { recursive: true });
  const files = await readdir(enemiesSpritesRoot);
  let copied = 0;

  for (const file of files) {
    if (!file.endsWith('.png')) continue;
    await copyFile(join(enemiesSpritesRoot, file), join(destDir, file));
    copied += 1;
  }

  return copied;
}

/** Copia SVGs animados de skills em public/sprites/skills/svg → panel/assets/skills/svg/. */
async function copySkillSvgSprites() {
  const svgRoot = join(skillsSpritesRoot, 'svg');
  let copied = 0;

  try {
    const files = await readdir(svgRoot);
    for (const file of files) {
      if (!file.endsWith('.svg')) continue;
      const destPath = join(outRoot, 'skills', 'svg', file);
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(join(svgRoot, file), destPath);
      copied += 1;
    }
  } catch {
    return 0;
  }

  return copied;
}

/** Folhas VFX em public/sprites/skills/vfx/<skill>/ → panel/assets/skills/vfx/<skill>/. */
async function copySkillVfxSheets() {
  const vfxRoot = join(skillsSpritesRoot, 'vfx');
  let copied = 0;

  let skillDirs;
  try {
    skillDirs = await readdir(vfxRoot);
  } catch {
    return 0;
  }

  for (const skillId of skillDirs) {
    const sourceDir = join(vfxRoot, skillId);
    const sourceStat = await stat(sourceDir).catch(() => null);
    if (!sourceStat?.isDirectory()) continue;

    const files = await readdir(sourceDir);
    for (const file of files) {
      if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
      const destPath = join(outRoot, 'skills', 'vfx', skillId, file);
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(join(sourceDir, file), destPath);
      copied += 1;
    }
  }

  return copied;
}

/** Sprites de itens customizados em public/sprites/items. */
const ITEM_WEAPON_SPRITE_MAP = [
  ['weapons/standard_common_sword.png', 'gear/items/standard_common_sword.png'],
  ['weapons/standard_uncommon_sword.png', 'gear/items/standard_uncommon_sword.png'],
  ['weapons/standard_rare_sword.png', 'gear/items/standard_rare_sword.png'],
  ['weapons/standard_epic_sword.png', 'gear/items/standard_epic_sword.png'],
  ['weapons/standard_legendary_sword.png', 'gear/items/standard_legendary_sword.png'],
  ['weapons/sword_vorpal_lupnus.png', 'gear/items/sword_vorpal_lupnus.png'],
  ['weapons/soler_plegius.png', 'gear/items/soler_plegius.png'],
  ['accessory/ignus_ix.png', 'gear/items/ignus_ix.png'],
  ['accessory/morthaven_seal.png', 'gear/items/morthaven_seal.png'],
];

/** Logo e demais assets estáticos em public/. */
const PUBLIC_ASSET_MAP = [
  ['logo.png', 'ui/brand.png'],
  ['bg_top_principal.png', 'backgrounds/top-principal.png'],
  ['sprites/icons/attack-speed.png', 'ui/stats/attack-speed.png'],
  ['sprites/icons/cast-speed.png', 'ui/stats/cast-speed.png'],
  ['sprites/icons/pin.png', 'ui/pin.png'],
  ['sprites/icons/unpin.png', 'ui/unpin.png'],
  ['sprites/icons/xp.png', 'ui/xp.png'],
  ['sprites/splash_screen.png', 'ui/splash_screen.png'],
];

const ASSET_MAP = [
  ['Fonts/Alata-Regular.ttf', 'fonts/Alata-Regular.ttf'],
  ['Fonts/JosefinSans-Bold.ttf', 'fonts/JosefinSans-Bold.ttf'],
  ['Fonts/Cinzel-Regular.ttf', 'fonts/Cinzel-Regular.ttf'],
  ['Fonts/Cinzel-Bold.ttf', 'fonts/Cinzel-Bold.ttf'],

  ['Sprites/Demo/Demo_Character/character_back_glow_small.png', 'characters/glow.png'],

  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_gold.png', 'ui/gold.png'],
  ['Sprites/Demo/Demo_Icon_Chest/shop_img_chest_close_s_00.png', 'ui/chest.png'],
  ['Sprites/Demo/Demo_Icon_Chest/shop_img_chest_open01_s_00.png', 'ui/chest-open.png'],
  ['Sprites/Component/Popup/popup_01_frame.png', 'ui/victory-frame.png'],
  ['Sprites/Demo/Demo_Image/image_glow_circle.png', 'ui/victory-glow.png'],
  ['Sprites/Demo/Demo_Image/group_image_wingbadge1.png', 'ui/victory-wings.png'],
  ['Sprites/Demo/Demo_Icon/icon_color_gift.png', 'ui/gift.png'],
  ['Sprites/Demo/Demo_Icon/set_icon_menu05_battle.png', 'ui/heroes.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_flag.png', 'ui/stage.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_rune.png', 'ui/rune.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_achievement.png', 'ui/achievement.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_bookmark.png', 'ui/bookmark.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_clear.png', 'ui/clear.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_book_open.png', 'ui/book-open.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_map.png', 'ui/campaign.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_shop.png', 'ui/shop.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_anvil.png', 'ui/forge.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_star.png', 'ui/improvement.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_battle.png', 'ui/attack.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_shield.png', 'ui/defense.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_life.png', 'ui/health.png'],
  ['Sprites/Component/Icon_ItemIcons_(Original)/icon_itemicon_inventory.png', 'ui/inventory.png'],
  ['Sprites/Demo/Demo_Icon/icon_white_arrow_prev.png', 'ui/arrow-prev.png'],
  ['Sprites/Demo/Demo_Icon/icon_white_arrow_next.png', 'ui/arrow-next.png'],

  // Ícones de estatísticas (PictoIcons brancos, tingidos via --stat-icon-filter)
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_strength.png', 'ui/stats/str.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_feather.png', 'ui/stats/dex.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_magicball.png', 'ui/stats/int.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_sword_1.png', 'ui/stats/attack.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_shield.png', 'ui/stats/defense.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_life.png', 'ui/stats/health.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_guage.png', 'ui/stats/dps.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_horuglass.png', 'ui/stats/cooldown.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_target_1.png', 'ui/stats/crit-chance.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_blast.png', 'ui/stats/crit-damage.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_jump.png', 'ui/stats/dodge.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_buckler.png', 'ui/stats/block.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_helmet_2.png', 'ui/stats/damage-reduction.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_fist.png', 'ui/stats/physical-damage.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_fire.png', 'ui/stats/fire.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_snowflake.png', 'ui/stats/cold.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_thunder.png', 'ui/stats/lightning.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_cyclone.png', 'ui/stats/air.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_shield_magic.png', 'ui/stats/all-elemental.png'],
  ['Sprites/Component/Icon_PictoIcons_(Original)/btn_icon_energy.png', 'ui/stats/elemental-damage.png'],

  ['Sprites/Demo/Demo_Background/background_gradient_01.png', 'backgrounds/battle.png'],
  ['Sprites/Demo/Demo_Background/background_05_sample_01.png', 'backgrounds/app.png'],

  ['Sprites/Component/Frame/frame_cardframe_00_d_front1.png', 'frames/card.png'],
  ['Sprites/Component/Frame/frame_itemframe_00_n_blue.png', 'frames/item-rare.png'],
  ['Sprites/Component/Frame/frame_itemframe_00_n_purple.png', 'frames/item-epic.png'],
  ['Sprites/Component/Frame/frame_itemframe_01_s.png', 'frames/item-common.png'],

  ['Sprites/Component/Button/btn_rectangle_01_n_blue.png', 'buttons/primary.png'],
  ['Sprites/Component/Button/btn_rectangle_01_n_brown.png', 'buttons/secondary.png'],

  ['Sprites/Component/Slider/slider_icontype_03_frame.png', 'sliders/frame.png'],
  ['Sprites/Component/Slider/slider_icontype_03_fill_1.png', 'sliders/fill-hero.png'],
  ['Sprites/Component/Slider/slider_icontype_03_fill_0.png', 'sliders/fill-enemy.png'],

  ['Sprites/Component/Icon_EquipmentIcons_(Original)/equip_axe_0.png', 'gear/weapon.png'],
  ['Sprites/Component/Icon_EquipmentIcons_(Original)/equip_shield_wood.png', 'gear/armor.png'],
  ['Sprites/Component/Icon_EquipmentIcons_(Original)/equip_ring_gold.png', 'gear/accessory.png'],
  ['Sprites/Component/Icon_EquipmentIcons_(Original)/equip_stone.png', 'gear/common.png'],
  ['Sprites/Component/Icon_EquipmentIcons_(Original)/equip_gem_red.png', 'gear/rare.png'],
  ['Sprites/Component/Icon_EquipmentIcons_(Original)/equip_cyristal.png', 'gear/epic.png'],
];

async function copyAssetBatch(sourceRoot, entries) {
  for (const [source, dest] of entries) {
    const sourcePath = join(sourceRoot, source);
    const destPath = join(outRoot, dest);
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(sourcePath, destPath);
  }
}

/** Copia sprites únicos de gear (um PNG por item do catálogo). */
async function copyGearItemSprites() {
  const sourceDir = join(itemsSpritesRoot, 'gear');
  const destDir = join(outRoot, 'gear/items');
  await mkdir(destDir, { recursive: true });
  let copied = 0;

  try {
    const files = await readdir(sourceDir);
    for (const file of files) {
      if (!file.endsWith('.png')) continue;
      await copyFile(join(sourceDir, file), join(destDir, file));
      copied += 1;
    }
  } catch {
    return 0;
  }

  return copied;
}

async function copyEquipmentIcons() {
  const sourceDir = join(
    resourcesRoot,
    'Sprites/Component/Icon_EquipmentIcons_(Original)',
  );
  const destDir = join(outRoot, 'gear/items');
  await mkdir(destDir, { recursive: true });
  const files = await readdir(sourceDir);
  let copied = 0;

  for (const file of files) {
    if (!file.endsWith('.png')) continue;
    await copyFile(join(sourceDir, file), join(destDir, file));
    copied += 1;
  }

  return copied;
}

async function copyCampaignScenes() {
  let copied = 0;

  let mapDirs;
  try {
    mapDirs = await readdir(campaignSpritesRoot);
  } catch {
    return 0;
  }

  for (const mapId of mapDirs) {
    const sourceDir = join(campaignSpritesRoot, mapId);
    const sourceStat = await stat(sourceDir).catch(() => null);
    if (!sourceStat?.isDirectory()) continue;

    const destDir = join(outRoot, 'campaign', mapId);
    const files = await readdir(sourceDir);

    for (const file of files) {
      if (!/\.(png|jpe?g)$/i.test(file)) continue;
      await mkdir(destDir, { recursive: true });
      await copyFile(join(sourceDir, file), join(destDir, file));
      copied += 1;
    }
  }

  return copied;
}

/** Copia recursivamente public/audio/ → dist/panel/assets/audio/. */
async function copyAudioAssets() {
  const audioRoot = join(root, 'public', 'audio');
  let copied = 0;

  async function walk(relativeDir = '') {
    const currentDir = join(audioRoot, relativeDir);
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relativePath = relativeDir ? join(relativeDir, entry.name) : entry.name;
      if (entry.isDirectory()) {
        await walk(relativePath);
        continue;
      }

      if (!/\.(wav|ogg|mp3|m4a|webm)$/i.test(entry.name)) continue;
      const destPath = join(outRoot, 'audio', relativePath);
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(join(currentDir, entry.name), destPath);
      copied += 1;
    }
  }

  await walk();
  return copied;
}

export async function copyAssets(options = {}) {
  outRoot = options.outRoot ?? join(root, 'dist', 'assets');
  await copyAssetBatch(resourcesRoot, ASSET_MAP);
  const equipmentIconCount = await copyEquipmentIcons();
  const gearItemSpriteCount = await copyGearItemSprites();
  await copyAssetBatch(heroesSpritesRoot, HERO_SPRITE_MAP);
  const enemySpriteCount = await copyEnemySprites();
  await copyAssetBatch(skillsSpritesRoot, SKILL_SPRITE_MAP);
  const skillSvgCount = await copySkillSvgSprites();
  const skillVfxSheetCount = await copySkillVfxSheets();
  await copyAssetBatch(itemsSpritesRoot, ITEM_WEAPON_SPRITE_MAP);
  await copyAssetBatch(publicRoot, PUBLIC_ASSET_MAP);
  const campaignSceneCount = await copyCampaignScenes();
  const audioAssetCount = await copyAudioAssets();

  const total =
    ASSET_MAP.length +
    equipmentIconCount +
    gearItemSpriteCount +
    HERO_SPRITE_MAP.length +
    enemySpriteCount +
    SKILL_SPRITE_MAP.length +
    skillSvgCount +
    skillVfxSheetCount +
    ITEM_WEAPON_SPRITE_MAP.length +
    PUBLIC_ASSET_MAP.length +
    campaignSceneCount +
    audioAssetCount;
  console.log(
    `Assets copiados: ${total} arquivos em ${outRoot} (${campaignSceneCount} cenas de campanha, ${audioAssetCount} áudio)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  copyAssets().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
