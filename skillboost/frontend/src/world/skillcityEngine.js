// SkillCity V26 world engine
// This file owns world coordinates, paths, camera math and entity layout.
// CSS is intentionally kept out of these decisions; it only paints the entities.

export const WORLD_BOUNDS = Object.freeze({ minX: 4, maxX: 96, minY: 6, maxY: 94 });

export function clampWorld(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

export function lerpWorld(start, end, amount) {
  return start + ((end - start) * amount);
}

export function easeWorldInOut(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function pointStyle(point = {}, extra = {}) {
  const x = clampWorld(point.x ?? 50, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
  const y = clampWorld(point.y ?? 50, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
  return {
    left: 0,
    top: 0,
    transform: `translate3d(${x}%, ${y}%, 0) translate3d(-50%, -50%, 0)`,
    '--world-x': x,
    '--world-y': y,
    ...extra
  };
}

export function rectStyle(rect = {}) {
  const left = clampWorld(rect.left ?? 0, 0, 100);
  const top = clampWorld(rect.top ?? 0, 0, 100);
  const width = clampWorld(rect.width ?? 22, 8, 48);
  const height = clampWorld(rect.height ?? 20, 8, 42);
  return {
    left: 0,
    top: 0,
    width: `${width}%`,
    height: `${height}%`,
    transform: `translate3d(${left}%, ${top}%, 0)`,
    '--world-x': left,
    '--world-y': top,
    '--world-w': width,
    '--world-h': height
  };
}

export function roadmapEntryPoint(orderedNodes = []) {
  const firstNode = orderedNodes[0];
  if (!firstNode) return { x: 8, y: 82, facing: 1 };
  return {
    x: clampWorld((firstNode.x || 12) - 9, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
    y: clampWorld((firstNode.y || 75) + 4, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
    facing: 1
  };
}

export function buildWorldRoute(orderedNodes = []) {
  if (!orderedNodes.length) return [];
  return [
    roadmapEntryPoint(orderedNodes),
    ...orderedNodes.map((node) => ({
      x: clampWorld(node.x || 50, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
      y: clampWorld(node.y || 50, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
      nodeKey: node.nodeKey
    }))
  ];
}

export function routeSegmentMetrics(points = []) {
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    distances[index] = distances[index - 1] + Math.hypot((next.x || 0) - (previous.x || 0), (next.y || 0) - (previous.y || 0));
  }
  return { distances, total: distances[distances.length - 1] || 0 };
}

export function pointAtRouteDistance(points = [], distance = 0) {
  if (!points.length) return { x: 50, y: 84, facing: 1 };
  if (points.length === 1) return { ...points[0], facing: 1 };
  const { total } = routeSegmentMetrics(points);
  const targetDistance = clampWorld(distance, 0, total);
  let walked = 0;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = Math.hypot((end.x || 0) - (start.x || 0), (end.y || 0) - (start.y || 0));
    if (walked + segmentLength >= targetDistance || index === points.length - 1) {
      const amount = segmentLength ? (targetDistance - walked) / segmentLength : 0;
      const x = lerpWorld(start.x, end.x, Math.min(1, Math.max(0, amount)));
      const y = lerpWorld(start.y, end.y, Math.min(1, Math.max(0, amount)));
      return {
        x: clampWorld(x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
        y: clampWorld(y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
        facing: (end.x - start.x) >= 0 ? 1 : -1
      };
    }
    walked += segmentLength;
  }
  const last = points[points.length - 1];
  const previous = points[points.length - 2] || last;
  return {
    x: clampWorld(last.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
    y: clampWorld(last.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
    facing: (last.x - previous.x) >= 0 ? 1 : -1
  };
}

export function routeDistanceForNode(node, orderedNodes = []) {
  if (!node || !orderedNodes.length) return 0;
  const points = buildWorldRoute(orderedNodes);
  const { distances, total } = routeSegmentMetrics(points);
  const nodeIndex = orderedNodes.findIndex((item) => item.nodeKey === node.nodeKey);
  const routePointIndex = nodeIndex >= 0 ? nodeIndex + 1 : 1;
  const previousDistance = distances[Math.max(0, routePointIndex - 1)] || 0;
  const nodeDistance = distances[routePointIndex] || total;
  const incomingLength = Math.max(0, nodeDistance - previousDistance);
  const stopBeforeNode = Math.min(4.8, Math.max(2.2, incomingLength * 0.18));
  return Math.min(total, Math.max(0, nodeDistance - stopBeforeNode));
}

export function nearestDistanceOnRoute(points = [], point = null) {
  if (!points.length || !point) return 0;
  let bestDistance = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let walked = 0;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = (end.x || 0) - (start.x || 0);
    const dy = (end.y || 0) - (start.y || 0);
    const segmentLengthSquared = (dx * dx) + (dy * dy);
    const amount = segmentLengthSquared
      ? Math.min(1, Math.max(0, (((point.x || 0) - (start.x || 0)) * dx + ((point.y || 0) - (start.y || 0)) * dy) / segmentLengthSquared))
      : 0;
    const projected = { x: (start.x || 0) + (dx * amount), y: (start.y || 0) + (dy * amount) };
    const score = Math.hypot((point.x || 0) - projected.x, (point.y || 0) - projected.y);
    const segmentLength = Math.sqrt(segmentLengthSquared);
    if (score < bestScore) {
      bestScore = score;
      bestDistance = walked + (segmentLength * amount);
    }
    walked += segmentLength;
  }
  return bestDistance;
}

export function nodeLayoutMeta(node) {
  const x = clampWorld(node?.x || 50, 10, 90);
  const y = clampWorld(node?.y || 50, 16, 84);
  const edgeLeft = x <= 18;
  const edgeRight = x >= 82;
  const edgeTop = y <= 23;
  const edgeBottom = y >= 77;
  const labelClassName = [edgeLeft ? 'edge-left' : '', edgeRight ? 'edge-right' : '', edgeTop ? 'edge-top' : '', edgeBottom ? 'edge-bottom' : ''].filter(Boolean).join(' ');
  return { x, y, labelClassName, style: pointStyle({ x, y }) };
}

export function landmarkLayoutMeta(landmark) {
  const x = clampWorld(landmark?.x || 50, 13, 87);
  const y = clampWorld(landmark?.y || 50, 24, 77);
  const size = clampWorld((landmark?.size || 112) * 1.12, 110, 128);
  const edgeLeft = x <= 20;
  const edgeRight = x >= 80;
  const edgeTop = y <= 30;
  const copyClassName = [edgeLeft ? 'edge-left' : '', edgeRight ? 'edge-right' : '', edgeTop ? 'edge-top' : ''].filter(Boolean).join(' ');
  return { x, y, size, copyClassName, style: pointStyle({ x, y }, { '--landmark-size': `${size}px` }) };
}

export function calloutStyleForNode(node = {}) {
  const x = clampWorld(node.x || 50, 8, 92);
  const y = clampWorld((node.y || 50) - 13, 7, 90);
  return pointStyle({ x, y });
}

export function avatarStyleForPoint(point = {}) {
  return pointStyle(point, { '--avatar-facing': point.facing || 1 });
}

export function pointsToSvg(points = []) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function cameraForPoint(point = {}, mode = 'city') {
  const zoom = mode === 'focus' ? 1.08 : 1;
  return {
    '--world-camera-x': clampWorld(point.x ?? 50, 0, 100),
    '--world-camera-y': clampWorld(point.y ?? 50, 0, 100),
    '--world-camera-zoom': zoom
  };
}
