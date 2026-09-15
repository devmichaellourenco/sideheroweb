/**
 * Servidor do Balance Lab — simulador + editor de batalhas de missões.
 * Uso: npm run balance-lab
 */
import * as esbuild from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { backupFile, listBackupFiles, isPathSafe } from './balance-lab/backup.mjs';
import { getWorkspaceVersion } from './balance-lab/version.mjs';
import { diffJsonSnapshots } from './balance-lab/diff.mjs';
import {
  previewPromotion,
  applyPromotion,
  isScopeJsonBacked,
} from './balance-lab/promotion.mjs';
import {
  buildBalancePack,
  validateBalancePack,
  previewBalancePack,
  resolveImportScopes,
  listBalancePackScopes,
} from './balance-lab/balancePack.mjs';
import {
  OVERRIDES_PATH,
  BACKUPS_DIR,
  REWARD_OVERRIDES_PATH,
  REWARD_BACKUPS_DIR,
  HERO_COMBAT_PATH,
  HERO_COMBAT_BACKUPS_DIR,
  HERO_LEVEL_XP_PATH,
  HERO_LEVEL_XP_BACKUPS_DIR,
  GEAR_ITEM_OVERRIDES_PATH,
  GEAR_ITEM_BACKUPS_DIR,
  SHOP_OVERRIDES_PATH,
  SHOP_BACKUPS_DIR,
  MISSION_OVERRIDES_PATH,
  MISSION_BACKUPS_DIR,
  ENEMY_COMBAT_PATH,
  ENEMY_COMBAT_BACKUPS_DIR,
  UPGRADE_OVERRIDES_PATH,
  UPGRADE_BACKUPS_DIR,
  PANEL_ASSETS_DIR,
  PUBLIC_ENEMY_SPRITES_DIR,
  SCOPE_MAP,
} from './balance-lab/paths.mjs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'tools/balance-lab/dist');
const port = Number(process.env.BALANCE_LAB_PORT ?? 5179);

/** @type {null | typeof import('../tools/balance-lab/missionBattlesCatalog.ts')} */
let catalogApi = null;

/** @type {null | typeof import('../tools/balance-lab/combatSimCatalog.ts')} */
let combatSimApi = null;

