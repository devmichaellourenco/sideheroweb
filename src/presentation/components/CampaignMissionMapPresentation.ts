import { MissionBoardDto, MissionPreviewDto } from '../../application/dto/MissionBoardDto';
import { EnemyDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, getEnemySpriteUrl, imgTag } from '../assets/AssetCatalog';
import {
  placeMissionsOnLayout,
  resolveMissionMapLayout,
  type MapPercentPoint,
} from '../campaign/MissionMapLayoutCatalog';
import { renderEnemyTooltipContent } from './EnemyBattlePresentation';

export function escapeMissionHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function kindLabel(kind: MissionPreviewDto['kind']): string {
  if (kind === 'main') return 'Principal';
  if (kind === 'side') return 'Secundária';
  return 'Normal';
}

export function resolveInitialPendingMissionId(board: MissionBoardDto | null | undefined): string | null {
  if (!board) return null;
  const selected =
    (board.main?.selected ? board.main : null) ??
    board.sides.find((mission) => mission.selected) ??
    board.normals.find((mission) => mission.selected);
  if (selected) return selected.id;
  if (board.main) return board.main.id;
  if (board.sides[0]) return board.sides[0].id;
  return board.normals[0]?.id ?? null;
}

export function findMissionOnBoard(
  board: MissionBoardDto | null | undefined,
  missionId: string | null,
): MissionPreviewDto | null {
  if (!board || !missionId) return null;
  if (board.main?.id === missionId) return board.main;
  return (
    board.sides.find((mission) => mission.id === missionId) ??
    board.normals.find((mission) => mission.id === missionId) ??
    null
  );
}

function styleForPoint(point: MapPercentPoint): string {
  return `left:${point.x}%;top:${point.y}%`;
}

function renderMissionPin(
  mission: MissionPreviewDto,
  pendingMissionId: string | null,
  point: MapPercentPoint,
): string {
  const pending = mission.id === pendingMissionId;
  const stateClass = [
    pending ? ' campaign-mission-pin--pending' : '',
    ` campaign-mission-pin--${mission.kind}`,
  ].join('');
  const stars = mission.stars ?? 0;
  const label = `${kindLabel(mission.kind)}: ${mission.name}`;

  return `
    <button
      type="button"
      class="campaign-mission-pin${stateClass}"
      style="${styleForPoint(point)}"
      data-mission-id="${escapeMissionHtml(mission.id)}"
      data-mission-kind="${escapeMissionHtml(mission.kind)}"
      title="${escapeMissionHtml(label)}"
      aria-label="${escapeMissionHtml(label)}"
      aria-pressed="${pending ? 'true' : 'false'}"
    >
      <span class="campaign-mission-pin-glyph" aria-hidden="true"></span>
      ${
        stars > 0
          ? `<span class="campaign-mission-pin-stars" aria-hidden="true">${'★'.repeat(stars)}</span>`
          : ''
      }
    </button>
  `;
}

function renderLegacyListBoard(
  board: MissionBoardDto,
  pendingMissionId: string | null,
): string {
  const missions = [
    ...(board.main ? [board.main] : []),
    ...board.sides,
    ...board.normals,
  ];

  if (missions.length === 0) {
    return `
      <div class="campaign-mission-board campaign-mission-board--empty">
        <p class="empty-state">Nenhuma missão disponível neste mapa nesta visita.</p>
      </div>
    `;
  }

  let pendingPoint: MapPercentPoint | null = null;
  const nodes = missions
    .map((mission, index) => {
      const point = { x: index % 2 === 0 ? 28 : 72, y: 20 + index * 18 };
      if (mission.id === pendingMissionId) pendingPoint = point;
      return renderMissionPin(mission, pendingMissionId, point);
    })
    .join('');

  const pendingMission = findMissionOnBoard(board, pendingMissionId);
  const popover =
    pendingMission && pendingPoint
      ? renderMissionPinPopover(pendingMission, pendingPoint)
      : '';

  return `
    <div class="campaign-mission-board campaign-mission-board--list" data-campaign-mission-board>
      <div class="campaign-mission-board-track campaign-mission-board-track--pins">${nodes}${popover}</div>
    </div>
  `;
}

