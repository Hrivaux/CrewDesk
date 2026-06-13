import type { Vec2, WorkspaceAgent, WorkspaceObject } from "@/types/workspace";
import {
  AGENT_RADIUS,
  BOARD_DEPTH,
  BOARD_WIDTH,
  GRID_SIZE,
  HALF_BOARD_DEPTH,
  HALF_BOARD_WIDTH,
  getRect,
  pointInsideRect,
  snapPoint,
} from "@/systems/collisions";

interface Cell {
  x: number;
  z: number;
}

const COLS = Math.floor(BOARD_WIDTH / GRID_SIZE) + 1;
const ROWS = Math.floor(BOARD_DEPTH / GRID_SIZE) + 1;

function key(cell: Cell): string {
  return `${cell.x}:${cell.z}`;
}

function worldToCell(point: Vec2): Cell {
  return {
    x: Math.round((point.x + HALF_BOARD_WIDTH) / GRID_SIZE),
    z: Math.round((point.z + HALF_BOARD_DEPTH) / GRID_SIZE),
  };
}

function cellToWorld(cell: Cell): Vec2 {
  return {
    x: cell.x * GRID_SIZE - HALF_BOARD_WIDTH,
    z: cell.z * GRID_SIZE - HALF_BOARD_DEPTH,
  };
}

function inBounds(cell: Cell): boolean {
  return cell.x >= 0 && cell.x < COLS && cell.z >= 0 && cell.z < ROWS;
}

function heuristic(a: Cell, b: Cell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

function blockedCells(objects: WorkspaceObject[], agents: WorkspaceAgent[], ignoredAgentId?: string): Set<string> {
  const blocked = new Set<string>();

  for (let x = 0; x < COLS; x += 1) {
    for (let z = 0; z < ROWS; z += 1) {
      const cell = { x, z };
      const point = cellToWorld(cell);
      const objectBlocked = objects.some((object) => pointInsideRect(point, getRect(object, AGENT_RADIUS + 0.1)));
      if (objectBlocked) blocked.add(key(cell));
    }
  }

  for (const agent of agents) {
    if (agent.id === ignoredAgentId) continue;
    const cell = worldToCell(agent.position);
    blocked.add(key(cell));
  }

  return blocked;
}

function reconstruct(cameFrom: Map<string, string>, currentKey: string): Cell[] {
  const cells: Cell[] = [];
  let cursor = currentKey;
  while (cursor) {
    const [x, z] = cursor.split(":").map(Number);
    cells.push({ x: x ?? 0, z: z ?? 0 });
    const next = cameFrom.get(cursor);
    if (!next) break;
    cursor = next;
  }
  return cells.reverse();
}

function smoothPath(points: Vec2[]): Vec2[] {
  if (points.length < 3) return points;
  const smoothed = [points[0]!];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = smoothed[smoothed.length - 1]!;
    const current = points[i]!;
    const next = points[i + 1]!;
    const sameX = Math.abs(prev.x - current.x) < 0.001 && Math.abs(current.x - next.x) < 0.001;
    const sameZ = Math.abs(prev.z - current.z) < 0.001 && Math.abs(current.z - next.z) < 0.001;
    if (!sameX && !sameZ) smoothed.push(current);
  }
  smoothed.push(points[points.length - 1]!);
  return smoothed;
}

export function findPath(
  start: Vec2,
  target: Vec2,
  objects: WorkspaceObject[],
  agents: WorkspaceAgent[],
  ignoredAgentId?: string,
): Vec2[] | null {
  const startCell = worldToCell(snapPoint(start));
  const targetCell = worldToCell(snapPoint(target));
  if (!inBounds(startCell) || !inBounds(targetCell)) return null;

  const blocked = blockedCells(objects, agents, ignoredAgentId);
  blocked.delete(key(startCell));
  blocked.delete(key(targetCell));

  const startKey = key(startCell);
  const targetKey = key(targetCell);
  const open = new Set([startKey]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristic(startCell, targetCell)]]);
  const directions: Cell[] = [
    { x: 1, z: 0 },
    { x: -1, z: 0 },
    { x: 0, z: 1 },
    { x: 0, z: -1 },
  ];

  while (open.size) {
    let currentKey = "";
    let currentScore = Number.POSITIVE_INFINITY;
    for (const candidate of open) {
      const score = fScore.get(candidate) ?? Number.POSITIVE_INFINITY;
      if (score < currentScore) {
        currentKey = candidate;
        currentScore = score;
      }
    }

    if (currentKey === targetKey) {
      const cells = reconstruct(cameFrom, currentKey);
      const points = cells.map(cellToWorld);
      points[points.length - 1] = snapPoint(target);
      return smoothPath(points);
    }

    open.delete(currentKey);
    const [cx, cz] = currentKey.split(":").map(Number);
    const current = { x: cx ?? 0, z: cz ?? 0 };

    for (const direction of directions) {
      const neighbor = { x: current.x + direction.x, z: current.z + direction.z };
      const neighborKey = key(neighbor);
      if (!inBounds(neighbor) || blocked.has(neighborKey)) continue;

      const tentative = (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + 1;
      if (tentative >= (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) continue;

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentative);
      fScore.set(neighborKey, tentative + heuristic(neighbor, targetCell));
      open.add(neighborKey);
    }
  }

  return null;
}