async function build() {
  await mkdir(outDir, { recursive: true });
  await mkdir(BACKUPS_DIR, { recursive: true });
  await mkdir(REWARD_BACKUPS_DIR, { recursive: true });
  await mkdir(HERO_COMBAT_BACKUPS_DIR, { recursive: true });
  await mkdir(HERO_LEVEL_XP_BACKUPS_DIR, { recursive: true });
  await mkdir(GEAR_ITEM_BACKUPS_DIR, { recursive: true });
  await mkdir(SHOP_BACKUPS_DIR, { recursive: true });
  await mkdir(MISSION_BACKUPS_DIR, { recursive: true });
  await mkdir(ENEMY_COMBAT_BACKUPS_DIR, { recursive: true });
  await mkdir(UPGRADE_BACKUPS_DIR, { recursive: true });

  await esbuild.build({
    entryPoints: [join(root, 'tools/balance-lab/lab.ts')],
    outfile: join(outDir, 'lab.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    sourcemap: true,
    logLevel: 'info',
  });

  await esbuild.build({
    entryPoints: [join(root, 'tools/balance-lab/missionBattlesCatalog.ts')],
    outfile: join(outDir, 'missionBattlesCatalog.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    packages: 'bundle',
    logLevel: 'info',
  });

  await esbuild.build({
    entryPoints: [join(root, 'tools/balance-lab/combatSimCatalog.ts')],
    outfile: join(outDir, 'combatSimCatalog.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    packages: 'bundle',
    logLevel: 'info',
  });

  await copyFile(join(root, 'tools/balance-lab/index.html'), join(outDir, 'index.html'));
  await copyFile(join(root, 'tools/balance-lab/lab.css'), join(outDir, 'lab.css'));
  await copyFile(join(root, 'tools/balance-lab/lab.tokens.css'), join(outDir, 'lab.tokens.css'));

  catalogApi = await import(pathToFileURL(join(outDir, 'missionBattlesCatalog.mjs')).href);
  combatSimApi = await import(pathToFileURL(join(outDir, 'combatSimCatalog.mjs')).href);
}

function contentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.map') || path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

async function tryReadFile(filePath) {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

/** Serve sprites do build do painel, com fallback em public/sprites/enemies. */
async function servePanelAsset(pathname, res) {
  const relative = pathname.replace(/^\/panel\/assets\//, '');
  if (relative.includes('..')) {
    res.writeHead(403).end('Forbidden');
    return true;
  }

  const primary = join(PANEL_ASSETS_DIR, relative);
  if (!primary.startsWith(PANEL_ASSETS_DIR)) {
    res.writeHead(403).end('Forbidden');
    return true;
  }

  let body = await tryReadFile(primary);
  if (!body && relative.startsWith('characters/')) {
    const basename = relative.slice('characters/'.length);
    const fallback = join(PUBLIC_ENEMY_SPRITES_DIR, basename);
    if (fallback.startsWith(PUBLIC_ENEMY_SPRITES_DIR)) {
      body = await tryReadFile(fallback);
    }
  }
  if (!body && relative.startsWith('characters/')) {
    body = await tryReadFile(join(PANEL_ASSETS_DIR, 'characters/goblin.png'));
  }
  if (!body) {
    res.writeHead(404).end('Not found');
    return true;
  }

  res.writeHead(200, {
    'Content-Type': contentType(relative),
    'Cache-Control': 'public, max-age=3600',
  });
  res.end(body);
  return true;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

/**
 * Faz parse de `sorcerer:10,knight:10` em array de party members.
 * Retorna null se o formato for inválido.
 * @param {string} raw
 * @returns {Array<{heroClass: string, level: number}> | null}
 */
function parsePartyQueryParam(raw) {
  try {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const members = [];
    for (const part of parts) {
      const colonIdx = part.lastIndexOf(':');
      if (colonIdx === -1) return null;
      const heroClass = part.slice(0, colonIdx);
      const level = parseInt(part.slice(colonIdx + 1), 10);
      if (!heroClass || !Number.isFinite(level) || level < 1) return null;
      members.push({ heroClass, level });
    }
    return members.length > 0 ? members.slice(0, 3) : null;
  } catch {
    return null;
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

async function readOverridesFile() {
  try {
    const raw = await readFile(OVERRIDES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return { version: 1, updatedAt: null, overrides: {} };
  }
}

async function writeOverridesFile(file) {
  await mkdir(dirname(OVERRIDES_PATH), { recursive: true });
  const payload = `${JSON.stringify(file, null, 2)}\n`;
  await writeFile(OVERRIDES_PATH, payload, 'utf8');
}

/**
 * Lê o JSON de override de qualquer scope do SCOPE_MAP.
 * Se o arquivo não existir, retorna um stub mínimo.
 *
 * @param {string} scope
 * @returns {Promise<object>}
 */
async function readScopeOverridePayload(scope) {
  const info = SCOPE_MAP[scope];
  if (!info) throw new Error(`Scope inválido: ${scope}`);
  try {
    const raw = await readFile(info.override, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { version: 1, updatedAt: null };
  }
}

/**
 * Escreve o JSON de override de um scope (substituição completa do arquivo).
 *
 * @param {string} scope
 * @param {unknown} payload
 */
async function writeScopeOverridePayload(scope, payload) {
  const info = SCOPE_MAP[scope];
  if (!info) throw new Error(`Scope inválido: ${scope}`);
  await mkdir(dirname(info.override), { recursive: true });
  await writeFile(info.override, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function collectWorkspaceScopePayloads() {
  /** @type {Record<string, unknown>} */
  const scopes = {};
  for (const id of listBalancePackScopes()) {
    scopes[id] = await readScopeOverridePayload(id);
  }
  return scopes;
}

async function backupCurrentOverrides() {
  return backupFile(OVERRIDES_PATH, BACKUPS_DIR, 'phase-battle-overrides');
}

async function readRewardOverridesFile() {
  try {
    const raw = await readFile(REWARD_OVERRIDES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return { version: 1, updatedAt: null, overrides: {} };
  }
}

async function writeRewardOverridesFile(file) {
  await mkdir(dirname(REWARD_OVERRIDES_PATH), { recursive: true });
  const payload = `${JSON.stringify(file, null, 2)}\n`;
  await writeFile(REWARD_OVERRIDES_PATH, payload, 'utf8');
}

async function backupCurrentRewardOverrides() {
  return backupFile(REWARD_OVERRIDES_PATH, REWARD_BACKUPS_DIR, 'phase-reward-overrides');
}

async function listRewardBackups() {
  return listBackupFiles(REWARD_BACKUPS_DIR);
}

function validateRewardOverride(body) {
  const normalized = catalogApi.normalizePhaseRewardOverride(body);
  if (!normalized) {
    throw new Error('Informe displayName e/ou targetXp/targetGold > 0');
  }
  return normalized;
}

async function readHeroCombatFile() {
  try {
    const raw = await readFile(HERO_COMBAT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      skills: parsed.skills ?? {},
      identities: parsed.identities ?? {},
      baseStats: parsed.baseStats ?? {},
      passives: parsed.passives ?? {},
      ascensions: parsed.ascensions ?? {},
    };
  } catch {
    return {
      version: 1,
      updatedAt: null,
      skills: {},
      identities: {},
      baseStats: {},
      passives: {},
      ascensions: {},
    };
  }
}

async function writeHeroCombatFile(file) {
  await mkdir(dirname(HERO_COMBAT_PATH), { recursive: true });
  await writeFile(HERO_COMBAT_PATH, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

async function backupCurrentHeroCombat() {
  return backupFile(HERO_COMBAT_PATH, HERO_COMBAT_BACKUPS_DIR, 'hero-combat-overrides');
}

async function listHeroCombatBackups() {
  return listBackupFiles(HERO_COMBAT_BACKUPS_DIR);
}

async function readHeroLevelXpFile() {
  try {
    const raw = await readFile(HERO_LEVEL_XP_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      levels: parsed.levels ?? {},
    };
  } catch {
    return { version: 1, updatedAt: null, levels: {} };
  }
}

async function writeHeroLevelXpFile(file) {
  await mkdir(dirname(HERO_LEVEL_XP_PATH), { recursive: true });
  await writeFile(HERO_LEVEL_XP_PATH, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

async function backupCurrentHeroLevelXp() {
  return backupFile(HERO_LEVEL_XP_PATH, HERO_LEVEL_XP_BACKUPS_DIR, 'hero-level-xp-overrides');
}

async function listHeroLevelXpBackups() {
  return listBackupFiles(HERO_LEVEL_XP_BACKUPS_DIR);
}

async function readGearItemOverridesFile() {
  try {
    const raw = await readFile(GEAR_ITEM_OVERRIDES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      items: parsed.items ?? {},
    };
  } catch {
    return { version: 1, updatedAt: null, items: {} };
  }
}

async function writeGearItemOverridesFile(file) {
  await mkdir(dirname(GEAR_ITEM_OVERRIDES_PATH), { recursive: true });
  await writeFile(GEAR_ITEM_OVERRIDES_PATH, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

async function backupCurrentGearItemOverrides() {
  return backupFile(GEAR_ITEM_OVERRIDES_PATH, GEAR_ITEM_BACKUPS_DIR, 'gear-item-overrides');
}

async function listGearItemBackups() {
  return listBackupFiles(GEAR_ITEM_BACKUPS_DIR);
}

async function readShopOverridesFile() {
  try {
    const parsed = JSON.parse(await readFile(SHOP_OVERRIDES_PATH, 'utf8'));
    return catalogApi.normalizeShopOverridesFile(parsed);
  } catch {
    return { version: 1, updatedAt: null, shops: {}, deletedShopIds: [] };
  }
}

async function writeShopOverridesFile(file) {
  const normalized = catalogApi.normalizeShopOverridesFile(file);
  await mkdir(dirname(SHOP_OVERRIDES_PATH), { recursive: true });
  await writeFile(SHOP_OVERRIDES_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

async function backupCurrentShopOverrides() {
  return backupFile(SHOP_OVERRIDES_PATH, SHOP_BACKUPS_DIR, 'shop-overrides');
}

async function listShopBackups() {
  return listBackupFiles(SHOP_BACKUPS_DIR);
}

async function readMissionOverridesFile() {
  try {
    const parsed = JSON.parse(await readFile(MISSION_OVERRIDES_PATH, 'utf8'));
    return catalogApi.normalizeMissionOverridesFile(parsed);
  } catch {
    return catalogApi.emptyMissionOverridesFile();
  }
}

async function writeMissionOverridesFile(file) {
  const normalized = catalogApi.normalizeMissionOverridesFile(file);
  await mkdir(dirname(MISSION_OVERRIDES_PATH), { recursive: true });
  await writeFile(MISSION_OVERRIDES_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

async function backupCurrentMissionOverrides() {
  return backupFile(MISSION_OVERRIDES_PATH, MISSION_BACKUPS_DIR, 'mission-overrides');
}

async function listMissionCatalogBackups() {
  return listBackupFiles(MISSION_BACKUPS_DIR);
}

async function listBackups() {
  return listBackupFiles(BACKUPS_DIR);
}

async function readEnemyCombatFile() {
  try {
    const parsed = JSON.parse(await readFile(ENEMY_COMBAT_PATH, 'utf8'));
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      identities: parsed.identities ?? {},
      monsterSkills: parsed.monsterSkills ?? {},
    };
  } catch {
    return { version: 1, updatedAt: null, identities: {}, monsterSkills: {} };
  }
}

async function writeEnemyCombatFile(file) {
  await mkdir(dirname(ENEMY_COMBAT_PATH), { recursive: true });
  await writeFile(ENEMY_COMBAT_PATH, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

async function backupCurrentEnemyCombat() {
  return backupFile(ENEMY_COMBAT_PATH, ENEMY_COMBAT_BACKUPS_DIR, 'enemy-combat-overrides');
}

async function listEnemyCombatBackups() {
  return listBackupFiles(ENEMY_COMBAT_BACKUPS_DIR);
}

async function readUpgradeOverridesFile() {
  try {
    const parsed = JSON.parse(await readFile(UPGRADE_OVERRIDES_PATH, 'utf8'));
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      upgrades: parsed.upgrades ?? {},
    };
  } catch {
    return { version: 1, updatedAt: null, upgrades: {} };
  }
}

async function writeUpgradeOverridesFile(file) {
  await mkdir(dirname(UPGRADE_OVERRIDES_PATH), { recursive: true });
  await writeFile(UPGRADE_OVERRIDES_PATH, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

async function backupCurrentUpgradeOverrides() {
  return backupFile(UPGRADE_OVERRIDES_PATH, UPGRADE_BACKUPS_DIR, 'upgrade-overrides');
}

async function listUpgradeBackups() {
  return listBackupFiles(UPGRADE_BACKUPS_DIR);
}

function validateOverride(body) {
  if (!body || typeof body !== 'object') throw new Error('Body inválido');
  if (!Array.isArray(body.waves) || body.waves.length === 0) {
    throw new Error('Informe ao menos uma wave');
  }
  for (const [wi, wave] of body.waves.entries()) {
    if (!Array.isArray(wave.slots) || wave.slots.length === 0) {
      throw new Error(`Wave ${wi + 1} sem slots`);
    }
    for (const [si, slot] of wave.slots.entries()) {
      if (!slot.enemyType) throw new Error(`Wave ${wi + 1} slot ${si + 1}: enemyType obrigatório`);
      if (!['trash', 'elite', 'boss'].includes(slot.role)) {
        throw new Error(`Wave ${wi + 1} slot ${si + 1}: role inválido`);
      }
      if (!Number.isFinite(Number(slot.count)) || Number(slot.count) < 1) {
        throw new Error(`Wave ${wi + 1} slot ${si + 1}: count inválido`);
      }
    }
  }
  return {
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    statMultiplier:
      typeof body.statMultiplier === 'number' && Number.isFinite(body.statMultiplier)
        ? body.statMultiplier
        : undefined,
    waves: body.waves,
  };
}

async function handleApi(req, res, url) {
  if (!catalogApi) {
    sendJson(res, 503, { ok: false, error: 'Catálogo ainda não carregou' });
    return;
  }

  const file = await readOverridesFile();

  const rewardFile = await readRewardOverridesFile();

  // Curva de XP por nível + itens do disco valem para todas as rotas.
  const levelXpFile = await readHeroLevelXpFile();
  catalogApi.applyLabHeroLevelXpOverrides(levelXpFile.levels);
  const gearFile = await readGearItemOverridesFile();
  catalogApi.applyLabGearItemOverrides(gearFile);
  const missionCatalogFile = await readMissionOverridesFile();
  catalogApi.applyLabMissionOverrides(missionCatalogFile);

  if (req.method === 'GET' && url.pathname === '/api/missions') {
    const chapterRaw = url.searchParams.get('chapterMain');
    const chapterMain =
      chapterRaw !== null && chapterRaw !== '' ? Number(chapterRaw) : undefined;
    const payload = catalogApi.buildMissionsLabPayload({
      diskOverrides: missionCatalogFile,
      kind: url.searchParams.get('kind') || undefined,
      mapId: url.searchParams.get('mapId') || undefined,
      q: url.searchParams.get('q') || undefined,
      chapterMain:
        chapterMain !== undefined && Number.isFinite(chapterMain) ? chapterMain : undefined,
    });
    sendJson(res, 200, {
      ok: true,
      ...payload,
      backups: await listMissionCatalogBackups(),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/missions') {
    const body = await readBody(req);
    const result = catalogApi.applyCreateMission(missionCatalogFile, {
      kind: body?.kind,
      mapId: body?.mapId,
      name: body?.name,
      phaseTemplateId: body?.phaseTemplateId,
      stars: body?.stars,
      slug: body?.slug,
      unlockAfterMissionIds: body?.unlockAfterMissionIds,
    });
    if (!result.ok) {
      sendJson(res, result.status, { ok: false, error: result.error });
      return;
    }
    const backupPath = await backupCurrentMissionOverrides();
    await writeMissionOverridesFile(result.file);
    catalogApi.applyLabMissionOverrides(result.file);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: result.file.updatedAt,
      missionId: result.missionId,
      mission: catalogApi.getMissionLabDetail(result.missionId, result.file),
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/missions') {
    const body = await readBody(req);
    const result = catalogApi.applyPutMissionsFile(body);
    if (!result.ok) {
      sendJson(res, result.status, { ok: false, error: result.error });
      return;
    }
    const backupPath = await backupCurrentMissionOverrides();
    await writeMissionOverridesFile(result.file);
    catalogApi.applyLabMissionOverrides(result.file);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: result.file.updatedAt,
      overrideCount:
        Object.keys(result.file.missions).length + result.file.deletedMissionIds.length,
    });
    return;
  }

  const missionDetailMatch = url.pathname.match(/^\/api\/missions\/([^/]+)$/);
  if (req.method === 'GET' && missionDetailMatch) {
    const missionId = decodeURIComponent(missionDetailMatch[1]);
    const detail = catalogApi.getMissionLabDetail(missionId, missionCatalogFile);
    if (!detail) {
      sendJson(res, 404, { ok: false, error: 'Missão não encontrada' });
      return;
    }
    sendJson(res, 200, { ok: true, mission: detail });
    return;
  }

  if (req.method === 'PATCH' && missionDetailMatch) {
    const missionId = decodeURIComponent(missionDetailMatch[1]);
    const body = await readBody(req);
    const result = catalogApi.applyPatchMission(missionCatalogFile, missionId, {
      name: body?.name,
      stars: body?.stars,
      phaseTemplateId: body?.phaseTemplateId,
      unlockAfterMissionIds: body?.unlockAfterMissionIds,
      kind: body?.kind,
      slug: body?.slug,
    });
    if (!result.ok) {
      sendJson(res, result.status, { ok: false, error: result.error });
      return;
    }
    const backupPath = await backupCurrentMissionOverrides();
    await writeMissionOverridesFile(result.file);
    catalogApi.applyLabMissionOverrides(result.file);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: result.file.updatedAt,
      missionId: result.missionId,
      previousId: result.previousId ?? null,
      mission: catalogApi.getMissionLabDetail(result.missionId, result.file),
    });
    return;
  }

  if (req.method === 'DELETE' && missionDetailMatch) {
    const missionId = decodeURIComponent(missionDetailMatch[1]);
    const result = catalogApi.applyDeleteMission(missionCatalogFile, missionId);
    if (!result.ok) {
      sendJson(res, result.status, { ok: false, error: result.error });
      return;
    }
    const backupPath = await backupCurrentMissionOverrides();
    await writeMissionOverridesFile(result.file);
    catalogApi.applyLabMissionOverrides(result.file);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: result.file.updatedAt,
      missionId,
    });
    return;
  }

  const missionRestoreMatch = url.pathname.match(
    /^\/api\/missions-backups\/([^/]+)\/restore$/,
  );
  if (req.method === 'POST' && missionRestoreMatch) {
    const backupId = decodeURIComponent(missionRestoreMatch[1]);
    const src = join(MISSION_BACKUPS_DIR, backupId);
    if (!src.startsWith(MISSION_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const previousBackupPath = await backupCurrentMissionOverrides();
    await copyFile(src, MISSION_OVERRIDES_PATH);
    const restored = await readMissionOverridesFile();
    catalogApi.applyLabMissionOverrides(restored);
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupId,
      previousBackupPath,
      updatedAt: restored.updatedAt,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/shops') {
    const shopFile = await readShopOverridesFile();
    const mapRaw = url.searchParams.get('mapIndex');
    const mapIndex = mapRaw ? Number(mapRaw) : undefined;
    const payload = catalogApi.buildShopLabPayload({
      diskOverrides: shopFile,
      q: url.searchParams.get('q') || undefined,
      mapIndex: Number.isFinite(mapIndex) ? mapIndex : undefined,
    });
    sendJson(res, 200, {
      ok: true,
      ...payload,
      backups: await listShopBackups(),
    });
    return;
  }

  const shopDetailMatch = url.pathname.match(/^\/api\/shops\/([^/]+)$/);
  if (req.method === 'GET' && shopDetailMatch) {
    const shopFile = await readShopOverridesFile();
    const shopId = decodeURIComponent(shopDetailMatch[1]);
    const detail = catalogApi.getShopLabDetail(shopId, shopFile);
    if (!detail) {
      sendJson(res, 404, { ok: false, error: 'Loja não encontrada' });
      return;
    }
    sendJson(res, 200, { ok: true, ...detail });
    return;
  }

  if (req.method === 'PUT' && shopDetailMatch) {
    const shopFile = await readShopOverridesFile();
    const shopId = decodeURIComponent(shopDetailMatch[1]);
    const body = await readBody(req);
    if (body?.id !== shopId) {
      sendJson(res, 400, { ok: false, error: 'O ID do body deve corresponder à URL' });
      return;
    }
    const override = catalogApi.buildShopOverrideFromDraft(shopId, body);
    const backupPath = await backupCurrentShopOverrides();
    if (Object.keys(override).length === 0) delete shopFile.shops[shopId];
    else shopFile.shops[shopId] = override;
    shopFile.deletedShopIds = shopFile.deletedShopIds.filter((id) => id !== shopId);
    shopFile.updatedAt = new Date().toISOString();
    shopFile.version = 1;
    await writeShopOverridesFile(shopFile);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: shopFile.updatedAt,
      shop: catalogApi.getShopLabDetail(shopId, shopFile),
    });
    return;
  }

  if (req.method === 'DELETE' && shopDetailMatch) {
    const shopFile = await readShopOverridesFile();
    const shopId = decodeURIComponent(shopDetailMatch[1]);
    const exists =
      catalogApi.isCanonicalShopId(shopId) ||
      Object.prototype.hasOwnProperty.call(shopFile.shops, shopId);
    if (!exists) {
      sendJson(res, 404, { ok: false, error: 'Loja não encontrada' });
      return;
    }
    const backupPath = await backupCurrentShopOverrides();
    delete shopFile.shops[shopId];
    if (catalogApi.isCanonicalShopId(shopId)) {
      shopFile.deletedShopIds = [...new Set([...shopFile.deletedShopIds, shopId])];
    } else {
      shopFile.deletedShopIds = shopFile.deletedShopIds.filter((id) => id !== shopId);
    }
    shopFile.updatedAt = new Date().toISOString();
    await writeShopOverridesFile(shopFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: shopFile.updatedAt });
    return;
  }

  const shopRestoreMatch = url.pathname.match(
    /^\/api\/shops-backups\/([^/]+)\/restore$/,
  );
  if (req.method === 'POST' && shopRestoreMatch) {
    const backupId = decodeURIComponent(shopRestoreMatch[1]);
    const src = join(SHOP_BACKUPS_DIR, backupId);
    if (!src.startsWith(SHOP_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const previousBackupPath = await backupCurrentShopOverrides();
    await copyFile(src, SHOP_OVERRIDES_PATH);
    const restored = await readShopOverridesFile();
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupId,
      previousBackupPath,
      updatedAt: restored.updatedAt,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/hero-level-xp') {
    const bandRaw = url.searchParams.get('bandMin');
    const bandMin = bandRaw !== null && bandRaw !== '' ? Number(bandRaw) : undefined;
    const payload = catalogApi.buildHeroLevelXpLabPayload({
      diskOverrides: levelXpFile.levels,
      updatedAt: levelXpFile.updatedAt,
      bandMin: bandMin !== undefined && Number.isFinite(bandMin) ? bandMin : undefined,
    });
    sendJson(res, 200, {
      ok: true,
      ...payload,
      backups: await listHeroLevelXpBackups(),
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/hero-level-xp') {
    const body = await readBody(req);
    const incoming = catalogApi.normalizeHeroLevelXpOverrides(body?.levels ?? {});
    const clearList = Array.isArray(body?.clear) ? body.clear : [];
    const backupPath = await backupCurrentHeroLevelXp();

    for (const level of clearList) {
      const key = String(Math.floor(Number(level)));
      if (key !== 'NaN') delete levelXpFile.levels[key];
    }
    for (const [level, value] of Object.entries(incoming)) {
      levelXpFile.levels[level] = value;
    }
    levelXpFile.updatedAt = new Date().toISOString();
    levelXpFile.version = 1;
    await writeHeroLevelXpFile(levelXpFile);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: levelXpFile.updatedAt,
      overrideCount: Object.keys(levelXpFile.levels).length,
    });
    return;
  }

  const levelXpDetailMatch = url.pathname.match(/^\/api\/hero-level-xp\/([^/]+)$/);
  if (req.method === 'DELETE' && levelXpDetailMatch) {
    const level = String(Math.floor(Number(decodeURIComponent(levelXpDetailMatch[1]))));
    if (level === 'NaN') {
      sendJson(res, 400, { ok: false, error: 'Nível inválido' });
      return;
    }
    const backupPath = await backupCurrentHeroLevelXp();
    delete levelXpFile.levels[level];
    levelXpFile.updatedAt = new Date().toISOString();
    await writeHeroLevelXpFile(levelXpFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: levelXpFile.updatedAt });
    return;
  }

  const levelXpRestoreMatch = url.pathname.match(
    /^\/api\/hero-level-xp-backups\/([^/]+)\/restore$/,
  );
  if (req.method === 'POST' && levelXpRestoreMatch) {
    const backupId = decodeURIComponent(levelXpRestoreMatch[1]);
    const src = join(HERO_LEVEL_XP_BACKUPS_DIR, backupId);
    if (!src.startsWith(HERO_LEVEL_XP_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentHeroLevelXp();
    await copyFile(src, HERO_LEVEL_XP_PATH);
    const restored = await readHeroLevelXpFile();
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupId,
      previousBackupPath: backupPath,
      updatedAt: restored.updatedAt,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/gear-items') {
    const slot = url.searchParams.get('slot') || '';
    const rarity = url.searchParams.get('rarity') || '';
    const q = url.searchParams.get('q') || '';
    const payload = catalogApi.buildGearItemsLabPayload({
      diskOverrides: gearFile,
      updatedAt: gearFile.updatedAt,
      slot: slot || undefined,
      rarity: rarity || undefined,
      q: q || undefined,
    });
    sendJson(res, 200, {
      ok: true,
      ...payload,
      backups: await listGearItemBackups(),
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/gear-items') {
    const body = await readBody(req);
    const drafts = body?.drafts && typeof body.drafts === 'object' ? body.drafts : {};
    const incoming =
      body?.items && typeof body.items === 'object' ? body.items : {};
    const clearList = Array.isArray(body?.clear) ? body.clear : [];
    const backupPath = await backupCurrentGearItemOverrides();

    for (const itemId of clearList) {
      if (typeof itemId === 'string' && itemId.trim()) {
        delete gearFile.items[itemId.trim()];
      }
    }

    for (const [itemId, raw] of Object.entries(incoming)) {
      if (typeof itemId !== 'string' || !itemId.trim()) continue;
      const normalized = catalogApi.normalizeGearItemOverride(raw);
      if (!normalized) {
        delete gearFile.items[itemId];
        continue;
      }
      gearFile.items[itemId] = normalized;
    }

    for (const [itemId, draft] of Object.entries(drafts)) {
      if (typeof itemId !== 'string' || !itemId.trim()) continue;
      const detail = catalogApi.getGearItemLabDetail(itemId, gearFile);
      if (!detail) throw new Error(`Item não encontrado: ${itemId}`);
      const override = catalogApi.buildGearItemOverrideFromDraft(detail.baseline, draft);
      if (!override) {
        delete gearFile.items[itemId];
      } else {
        gearFile.items[itemId] = override;
      }
    }

    gearFile.updatedAt = new Date().toISOString();
    gearFile.version = 1;
    await writeGearItemOverridesFile(gearFile);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: gearFile.updatedAt,
      overrideCount: Object.keys(gearFile.items).length,
    });
    return;
  }

  const gearDetailMatch = url.pathname.match(/^\/api\/gear-items\/([^/]+)$/);
  if (req.method === 'GET' && gearDetailMatch) {
    const itemId = decodeURIComponent(gearDetailMatch[1]);
    const detail = catalogApi.getGearItemLabDetail(itemId, gearFile);
    if (!detail) {
      sendJson(res, 404, { ok: false, error: 'Item não encontrado' });
      return;
    }
    sendJson(res, 200, { ok: true, ...detail });
    return;
  }

  if (req.method === 'DELETE' && gearDetailMatch) {
    const itemId = decodeURIComponent(gearDetailMatch[1]);
    const backupPath = await backupCurrentGearItemOverrides();
    delete gearFile.items[itemId];
    gearFile.updatedAt = new Date().toISOString();
    await writeGearItemOverridesFile(gearFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: gearFile.updatedAt });
    return;
  }

  const gearRestoreMatch = url.pathname.match(
    /^\/api\/gear-items-backups\/([^/]+)\/restore$/,
  );
  if (req.method === 'POST' && gearRestoreMatch) {
    const backupId = decodeURIComponent(gearRestoreMatch[1]);
    const src = join(GEAR_ITEM_BACKUPS_DIR, backupId);
    if (!src.startsWith(GEAR_ITEM_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentGearItemOverrides();
    await copyFile(src, GEAR_ITEM_OVERRIDES_PATH);
    const restored = await readGearItemOverridesFile();
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupId,
      previousBackupPath: backupPath,
      updatedAt: restored.updatedAt,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/phase-rewards') {
    const mapId = url.searchParams.get('mapId') || undefined;
    const chapterRaw = url.searchParams.get('chapterMain');
    const chapterMain =
      chapterRaw !== null && chapterRaw !== '' ? Number(chapterRaw) : undefined;
    const payload = catalogApi.buildPhaseRewardsLabPayload({
      mapId,
      chapterMain:
        chapterMain !== undefined && Number.isFinite(chapterMain)
          ? chapterMain
          : undefined,
      diskOverrides: rewardFile.overrides,
      updatedAt: rewardFile.updatedAt,
    });
    sendJson(res, 200, {
      ok: true,
      ...payload,
      backups: await listRewardBackups(),
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/phase-rewards') {
    const body = await readBody(req);
    const incoming =
      body?.overrides && typeof body.overrides === 'object' ? body.overrides : {};
    const clearList = Array.isArray(body?.clear) ? body.clear : [];
    const backupPath = await backupCurrentRewardOverrides();

    for (const phaseId of clearList) {
      if (typeof phaseId === 'string' && phaseId.trim()) {
        delete rewardFile.overrides[phaseId.trim()];
      }
    }
    for (const [phaseId, raw] of Object.entries(incoming)) {
      if (!phaseId || typeof phaseId !== 'string') continue;
      rewardFile.overrides[phaseId] = validateRewardOverride(raw);
    }
    rewardFile.updatedAt = new Date().toISOString();
    rewardFile.version = 1;
    await writeRewardOverridesFile(rewardFile);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: rewardFile.updatedAt,
      overrideCount: Object.keys(rewardFile.overrides).length,
    });
    return;
  }

  const rewardDetailMatch = url.pathname.match(/^\/api\/phase-rewards\/([^/]+)$/);
  if (req.method === 'DELETE' && rewardDetailMatch) {
    const phaseId = decodeURIComponent(rewardDetailMatch[1]);
    const backupPath = await backupCurrentRewardOverrides();
    delete rewardFile.overrides[phaseId];
    rewardFile.updatedAt = new Date().toISOString();
    await writeRewardOverridesFile(rewardFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: rewardFile.updatedAt });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/phase-rewards-backups') {
    sendJson(res, 200, { ok: true, backups: await listRewardBackups() });
    return;
  }

  const rewardRestoreMatch = url.pathname.match(
    /^\/api\/phase-rewards-backups\/([^/]+)\/restore$/,
  );
  if (req.method === 'POST' && rewardRestoreMatch) {
    const backupId = decodeURIComponent(rewardRestoreMatch[1]);
    const src = join(REWARD_BACKUPS_DIR, backupId);
    if (!src.startsWith(REWARD_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentRewardOverrides();
    await copyFile(src, REWARD_OVERRIDES_PATH);
    const restored = await readRewardOverridesFile();
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupId,
      previousBackupPath: backupPath,
      updatedAt: restored.updatedAt,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/hero-combat') {
    const heroFile = await readHeroCombatFile();
    const payload = catalogApi.buildHeroCombatLabPayload({
      diskOverrides: heroFile,
      updatedAt: heroFile.updatedAt,
    });
    sendJson(res, 200, {
      ok: true,
      ...payload,
      backups: await listHeroCombatBackups(),
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/hero-combat') {
    const heroFile = await readHeroCombatFile();
    const body = await readBody(req);
    const backupPath = await backupCurrentHeroCombat();

    for (const id of Array.isArray(body?.clearSkills) ? body.clearSkills : []) {
      if (typeof id === 'string') delete heroFile.skills[id];
    }
    for (const id of Array.isArray(body?.clearIdentities) ? body.clearIdentities : []) {
      if (typeof id === 'string') delete heroFile.identities[id];
    }
    for (const id of Array.isArray(body?.clearBaseStats) ? body.clearBaseStats : []) {
      if (typeof id === 'string') delete heroFile.baseStats[id];
    }
    for (const id of Array.isArray(body?.clearPassives) ? body.clearPassives : []) {
      if (typeof id === 'string') delete heroFile.passives[id];
    }
    for (const id of Array.isArray(body?.clearAscensions) ? body.clearAscensions : []) {
      if (typeof id === 'string') delete heroFile.ascensions[id];
    }

    for (const [skillId, raw] of Object.entries(body?.skills ?? {})) {
      const normalized = catalogApi.normalizeSkillCombatOverride(raw);
      if (!normalized) throw new Error(`Skill ${skillId}: informe ao menos um knob`);
      heroFile.skills[skillId] = normalized;
    }
    for (const [heroClass, raw] of Object.entries(body?.identities ?? {})) {
      const normalized = catalogApi.normalizeIdentityOverride(raw);
      if (!normalized) throw new Error(`Identidade ${heroClass}: informe ao menos um knob`);
      heroFile.identities[heroClass] = normalized;
    }
    for (const [heroClass, raw] of Object.entries(body?.baseStats ?? {})) {
      const normalized = catalogApi.normalizeBaseStatsOverride(raw);
      if (!normalized) throw new Error(`Stats base ${heroClass}: informe ATK/DEF/HP`);
      heroFile.baseStats[heroClass] = normalized;
    }
    for (const [passiveId, raw] of Object.entries(body?.passives ?? {})) {
      const normalized = catalogApi.normalizePassiveOverride(raw);
      if (!normalized) throw new Error(`Passiva ${passiveId}: informe efeitos numéricos`);
      heroFile.passives[passiveId] = normalized;
    }
    for (const [ascensionId, raw] of Object.entries(body?.ascensions ?? {})) {
      const normalized = catalogApi.normalizeAscensionOverride(raw);
      if (!normalized) throw new Error(`Evolução ${ascensionId}: informe pontos, textos ou requisitos`);
      heroFile.ascensions[ascensionId] = normalized;
    }

    heroFile.updatedAt = new Date().toISOString();
    heroFile.version = 1;
    await writeHeroCombatFile(heroFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: heroFile.updatedAt });
    return;
  }

  const heroRestoreMatch = url.pathname.match(
    /^\/api\/hero-combat-backups\/([^/]+)\/restore$/,
  );
  if (req.method === 'POST' && heroRestoreMatch) {
    const backupId = decodeURIComponent(heroRestoreMatch[1]);
    const src = join(HERO_COMBAT_BACKUPS_DIR, backupId);
    if (!src.startsWith(HERO_COMBAT_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentHeroCombat();
    await copyFile(src, HERO_COMBAT_PATH);
    sendJson(res, 200, { ok: true, restoredFrom: backupId, previousBackupPath: backupPath });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/mission-battles') {
    const kind = url.searchParams.get('kind') || undefined;
    const mapId = url.searchParams.get('mapId') || undefined;
    const q = url.searchParams.get('q') || undefined;
    const chapterRaw = url.searchParams.get('chapterMain');
    const chapterMain =
      chapterRaw !== null && chapterRaw !== ''
        ? Number(chapterRaw)
        : undefined;
    const payload = catalogApi.buildMissionBattleLabPayload(file.overrides, {
      kind,
      mapId,
      q,
      chapterMain:
        chapterMain !== undefined && Number.isFinite(chapterMain)
          ? chapterMain
          : undefined,
    });
    sendJson(res, 200, {
      ok: true,
      updatedAt: file.updatedAt,
      enemies: payload.enemies,
      missions: payload.missions,
      chapters: payload.chapters,
      maps: payload.maps,
      phasesByMap: payload.phasesByMap,
      backups: await listBackups(),
    });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/mission-battles') {
    const body = await readBody(req);
    const updates =
      body?.updates && typeof body.updates === 'object' ? body.updates : null;
    if (!updates || Object.keys(updates).length === 0) {
      sendJson(res, 400, { ok: false, error: 'Informe updates: { [missionId]: draft }' });
      return;
    }
    const backupPath = await backupCurrentOverrides();
    const saved = [];
    for (const [missionId, raw] of Object.entries(updates)) {
      if (typeof missionId !== 'string' || !missionId.trim()) continue;
      const detail = catalogApi.getMissionBattleDetail(missionId, file.overrides);
      if (!detail) {
        throw new Error(`Missão não encontrada: ${missionId}`);
      }
      const override = validateOverride(raw);
      file.overrides[detail.mission.phaseTemplateId] = override;
      saved.push({
        missionId,
        phaseTemplateId: detail.mission.phaseTemplateId,
      });
    }
    file.updatedAt = new Date().toISOString();
    file.version = 1;
    await writeOverridesFile(file);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      updatedAt: file.updatedAt,
      saved,
    });
    return;
  }

  const detailMatch = url.pathname.match(/^\/api\/mission-battles\/([^/]+)$/);
  if (req.method === 'GET' && detailMatch) {
    const missionId = decodeURIComponent(detailMatch[1]);
    const detail = catalogApi.getMissionBattleDetail(missionId, file.overrides);
    if (!detail) {
      sendJson(res, 404, { ok: false, error: 'Missão não encontrada' });
      return;
    }
    sendJson(res, 200, { ok: true, ...detail });
    return;
  }

  if (req.method === 'PUT' && detailMatch) {
    const missionId = decodeURIComponent(detailMatch[1]);
    const detail = catalogApi.getMissionBattleDetail(missionId, file.overrides);
    if (!detail) {
      sendJson(res, 404, { ok: false, error: 'Missão não encontrada' });
      return;
    }
    const body = await readBody(req);
    const override = validateOverride(body);
    const backupPath = await backupCurrentOverrides();
    file.overrides[detail.mission.phaseTemplateId] = override;
    file.updatedAt = new Date().toISOString();
    file.version = 1;
    await writeOverridesFile(file);
    sendJson(res, 200, {
      ok: true,
      phaseTemplateId: detail.mission.phaseTemplateId,
      backupPath,
      updatedAt: file.updatedAt,
      detail: catalogApi.getMissionBattleDetail(missionId, file.overrides),
    });
    return;
  }

  if (req.method === 'DELETE' && detailMatch) {
    const missionId = decodeURIComponent(detailMatch[1]);
    const detail = catalogApi.getMissionBattleDetail(missionId, file.overrides);
    if (!detail) {
      sendJson(res, 404, { ok: false, error: 'Missão não encontrada' });
      return;
    }
    const backupPath = await backupCurrentOverrides();
    delete file.overrides[detail.mission.phaseTemplateId];
    file.updatedAt = new Date().toISOString();
    await writeOverridesFile(file);
    sendJson(res, 200, {
      ok: true,
      backupPath,
      detail: catalogApi.getMissionBattleDetail(missionId, file.overrides),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/mission-battles-backups') {
    sendJson(res, 200, { ok: true, backups: await listBackups() });
    return;
  }

  const restoreMatch = url.pathname.match(/^\/api\/mission-battles-backups\/([^/]+)\/restore$/);
  if (req.method === 'POST' && restoreMatch) {
    const backupId = decodeURIComponent(restoreMatch[1]);
    const src = join(BACKUPS_DIR, backupId);
    if (!src.startsWith(BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentOverrides();
    await copyFile(src, OVERRIDES_PATH);
    const restored = await readOverridesFile();
    sendJson(res, 200, {
      ok: true,
      restoredFrom: backupId,
      previousBackupPath: backupPath,
      updatedAt: restored.updatedAt,
    });
    return;
  }

  // ──── Inimigos ────
  if (req.method === 'GET' && url.pathname === '/api/enemy-combat') {
    const enemyFile = await readEnemyCombatFile();
    const payload = catalogApi.buildEnemyCombatLabPayload({
      diskOverrides: enemyFile,
      updatedAt: enemyFile.updatedAt,
    });
    sendJson(res, 200, { ok: true, ...payload, backups: await listEnemyCombatBackups() });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/enemy-combat') {
    const enemyFile = await readEnemyCombatFile();
    const body = await readBody(req);
    const backupPath = await backupCurrentEnemyCombat();

    for (const id of Array.isArray(body?.clearIdentities) ? body.clearIdentities : []) {
      if (typeof id === 'string') delete enemyFile.identities[id];
    }
    for (const id of Array.isArray(body?.clearMonsterSkills) ? body.clearMonsterSkills : []) {
      if (typeof id === 'string') delete enemyFile.monsterSkills[id];
    }
    for (const [enemyType, raw] of Object.entries(body?.identities ?? {})) {
      const normalized = catalogApi.normalizeEnemyIdentityOverride(raw);
      if (!normalized) throw new Error(`Identidade ${enemyType}: informe ao menos um knob`);
      enemyFile.identities[enemyType] = normalized;
    }
    for (const [skillId, raw] of Object.entries(body?.monsterSkills ?? {})) {
      const normalized = catalogApi.normalizeEnemyMonsterSkillOverride(raw);
      if (!normalized) throw new Error(`Skill monstro ${skillId}: informe ao menos um knob`);
      enemyFile.monsterSkills[skillId] = normalized;
    }

    enemyFile.updatedAt = new Date().toISOString();
    enemyFile.version = 1;
    await writeEnemyCombatFile(enemyFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: enemyFile.updatedAt });
    return;
  }

  const enemyRestoreMatch = url.pathname.match(/^\/api\/enemy-combat-backups\/([^/]+)\/restore$/);
  if (req.method === 'POST' && enemyRestoreMatch) {
    const backupId = decodeURIComponent(enemyRestoreMatch[1]);
    const src = join(ENEMY_COMBAT_BACKUPS_DIR, backupId);
    if (!src.startsWith(ENEMY_COMBAT_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentEnemyCombat();
    await copyFile(src, ENEMY_COMBAT_PATH);
    sendJson(res, 200, { ok: true, restoredFrom: backupId, previousBackupPath: backupPath });
    return;
  }

  // ──── Melhorias ────
  if (req.method === 'GET' && url.pathname === '/api/upgrades') {
    const upgradeFile = await readUpgradeOverridesFile();
    const payload = catalogApi.buildUpgradeTreeLabPayload({
      diskOverrides: upgradeFile,
      updatedAt: upgradeFile.updatedAt,
    });
    sendJson(res, 200, { ok: true, ...payload, backups: await listUpgradeBackups() });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/upgrades') {
    const upgradeFile = await readUpgradeOverridesFile();
    const body = await readBody(req);

    for (const id of Array.isArray(body?.clearIds) ? body.clearIds : []) {
      if (typeof id === 'string') delete upgradeFile.upgrades[id];
    }
    for (const [upgradeId, raw] of Object.entries(body?.upgrades ?? {})) {
      const inputErrors = catalogApi.validateUpgradeOverrideInput(raw);
      if (inputErrors.length > 0) {
        sendJson(res, 400, {
          ok: false,
          error: `${upgradeId}: ${inputErrors.join(' · ')}`,
          dependencyErrors: inputErrors,
        });
        return;
      }
      const normalized = catalogApi.normalizeUpgradeOverride(raw);
      if (!normalized) { delete upgradeFile.upgrades[upgradeId]; continue; }
      upgradeFile.upgrades[upgradeId] = normalized;
    }

    const dependencyErrors = catalogApi.validateUpgradeDependencies(upgradeFile);
    if (dependencyErrors.length > 0) {
      sendJson(res, 400, {
        ok: false,
        error: dependencyErrors.join(' · '),
        dependencyErrors,
      });
      return;
    }

    const backupPath = await backupCurrentUpgradeOverrides();
    upgradeFile.updatedAt = new Date().toISOString();
    upgradeFile.version = 1;
    await writeUpgradeOverridesFile(upgradeFile);
    sendJson(res, 200, { ok: true, backupPath, updatedAt: upgradeFile.updatedAt });
    return;
  }

  const upgradeRestoreMatch = url.pathname.match(/^\/api\/upgrades-backups\/([^/]+)\/restore$/);
  if (req.method === 'POST' && upgradeRestoreMatch) {
    const backupId = decodeURIComponent(upgradeRestoreMatch[1]);
    const src = join(UPGRADE_BACKUPS_DIR, backupId);
    if (!src.startsWith(UPGRADE_BACKUPS_DIR) || !backupId.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'Backup inválido' });
      return;
    }
    const backupPath = await backupCurrentUpgradeOverrides();
    await copyFile(src, UPGRADE_OVERRIDES_PATH);
    sendJson(res, 200, { ok: true, restoredFrom: backupId, previousBackupPath: backupPath });
    return;
  }

  // ──── Auditoria de Economia ────
  if (req.method === 'GET' && url.pathname === '/api/economy-audit') {
    const mapRaw = url.searchParams.get('mapIndex');
    const mapIndex = mapRaw !== null && mapRaw !== '' ? Number(mapRaw) : undefined;
    const chapterRaw = url.searchParams.get('chapterMain');
    const chapterMain = chapterRaw !== null && chapterRaw !== '' ? Number(chapterRaw) : undefined;
    const payload = catalogApi.buildEconomyAuditPayload({
      mapIndex: Number.isFinite(mapIndex) ? mapIndex : undefined,
      chapterMain: Number.isFinite(chapterMain) ? chapterMain : undefined,
    });
    const forge = catalogApi.buildForgeSalvagePayload();
    sendJson(res, 200, { ok: true, ...payload, forge });
    return;
  }

  // ──── Auditoria de Inconsistências ────
  if (req.method === 'GET' && url.pathname === '/api/consistency-audit') {
    const result = catalogApi.buildConsistencyAuditPayload();
    sendJson(res, 200, { ok: true, ...result });
    return;
  }

  // ──── Wave Power ────
  if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/api/wave-power') {
    let body = {};
    if (req.method === 'POST') {
      try {
        const raw = await readBody(req);
        body = raw ? JSON.parse(raw) : {};
      } catch {
        sendJson(res, 400, { ok: false, error: 'Body JSON inválido' });
        return;
      }
    }

    const phaseId = url.searchParams.get('phaseId') ?? body.phaseId;
    if (!phaseId) {
      sendJson(res, 400, { ok: false, error: 'phaseId obrigatório' });
      return;
    }

    // party pode vir de query string `party=sorcerer:10,knight:10` ou do body `{ party: [...] }`
    const partyParam = url.searchParams.get('party') ?? null;
    let party = catalogApi.DEFAULT_REFERENCE_PARTY;
    if (partyParam) {
      const parsed = parsePartyQueryParam(partyParam);
      if (parsed) party = parsed;
    } else if (Array.isArray(body.party) && body.party.length > 0) {
      const valid = body.party.filter(
        (m) =>
          m &&
          typeof m.heroClass === 'string' &&
          typeof m.level === 'number' &&
          m.level >= 1,
      );
      if (valid.length > 0) party = valid;
    }

    const snapshot = catalogApi.estimatePhasePower(phaseId, party);
    sendJson(res, 200, { ok: true, ...snapshot });
    return;
  }

  // ──── Simulação de combate real (headless) ────
  if (req.method === 'POST' && url.pathname === '/api/combat-sim') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { ok: false, error: 'Body JSON inválido' });
      return;
    }

    if (!body || (!body.phaseId && !body.slots && !body.draftPhase)) {
      sendJson(res, 400, { ok: false, error: 'Informe phaseId, draftPhase ou slots' });
      return;
    }

    const runs = Math.max(1, Math.min(50, parseInt(body.runs ?? 1, 10) || 1));
    const request = {
      party: Array.isArray(body.party) && body.party.length > 0 ? body.party : undefined,
      profile: combatSimApi.isSimReferenceProfile(body.profile) ? body.profile : undefined,
      phaseId: body.phaseId ?? undefined,
      waveIndex: body.waveIndex !== undefined ? Number(body.waveIndex) : undefined,
      slots: Array.isArray(body.slots) && body.slots.length > 0 ? body.slots : undefined,
      draftPhase:
        body.draftPhase && Array.isArray(body.draftPhase.waves) && body.draftPhase.waves.length > 0
          ? body.draftPhase
          : undefined,
      maxSeconds: body.maxSeconds ? Number(body.maxSeconds) : undefined,
      seed: body.seed !== undefined ? Number(body.seed) : undefined,
    };

    try {
      const result = combatSimApi.simulateEncounterBatch(request, runs);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String(err?.message ?? err) });
    }
    return;
  }

  // ──── Playback visual (snapshots tick a tick) ────
  if (req.method === 'POST' && url.pathname === '/api/combat-sim-playback') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      sendJson(res, 400, { ok: false, error: 'Body JSON inválido' });
      return;
    }

    if (!body || (!body.phaseId && !body.slots && !body.draftPhase)) {
      sendJson(res, 400, { ok: false, error: 'Informe phaseId, draftPhase ou slots' });
      return;
    }

    const request = {
      party: Array.isArray(body.party) && body.party.length > 0 ? body.party : undefined,
      profile: combatSimApi.isSimReferenceProfile(body.profile) ? body.profile : undefined,
      phaseId: body.phaseId ?? undefined,
      waveIndex: body.waveIndex !== undefined ? Number(body.waveIndex) : undefined,
      slots: Array.isArray(body.slots) && body.slots.length > 0 ? body.slots : undefined,
      draftPhase:
        body.draftPhase && Array.isArray(body.draftPhase.waves) && body.draftPhase.waves.length > 0
          ? body.draftPhase
          : undefined,
      maxSeconds: body.maxSeconds ? Number(body.maxSeconds) : undefined,
      seed: body.seed !== undefined ? Number(body.seed) : undefined,
      snapshotEveryTicks:
        body.snapshotEveryTicks !== undefined ? Number(body.snapshotEveryTicks) : undefined,
    };

    try {
      const result = combatSimApi.simulateEncounterPlayback(request);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String(err?.message ?? err) });
    }
    return;
  }

  // ──── Varredura de win rate por mapa (headless) ────
  if (req.method === 'GET' && url.pathname === '/api/combat-sim-sweep') {
    const mapId = url.searchParams.get('mapId');
    if (!mapId) {
      sendJson(res, 400, { ok: false, error: 'Informe mapId' });
      return;
    }

    const profileRaw = url.searchParams.get('profile');
    const runsRaw = url.searchParams.get('runs');
    const seedRaw = url.searchParams.get('seed');
    const classesRaw = url.searchParams.get('classes');

    const options = {
      profile: combatSimApi.isSimReferenceProfile(profileRaw) ? profileRaw : undefined,
      runsPerPhase: runsRaw !== null ? Math.max(1, Math.min(50, Number(runsRaw) || 10)) : undefined,
      seed: seedRaw !== null ? Number(seedRaw) : undefined,
      partyClasses: classesRaw ? classesRaw.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
    };

    try {
      const result = combatSimApi.sweepMapWinRate(mapId, options);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String(err?.message ?? err) });
    }
    return;
  }

  // ──── Stock Preview de loja ────
  const stockPreviewMatch = url.pathname.match(/^\/api\/shops\/([^/]+)\/stock-preview$/);
  if (req.method === 'GET' && stockPreviewMatch) {
    const shopFile = await readShopOverridesFile();
    const shopId = decodeURIComponent(stockPreviewMatch[1]);
    const seedRaw = url.searchParams.get('seed');
    const tierRaw = url.searchParams.get('tier');
    const preview = catalogApi.previewShopStock(shopId, {
      seed: seedRaw !== null ? Number(seedRaw) : undefined,
      tier: tierRaw !== null ? Number(tierRaw) : undefined,
      diskOverrides: shopFile,
    });
    if (!preview) {
      sendJson(res, 404, { ok: false, error: 'Loja não encontrada' });
      return;
    }
    sendJson(res, 200, { ok: true, ...preview });
    return;
  }

  // ──── Versão do workspace (auto-reload) ────
  if (req.method === 'GET' && url.pathname === '/api/workspace-version') {
    const versionData = await getWorkspaceVersion();
    sendJson(res, 200, { ok: true, ...versionData });
    return;
  }

  // ──── Listagem genérica de backups e diff ────
  if (req.method === 'GET' && url.pathname === '/api/backups') {
    const scope = url.searchParams.get('scope') || '';
    const info = SCOPE_MAP[scope];
    if (!info) {
      sendJson(res, 400, {
        ok: false,
        error: `Scope inválido. Válidos: ${Object.keys(SCOPE_MAP).join(', ')}`,
      });
      return;
    }
    const backups = await listBackupFiles(info.backupsDir);
    sendJson(res, 200, { ok: true, scope, backups });
    return;
  }

  const backupsDiffMatch = url.pathname.match(/^\/api\/backups\/diff$/);
  if (req.method === 'GET' && backupsDiffMatch) {
    const scope = url.searchParams.get('scope') || '';
    const idA = url.searchParams.get('a') || '';
    const idB = url.searchParams.get('b') || '';
    const info = SCOPE_MAP[scope];
    if (!info) {
      sendJson(res, 400, { ok: false, error: `Scope inválido: ${scope}` });
      return;
    }
    if (!idA || !idB) {
      sendJson(res, 400, { ok: false, error: 'Parâmetros a e b são obrigatórios' });
      return;
    }
    if (!idA.endsWith('.json') || !idB.endsWith('.json')) {
      sendJson(res, 400, { ok: false, error: 'IDs de backup devem terminar em .json' });
      return;
    }
    if (idA.includes('/') || idA.includes('..') || idB.includes('/') || idB.includes('..')) {
      sendJson(res, 400, { ok: false, error: 'ID de backup inválido' });
      return;
    }
    const pathA = join(info.backupsDir, idA);
    const pathB = join(info.backupsDir, idB);
    if (!isPathSafe(pathA, info.backupsDir) || !isPathSafe(pathB, info.backupsDir)) {
      sendJson(res, 403, { ok: false, error: 'Path fora do diretório de backups' });
      return;
    }
    let snapA, snapB;
    try { snapA = JSON.parse(await readFile(pathA, 'utf8')); }
    catch { sendJson(res, 404, { ok: false, error: `Backup não encontrado: ${idA}` }); return; }
    try { snapB = JSON.parse(await readFile(pathB, 'utf8')); }
    catch { sendJson(res, 404, { ok: false, error: `Backup não encontrado: ${idB}` }); return; }
    const diff = diffJsonSnapshots(snapA, snapB);
    sendJson(res, 200, { ok: true, scope, a: idA, b: idB, diff });
    return;
  }

  // ──── Promoção de overrides para catálogo canônico ────

  /** Helper que resolve a função de backup do override pelo scope */
  function resolveOverrideBackupFn(scope) {
    const fns = {
      'phase-battle': backupCurrentOverrides,
      'phase-reward': backupCurrentRewardOverrides,
      'hero-combat': backupCurrentHeroCombat,
      'hero-level-xp': backupCurrentHeroLevelXp,
      'gear-items': backupCurrentGearItemOverrides,
      shops: backupCurrentShopOverrides,
      'enemy-combat': backupCurrentEnemyCombat,
      upgrades: backupCurrentUpgradeOverrides,
    };
    return fns[scope] ?? null;
  }

  if (req.method === 'GET' && url.pathname === '/api/promotion/preview') {
    const scope = url.searchParams.get('scope') || '';
    if (!SCOPE_MAP[scope]) {
      sendJson(res, 400, { ok: false, error: `Scope inválido: ${scope}` });
      return;
    }
    const preview = await previewPromotion(scope);
    sendJson(res, preview.ok ? 200 : 400, preview);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/promotion/apply') {
    const body = await readBody(req);
    const scope = (typeof body?.scope === 'string' ? body.scope : '') || '';
    const confirmed = body?.confirmed === true;

    if (!SCOPE_MAP[scope]) {
      sendJson(res, 400, { ok: false, error: `Scope inválido: ${scope}` });
      return;
    }
    if (!confirmed) {
      sendJson(res, 400, { ok: false, error: 'Confirmação explícita necessária: { scope, confirmed: true }' });
      return;
    }
    if (!isScopeJsonBacked(scope)) {
      sendJson(res, 422, {
        ok: false,
        error: 'Scope TS-backed: use GET /api/promotion/preview para obter o patchJson e aplique manualmente.',
        scope,
        isJsonBacked: false,
        tsBackedOnly: true,
      });
      return;
    }

    const backupFn = resolveOverrideBackupFn(scope);
    if (!backupFn) {
      sendJson(res, 500, { ok: false, error: 'Função de backup não encontrada' });
      return;
    }
    const result = await applyPromotion(scope, backupFn);
    sendJson(res, result.ok ? 200 : 400, result);
    return;
  }

  // ──── Balance Pack (export / preview / import de todos os overrides) ────
  if (req.method === 'GET' && url.pathname === '/api/balance-pack') {
    const label = url.searchParams.get('label') || undefined;
    const scopes = await collectWorkspaceScopePayloads();
    const pack = buildBalancePack(scopes, { label });
    sendJson(res, 200, { ok: true, pack });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/balance-pack/preview') {
    const body = await readBody(req);
    const validated = validateBalancePack(body?.pack ?? body);
    if (!validated.ok) {
      sendJson(res, 400, validated);
      return;
    }
    const current = await collectWorkspaceScopePayloads();
    const onlyScopes = Array.isArray(body?.scopes) ? body.scopes.filter((s) => typeof s === 'string') : undefined;
    const preview = previewBalancePack(validated.pack, current, onlyScopes);
    sendJson(res, 200, preview);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/balance-pack/import') {
    const body = await readBody(req);
    const confirmed = body?.confirmed === true;
    if (!confirmed) {
      sendJson(res, 400, {
        ok: false,
        error: 'Confirmação explícita necessária: { pack, confirmed: true }',
      });
      return;
    }
    const validated = validateBalancePack(body?.pack);
    if (!validated.ok) {
      sendJson(res, 400, validated);
      return;
    }
    const onlyScopes = Array.isArray(body?.scopes)
      ? body.scopes.filter((s) => typeof s === 'string')
      : undefined;
    const targets = resolveImportScopes(validated.pack, onlyScopes);
    if (targets.length === 0) {
      sendJson(res, 400, { ok: false, error: 'Nenhum scope selecionado para importar' });
      return;
    }

    const current = await collectWorkspaceScopePayloads();
    const preview = previewBalancePack(validated.pack, current, targets);
    if (preview.totalChanges === 0) {
      sendJson(res, 200, {
        ok: true,
        imported: [],
        backups: {},
        message: 'Nenhuma alteração — workspace já está alinhado ao pack.',
        preview,
      });
      return;
    }

    /** @type {Record<string, string | null>} */
    const backups = {};
    const imported = [];
    for (const scope of targets) {
      const row = preview.scopes.find((s) => s.scope === scope);
      if (!row || row.changeCount === 0) continue;
      const backupFn = resolveOverrideBackupFn(scope);
      if (!backupFn) {
        sendJson(res, 500, { ok: false, error: `Backup indisponível para scope ${scope}` });
        return;
      }
      backups[scope] = await backupFn();
      await writeScopeOverridePayload(scope, validated.pack.scopes[scope]);
      imported.push(scope);
    }

    sendJson(res, 200, {
      ok: true,
      imported,
      backups,
      importedAt: new Date().toISOString(),
      preview,
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Rota não encontrada' });
}

async function main() {
  await build();

  const server = createServer(async (req, res) => {
    const isApi = (req.url ?? '').startsWith('/api/');
    try {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
      if (url.pathname.startsWith('/api/')) {
        await handleApi(req, res, url);
        return;
      }

      if (url.pathname.startsWith('/panel/assets/')) {
        await servePanelAsset(url.pathname, res);
        return;
      }

      let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      const filePath = join(outDir, pathname.replace(/^\//, ''));
      if (!filePath.startsWith(outDir)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      res.end(body);
    } catch (error) {
      if (isApi) {
        sendJson(res, 500, {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }
      res.writeHead(404).end('Not found');
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`\nBalance Lab: http://127.0.0.1:${port}/`);
    console.log('Aba Missões: identidade (mission-overrides) + batalhas (phase-battle-overrides)');
    console.log('Aba XP por fase: alvos XP/ouro → phase-reward-overrides.json');
    console.log('Aba XP por nível: curva de level-up → hero-level-xp-overrides.json');
    console.log('Aba Itens: nome/stats/requisitos → gear-item-overrides.json');
    console.log('Aba Lojas: CRUD + pool/preços → shop-overrides.json');
    console.log('Aba Personagens: skills/identidade/passivas/evoluções → hero-combat-overrides.json');
    console.log('Aba Inimigos: identidade e skills de monstro → enemy-combat-overrides.json');
    console.log('Aba Melhorias: custo/nome/desc → upgrade-overrides.json');
    console.log('Aba Economia: auditoria de ouro por fase + lojas');
    console.log('GET /api/consistency-audit → inconsistências e órfãos (read-only)');
    console.log('Ctrl+C para encerrar.\n');
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
