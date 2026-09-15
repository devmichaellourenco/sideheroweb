import { describe, expect, it } from 'vitest';
import { UPGRADE_CATALOG } from '../../domain/upgrades/UpgradeCatalog';
import {
  getUpgradeNodePosition,
  listUpgradeLayoutEntries,
  UPGRADE_TREE_MIN_NODE_DISTANCE,
} from './UpgradeTreeLayout';
import {
  findSiblingBranchConflicts,
  isStraightBranchEdge,
  resolveUpgradeParentIds,
} from './UpgradeTreeGraphPresentation';

function catalogEdges() {
  return UPGRADE_CATALOG.flatMap((entry) =>
    resolveUpgradeParentIds(entry.id).map((parentId) => ({ fromId: parentId, toId: entry.id })),
  );
}

describe('UpgradeTreeLayout', () => {
  it('mantém distância mínima entre centros dos nodos', () => {
    const entries = listUpgradeLayoutEntries();

    for (let left = 0; left < entries.length; left += 1) {
      for (let right = left + 1; right < entries.length; right += 1) {
        const a = entries[left];
        const b = entries[right];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        expect(
          distance,
          `sobreposição entre ${a.id} e ${b.id} (${distance.toFixed(1)}px)`,
        ).toBeGreaterThanOrEqual(UPGRADE_TREE_MIN_NODE_DISTANCE);
      }
    }
  });

  it('cada aresta do catálogo segue uma linha reta (horizontal, vertical ou diagonal 45°)', () => {
    for (const entry of UPGRADE_CATALOG) {
      const child = getUpgradeNodePosition(entry.id);
      expect(child, `layout ausente: ${entry.id}`).toBeDefined();
      if (!child) continue;

      for (const parentId of resolveUpgradeParentIds(entry.id)) {
        const parent = getUpgradeNodePosition(parentId);
        expect(parent, `layout ausente: ${parentId}`).toBeDefined();
        if (!parent) continue;

        expect(
          isStraightBranchEdge(parent, child),
          `aresta torta: ${parentId} -> ${entry.id}`,
        ).toBe(true);
      }
    }
  });

  it('dá um ângulo distinto para cada filho do mesmo pai', () => {
    const conflicts = findSiblingBranchConflicts(catalogEdges());

    expect(
      conflicts,
      conflicts
        .map((c) => `${c.parentId} envia ${c.childIds.join(' e ')} na direção ${c.direction}°`)
        .join('; '),
    ).toEqual([]);
  });

  it('nenhuma aresta atravessa um nodo que não é sua ponta', () => {
    const entries = listUpgradeLayoutEntries();

    for (const edge of catalogEdges()) {
      const from = getUpgradeNodePosition(edge.fromId);
      const to = getUpgradeNodePosition(edge.toId);
      if (!from || !to) continue;

      for (const other of entries) {
        if (other.id === edge.fromId || other.id === edge.toId) continue;

        expect(
          distanceToSegment(other, from, to),
          `${edge.fromId} -> ${edge.toId} passa por cima de ${other.id}`,
        ).toBeGreaterThanOrEqual(UPGRADE_TREE_MIN_NODE_DISTANCE / 2);
      }
    }
  });
});

function distanceToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}