/** Stage de mapa (Stendra+) ou lista legado. Posições em % — independentes da arte. */
export function renderMissionLocalesMap(
  board: MissionBoardDto,
  pendingMissionId: string | null,
): string {
  const layout = resolveMissionMapLayout(board.mapId);
  if (!layout) {
    return renderLegacyListBoard(board, pendingMissionId);
  }

  const byId = new Map<string, MissionPreviewDto>();
  if (board.main) byId.set(board.main.id, board.main);
  for (const side of board.sides) byId.set(side.id, side);
  for (const normal of board.normals) byId.set(normal.id, normal);

  if (byId.size === 0) {
    return `
      <div class="campaign-mission-board campaign-mission-board--empty">
        <p class="empty-state">Nenhuma missão disponível neste mapa nesta visita.</p>
      </div>
    `;
  }

  const placed = placeMissionsOnLayout({
    layout,
    mainId: board.main?.id ?? null,
    sideIds: board.sides.map((mission) => mission.id),
    normalIds: board.normals.map((mission) => mission.id),
  });

  const markers = placed
    .map((entry) => {
      const mission = byId.get(entry.missionId);
      if (!mission) return '';
      return renderMissionPin(mission, pendingMissionId, entry.point);
    })
    .join('');

  const pendingEntry = placed.find((entry) => entry.missionId === pendingMissionId);
  const pendingMission = pendingEntry ? byId.get(pendingEntry.missionId) : null;
  const popover =
    pendingMission && pendingEntry
      ? renderMissionPinPopover(pendingMission, pendingEntry.point)
      : '';

  const bgUrl = layout.backgroundAssetPath ? getAssetUrl(layout.backgroundAssetPath) : '';
  const stageStyle = [
    `aspect-ratio:${layout.aspectRatio}`,
    bgUrl ? `--mission-map-bg:url('${escapeMissionHtml(bgUrl)}')` : '',
  ]
    .filter(Boolean)
    .join(';');
  const hasPopover = Boolean(popover);

  return `
    <div
      class="campaign-mission-board campaign-mission-board--stage${
        hasPopover ? ' campaign-mission-board--has-popover' : ''
      }"
      data-campaign-mission-board
      data-mission-map="${escapeMissionHtml(layout.mapId)}"
      data-mission-map-aspect="${layout.aspectRatio}"
    >
      <div
        class="campaign-mission-stage${bgUrl ? ' campaign-mission-stage--has-bg' : ''}"
        style="${stageStyle}"
      >
        <div class="campaign-mission-stage-art" aria-hidden="true"></div>
        <div class="campaign-mission-stage-markers">${markers}${popover}</div>
      </div>
    </div>
  `;
}

function renderFeaturedEnemies(mission: MissionPreviewDto): string {
  const enemies =
    mission.featuredEnemies?.length > 0
      ? mission.featuredEnemies
      : (mission.featuredEnemyTypes ?? []).map(
          (enemyType) =>
            ({
              enemyType,
              name: enemyType,
            }) as EnemyDto,
        );

  if (enemies.length === 0) return '';

  const items = enemies
    .map((enemy) => {
      const url = getEnemySpriteUrl(enemy.enemyType, enemy.name);
      const hasStats = typeof enemy.attack === 'number' && typeof enemy.maxHealth === 'number';
      const tooltip = hasStats
        ? renderEnemyTooltipContent(enemy, mission.difficultyTier)
        : `<strong class="enemy-tooltip-name">${escapeMissionHtml(enemy.name)}</strong>`;

      return `
        <li
          class="campaign-mission-enemy"
          data-enemy-tooltip
          tabindex="0"
          aria-label="${escapeMissionHtml(enemy.name)}"
        >
          ${imgTag(url, enemy.name, 'campaign-mission-enemy-sprite')}
          <span class="enemy-tooltip-content hidden">${tooltip}</span>
        </li>
      `;
    })
    .join('');

  return `
    <div class="campaign-mission-quest-foes">
      <p class="campaign-mission-quest-section-label">Inimigos</p>
      <ul class="campaign-mission-enemies" aria-label="Inimigos em destaque">${items}</ul>
    </div>
  `;
}

