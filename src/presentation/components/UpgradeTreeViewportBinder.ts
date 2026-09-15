const MIN_SCALE = 0.45;
const MAX_SCALE = 2;
const ZOOM_STEP = 0.08;

export interface UpgradeTreeViewportState {
  scale: number;
  panX: number;
  panY: number;
}

export function parseUpgradeTreeViewportTransform(transform: string): UpgradeTreeViewportState | null {
  const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
  const scaleMatch = transform.match(/scale\(([-\d.]+)\)/);
  if (!translateMatch || !scaleMatch) return null;

  return {
    panX: Number(translateMatch[1]),
    panY: Number(translateMatch[2]),
    scale: Number(scaleMatch[1]),
  };
}

export function captureUpgradeTreeViewport(viewport: HTMLElement): UpgradeTreeViewportState | null {
  const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement | null;
  if (!stage?.style.transform) return null;
  return parseUpgradeTreeViewportTransform(stage.style.transform);
}

function formatUpgradeTreeViewportTransform(state: UpgradeTreeViewportState): string {
  return `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
}

export function bindUpgradeTreeViewport(
  viewport: HTMLElement,
  options: {
    initialState?: UpgradeTreeViewportState | null;
    onTransformChange?: (state: UpgradeTreeViewportState) => void;
  } = {},
): () => void {
  const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement | null;
  if (!stage) return () => undefined;

  let scale = options.initialState?.scale ?? 1;
  let panX = options.initialState?.panX ?? 0;
  let panY = options.initialState?.panY ?? 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const applyTransform = () => {
    stage.style.transform = formatUpgradeTreeViewportTransform({ scale, panX, panY });
    options.onTransformChange?.({ scale, panX, panY });
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();

    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const previousScale = scale;

    const direction = event.deltaY > 0 ? -1 : 1;
    scale = clamp(scale + direction * ZOOM_STEP, MIN_SCALE, MAX_SCALE);

    const scaleRatio = scale / previousScale;
    panX = pointerX - (pointerX - panX) * scaleRatio;
    panY = pointerY - (pointerY - panY) * scaleRatio;

    applyTransform();
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-upgrade-node], [data-upgrade-buy], button, a')) return;

    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('upgrade-tree-viewport--panning');
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;

    panX += event.clientX - lastPointerX;
    panY += event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    applyTransform();
  };

  const endDrag = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('upgrade-tree-viewport--panning');
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };

  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  applyTransform();

  return () => {
    viewport.removeEventListener('wheel', onWheel);
    viewport.removeEventListener('pointerdown', onPointerDown);
    viewport.removeEventListener('pointermove', onPointerMove);
    viewport.removeEventListener('pointerup', endDrag);
    viewport.removeEventListener('pointercancel', endDrag);
    viewport.removeEventListener('pointerleave', endDrag);
    stage.style.transform = '';
    viewport.classList.remove('upgrade-tree-viewport--panning');
  };
}

export function focusUpgradeTreeNode(viewport: HTMLElement, nodeId: string): UpgradeTreeViewportState | null {
  const stage = viewport.querySelector('.upgrade-tree-stage') as HTMLElement | null;
  const node = viewport.querySelector(`[data-upgrade-node="${nodeId}"]`) as HTMLElement | null;
  if (!stage || !node) return null;

  const viewportRect = viewport.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const current = captureUpgradeTreeViewport(viewport);
  const scale = current?.scale ?? 1;

  const nodeCenterX = nodeRect.left + nodeRect.width / 2 - stageRect.left;
  const nodeCenterY = nodeRect.top + nodeRect.height / 2 - stageRect.top;

  const panX = viewportRect.width / 2 - nodeCenterX * scale;
  const panY = viewportRect.height / 2 - nodeCenterY * scale;

  const state = { panX, panY, scale };
  stage.style.transform = formatUpgradeTreeViewportTransform(state);
  return state;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