function renderRewardPills(mission: MissionPreviewDto): string {
  const goldIcon = imgTag(getAssetUrl(ASSETS.ui.gold), 'Ouro', 'campaign-mission-quest-reward-icon');
  const xpIcon = imgTag(getAssetUrl(ASSETS.ui.xp), 'XP', 'campaign-mission-quest-reward-icon');

  const bonusRows: string[] = [];
  if (mission.rewards?.itemId) {
    const label = mission.rewardItemName ?? 'Item exclusivo';
    bonusRows.push(`
      <li class="campaign-mission-quest-bonus">
        <span class="campaign-mission-quest-bonus-kind">Item</span>
        <span class="campaign-mission-quest-bonus-name">${escapeMissionHtml(label)}</span>
      </li>
    `);
  }
  if (mission.rewards?.sceneId) {
    const label = mission.rewardSceneTitle ?? 'Cena';
    bonusRows.push(`
      <li class="campaign-mission-quest-bonus">
        <span class="campaign-mission-quest-bonus-kind">Cena</span>
        <span class="campaign-mission-quest-bonus-name">${escapeMissionHtml(label)}</span>
      </li>
    `);
  }

  return `
    <section class="campaign-mission-quest-rewards" aria-label="Recompensas">
      <p class="campaign-mission-quest-section-label">Recompensas</p>
      <ul class="campaign-mission-quest-pills">
        <li class="campaign-mission-quest-pill campaign-mission-quest-pill--gold" title="Ouro obtido ao derrotar inimigos">
          ${goldIcon}
          <span class="campaign-mission-quest-pill-value">${mission.expectedGold}</span>
          <span class="campaign-mission-quest-pill-label">ouro</span>
        </li>
        <li class="campaign-mission-quest-pill campaign-mission-quest-pill--xp" title="XP concedido ao vencer a missão">
          ${xpIcon}
          <span class="campaign-mission-quest-pill-value">${mission.victoryXp}</span>
          <span class="campaign-mission-quest-pill-label">XP</span>
          <span class="campaign-mission-quest-pill-hint">na vitória</span>
        </li>
      </ul>
      ${
        bonusRows.length > 0
          ? `<ul class="campaign-mission-quest-bonuses" aria-label="Bônus de conclusão">${bonusRows.join('')}</ul>`
          : ''
      }
    </section>
  `;
}

function renderMissionPreviewBody(mission: MissionPreviewDto): string {
  const stars =
    mission.stars && mission.stars > 0
      ? `<span class="campaign-mission-quest-stars" aria-label="${mission.stars} estrelas">${'★'.repeat(mission.stars)}</span>`
      : '';

  return `
    <div class="campaign-mission-quest-body campaign-mission-popover-copy">
      <header class="campaign-mission-quest-header">
        <div class="campaign-mission-quest-badges">
          <span class="campaign-mission-quest-kind campaign-mission-quest-kind--${escapeMissionHtml(mission.kind)}">${escapeMissionHtml(kindLabel(mission.kind))}</span>
          ${stars}
        </div>
        <h4 class="campaign-mission-quest-title campaign-phase-preview-title">${escapeMissionHtml(mission.name)}</h4>
      </header>
      ${renderRewardPills(mission)}
      <div class="campaign-mission-quest-threat">
        <p class="campaign-mission-quest-meta campaign-phase-preview-meta">${mission.waveCount} waves · Tier ${mission.difficultyTier}</p>
        ${
          mission.challengeHint
            ? `<p class="campaign-mission-quest-challenge campaign-phase-preview-challenge">${escapeMissionHtml(mission.challengeHint)}</p>`
            : ''
        }
      </div>
      ${renderFeaturedEnemies(mission)}
    </div>
  `;
}

export function renderMissionPinPopover(
  mission: MissionPreviewDto,
  point: MapPercentPoint,
): string {
  return `
    <div
      class="campaign-mission-popover campaign-mission-quest campaign-mission-quest--${escapeMissionHtml(mission.kind)}"
      data-campaign-mission-preview
      data-placement="above"
      style="${styleForPoint(point)}"
      role="dialog"
      aria-label="${escapeMissionHtml(mission.name)}"
    >
      ${renderMissionPreviewBody(mission)}
      <button
        type="button"
        class="campaign-phase-preview-start campaign-mission-quest-cta"
        data-campaign-start-mission="${escapeMissionHtml(mission.id)}"
      >
        Iniciar missão
      </button>
    </div>
  `;
}

export const MISSION_POPOVER_PORTAL_ID = 'campaign-mission-popover-portal';

export type PopoverBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type PopoverPlacement = 'above' | 'below';

export function intersectPopoverBounds(
  viewport: PopoverBox,
  scrollport: PopoverBox | null,
  margin: number,
): PopoverBox {
  const view = {
    top: margin,
    left: margin,
    width: Math.max(0, viewport.width - margin * 2),
    height: Math.max(0, viewport.height - margin * 2),
  };

  if (!scrollport) return view;

  const top = Math.max(view.top, scrollport.top + margin);
  const left = Math.max(view.left, scrollport.left + margin);
  const right = Math.min(view.left + view.width, scrollport.left + scrollport.width - margin);
  const bottom = Math.min(view.top + view.height, scrollport.top + scrollport.height - margin);

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function computeMissionPopoverPosition(input: {
  pin: PopoverBox;
  popover: PopoverBox;
  bounds: PopoverBox;
  gap: number;
}): { left: number; top: number; placement: PopoverPlacement } {
  const { pin, popover, bounds, gap } = input;
  const pinCenterX = pin.left + pin.width / 2;

  const aboveTop = pin.top - gap - popover.height;
  const belowTop = pin.top + pin.height + gap;
  const aboveFits = aboveTop >= bounds.top;
  const belowFits = belowTop + popover.height <= bounds.top + bounds.height;

  let placement: PopoverPlacement = 'above';
  let top = aboveTop;

  if (!aboveFits && belowFits) {
    placement = 'below';
    top = belowTop;
  } else if (!aboveFits && !belowFits) {
    const spaceAbove = pin.top - bounds.top;
    const spaceBelow = bounds.top + bounds.height - (pin.top + pin.height);
    if (spaceBelow > spaceAbove) {
      placement = 'below';
      top = belowTop;
    }
  }

  let left = pinCenterX - popover.width / 2;
  left = Math.max(bounds.left, Math.min(left, bounds.left + bounds.width - popover.width));
  top = Math.max(bounds.top, Math.min(top, bounds.top + bounds.height - popover.height));

  return { left, top, placement };
}

function ensureMissionPopoverPortal(): HTMLElement {
  let portal = document.getElementById(MISSION_POPOVER_PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = MISSION_POPOVER_PORTAL_ID;
  portal.className = 'campaign-mission-popover-portal';
  document.body.appendChild(portal);
  return portal;
}

function boxFromDomRect(rect: DOMRect): PopoverBox {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function findMissionPopoverScrollport(pin: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = pin.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    const scrollable =
      /(auto|scroll|overlay)/.test(style.overflowY) || /(auto|scroll|overlay)/.test(style.overflow);
    if (scrollable && node.scrollHeight > node.clientHeight + 1) return node;
    if (
      node.classList.contains('campaign-path-scroll') ||
      node.classList.contains('camp-campaign-map-body') ||
      node.classList.contains('modal-body')
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function findPendingMissionPin(root: ParentNode): HTMLElement | null {
  return (
    (root.querySelector('.campaign-mission-pin[aria-pressed="true"]') as HTMLElement | null) ??
    (root.querySelector('.campaign-mission-pin--pending') as HTMLElement | null)
  );
}

let missionPopoverFollowCleanup: (() => void) | null = null;

export function clearMissionPopoverPortal(): void {
  missionPopoverFollowCleanup?.();
  missionPopoverFollowCleanup = null;
  const portal = document.getElementById(MISSION_POPOVER_PORTAL_ID);
  if (portal) portal.innerHTML = '';
}

/** Portal + posição fixa com clamp na viewport e no scrollport visível. */
export function syncMissionPopoverPlacement(root: ParentNode): void {
  const popoverInRoot = root.querySelector('.campaign-mission-popover') as HTMLElement | null;
  if (!popoverInRoot) {
    clearMissionPopoverPortal();
    return;
  }

  const pin = findPendingMissionPin(root);
  if (!pin) return;

  const portal = ensureMissionPopoverPortal();
  portal.querySelectorAll('.campaign-mission-popover').forEach((node) => {
    if (node !== popoverInRoot) node.remove();
  });

  if (popoverInRoot.parentElement !== portal) {
    portal.appendChild(popoverInRoot);
  }

  popoverInRoot.classList.add('campaign-mission-popover--portaled');
  popoverInRoot.style.removeProperty('--popover-shift-x');
  popoverInRoot.style.visibility = 'hidden';
  popoverInRoot.style.left = '0px';
  popoverInRoot.style.top = '0px';
  popoverInRoot.style.transform = 'none';

  const margin = 8;
  const gap = 8;
  const pinRect = pin.getBoundingClientRect();
  const popRect = popoverInRoot.getBoundingClientRect();
  const scrollport = findMissionPopoverScrollport(pin);
  const scrollportBox = scrollport ? boxFromDomRect(scrollport.getBoundingClientRect()) : null;
  const bounds = intersectPopoverBounds(
    { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight },
    scrollportBox,
    margin,
  );
  const placement = computeMissionPopoverPosition({
    pin: boxFromDomRect(pinRect),
    popover: boxFromDomRect(popRect),
    bounds,
    gap,
  });

  popoverInRoot.dataset.placement = placement.placement;
  popoverInRoot.style.left = `${Math.round(placement.left)}px`;
  popoverInRoot.style.top = `${Math.round(placement.top)}px`;
  popoverInRoot.style.visibility = 'visible';

  bindMissionPopoverFollow(root);
}

export function bindMissionPopoverFollow(root: ParentNode): void {
  missionPopoverFollowCleanup?.();
  missionPopoverFollowCleanup = null;

  const popover = document
    .getElementById(MISSION_POPOVER_PORTAL_ID)
    ?.querySelector('.campaign-mission-popover');
  if (!popover) return;

  const pin = findPendingMissionPin(root);
  if (!pin) return;

  const onReposition = () => syncMissionPopoverPlacement(root);
  const scrollTargets = new Set<EventTarget>();
  let node: HTMLElement | null = pin;
  while (node) {
    scrollTargets.add(node);
    node = node.parentElement;
  }
  scrollTargets.add(window);

  scrollTargets.forEach((target) => {
    target.addEventListener('scroll', onReposition, { passive: true });
  });
  window.addEventListener('resize', onReposition, { passive: true });

  missionPopoverFollowCleanup = () => {
    scrollTargets.forEach((target) => {
      target.removeEventListener('scroll', onReposition);
    });
    window.removeEventListener('resize', onReposition);
  };
}

export function renderMissionSelectHint(): string {
  return `
    <p class="campaign-mission-select-hint">Toque em um local no mapa para ver a missão.</p>
  `;
}

/** @deprecated Prefer popover no pin via renderMissionLocalesMap. Mantido para testes legados. */
export function renderMissionPreviewFooter(
  board: MissionBoardDto | null | undefined,
  pendingMissionId: string | null,
): string {
  const mission = findMissionOnBoard(board, pendingMissionId);
  if (!mission) {
    return `
      <footer class="campaign-phase-preview campaign-phase-preview--empty">
        <p class="campaign-phase-preview-empty">Selecione uma missão no mapa de locais.</p>
      </footer>
    `;
  }

  return `
    <footer class="campaign-phase-preview" data-campaign-mission-preview>
      <div class="campaign-phase-preview-main">
        ${renderMissionPreviewBody(mission)}
      </div>
      <button
        type="button"
        class="campaign-phase-preview-start"
        data-campaign-start-mission="${escapeMissionHtml(mission.id)}"
      >
        Iniciar missão
      </button>
    </footer>
  `;
}

export function renderMissionBoardChromeHint(): string {
  return imgTag(getAssetUrl(ASSETS.ui.campaign), 'Missões', 'campaign-mission-hint-icon');
}
