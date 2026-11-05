/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FurnitureItem, RoomDimensions, WallOpening, ErgonomicIssue } from '../types/bedroom';

export interface RoomMetrics {
  totalArea: number;          // m²
  occupiedArea: number;       // m²
  freeArea: number;           // m²
  occupancyPercentage: number;// %
  isCrowded: boolean;         // > 45% of room is furniture
  issues: ErgonomicIssue[];
}

// Convert item local width/depth with rotation into bounding box in room X/Z
export function getItemBoundingBox(item: FurnitureItem) {
  const rad = (item.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const effW = item.width * cos + item.depth * sin;
  const effD = item.width * sin + item.depth * cos;

  return {
    minX: item.x - effW / 2,
    maxX: item.x + effW / 2,
    minZ: item.z - effD / 2,
    maxZ: item.z + effD / 2,
    effW,
    effD,
  };
}

export function analyzeRoomErgonomics(
  dimensions: RoomDimensions,
  furniture: FurnitureItem[],
  openings: WallOpening[]
): RoomMetrics {
  const totalArea = +(dimensions.width * dimensions.length).toFixed(1);
  const issues: ErgonomicIssue[] = [];

  const halfW = dimensions.width / 2;
  const halfL = dimensions.length / 2;

  let occupiedArea = 0;

  // Evaluate each furniture piece
  furniture.forEach((item) => {
    // Exclude rugs and wall-mounted high items (like TV above 0.8m) from floor area consumption
    const isRug = item.catalogId.includes('rug');
    const isWallMounted = item.y >= 0.8;

    if (!isRug && !isWallMounted) {
      occupiedArea += item.width * item.depth;
    }

    const box = getItemBoundingBox(item);

    // 1. Boundary Check: is item protruding through exterior walls?
    const wallBuffer = 0.02;
    if (
      box.minX < -halfW - wallBuffer ||
      box.maxX > halfW + wallBuffer ||
      box.minZ < -halfL - wallBuffer ||
      box.maxZ > halfL + wallBuffer
    ) {
      issues.push({
        id: `wall-collision-${item.id}`,
        type: 'error',
        title: `${item.name} ultrapassa a parede`,
        description: 'O móvel está ultrapassando o limite físico do quarto. Reposicione-o para dentro do ambiente.',
        itemId: item.id,
      });
    }

    // 2. Door conflict check
    openings.forEach((opening) => {
      if (opening.type === 'door') {
        const doorCheck = checkDoorSwingConflict(opening, dimensions, box);
        if (doorCheck.conflict) {
          issues.push({
            id: `door-conflict-${item.id}-${opening.id}`,
            type: 'error',
            title: `Porta bloqueada por ${item.name}`,
            description: `A abertura da porta requer um raio livre de ${opening.width.toFixed(2)}m. O móvel está impedindo a passagem completa.`,
            itemId: item.id,
          });
        }
      }
    });
  });

  // 3. Furniture vs Furniture Collision (Solid overlapping)
  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      const a = furniture[i];
      const b = furniture[j];

      // Ignore rugs overlapping with beds/tables (very common & intentional)
      const aIsRug = a.catalogId.includes('rug');
      const bIsRug = b.catalogId.includes('rug');
      if (aIsRug || bIsRug) continue;

      // Ignore if one is wall-mounted high and the other is low on floor
      if (Math.abs(a.y - b.y) >= 0.7) continue;

      const boxA = getItemBoundingBox(a);
      const boxB = getItemBoundingBox(b);

      const overlapX = Math.max(0, Math.min(boxA.maxX, boxB.maxX) - Math.max(boxA.minX, boxB.minX));
      const overlapZ = Math.max(0, Math.min(boxA.maxZ, boxB.maxZ) - Math.max(boxA.minZ, boxB.minZ));

      if (overlapX > 0.05 && overlapZ > 0.05) {
        issues.push({
          id: `collision-${a.id}-${b.id}`,
          type: 'error',
          title: `Colisão: ${a.name} e ${b.name}`,
          description: 'Estes dois móveis estão sobrepostos no mesmo espaço do piso.',
          itemId: a.id,
        });
      }
    }
  }

  // 4. Specific Bed Circulation Analysis
  const beds = furniture.filter((f) => f.category === 'beds');
  beds.forEach((bed) => {
    const box = getItemBoundingBox(bed);
    const isDoubleOrQueen = bed.width >= 1.35;

    // Distances to walls
    const distWest = Math.abs(box.minX - (-halfW));
    const distEast = Math.abs(halfW - box.maxX);
    const distNorth = Math.abs(box.minZ - (-halfL));
    const distSouth = Math.abs(halfL - box.maxZ);

    if (isDoubleOrQueen) {
      // Both sides should ideally have at least 0.55m
      const minSidePassage = Math.min(distWest, distEast);
      if (minSidePassage < 0.5) {
        issues.push({
          id: `bed-side-clearance-${bed.id}`,
          type: 'warning',
          title: 'Passagem lateral da cama apertada',
          description: `A passagem ao lado da ${bed.name} tem apenas ${(minSidePassage * 100).toFixed(0)}cm. O padrão ergonômico recomenda no mínimo 60cm para circulação e arrumação dos lençóis.`,
          itemId: bed.id,
        });
      }
    }

    // Distance to foot of bed (assuming head is against north or south)
    const footPassage = Math.min(distNorth, distSouth);
    if (footPassage < 0.55 && footPassage > 0.05) {
      issues.push({
        id: `bed-foot-clearance-${bed.id}`,
        type: 'warning',
        title: 'Passagem aos pés da cama reduzida',
        description: `Há apenas ${(footPassage * 100).toFixed(0)}cm aos pés da cama. Recomendado 60cm a 70cm para circulação sem esbarrões.`,
        itemId: bed.id,
      });
    }
  });

  // 5. Wardrobe door clearance
  const wardrobes = furniture.filter((f) => f.category === 'wardrobes');
  wardrobes.forEach((wardrobe) => {
    const box = getItemBoundingBox(wardrobe);
    // Find closest obstacle in front of the wardrobe
    let frontObstacleDist = 999;
    
    // Depending on rotation, determine what is "in front"
    // At rotation 90 (facing East): front is positive X
    // At rotation 270 (facing West): front is negative X
    // At rotation 0 (facing South): front is positive Z
    // At rotation 180 (facing North): front is negative Z
    const rot = Math.round((wardrobe.rotation % 360) / 90) * 90;
    
    furniture.forEach((other) => {
      if (other.id === wardrobe.id || other.catalogId.includes('rug')) return;
      const otherBox = getItemBoundingBox(other);

      if (rot === 90 && otherBox.minX > box.maxX) {
        // other is to the East
        const overlapZ = Math.min(box.maxZ, otherBox.maxZ) - Math.max(box.minZ, otherBox.minZ);
        if (overlapZ > 0) {
          frontObstacleDist = Math.min(frontObstacleDist, otherBox.minX - box.maxX);
        }
      } else if (rot === 270 && otherBox.maxX < box.minX) {
        // other is to the West
        const overlapZ = Math.min(box.maxZ, otherBox.maxZ) - Math.max(box.minZ, otherBox.minZ);
        if (overlapZ > 0) {
          frontObstacleDist = Math.min(frontObstacleDist, box.minX - otherBox.maxX);
        }
      } else if (rot === 0 && otherBox.minZ > box.maxZ) {
        // other is to the South
        const overlapX = Math.min(box.maxX, otherBox.maxX) - Math.max(box.minX, otherBox.minX);
        if (overlapX > 0) {
          frontObstacleDist = Math.min(frontObstacleDist, otherBox.minZ - box.maxZ);
        }
      }
    });

    if (frontObstacleDist < 0.65) {
      issues.push({
        id: `wardrobe-front-${wardrobe.id}`,
        type: 'warning',
        title: `Abertura do ${wardrobe.name} prejudicada`,
        description: `Existe um obstáculo a ${(frontObstacleDist * 100).toFixed(0)}cm das portas do armário. Recomenda-se no mínimo 75cm para puxar gavetas e provar roupas.`,
        itemId: wardrobe.id,
      });
    }
  });

  const freeArea = Math.max(0, +(totalArea - occupiedArea).toFixed(1));
  const occupancyPercentage = Math.round((occupiedArea / totalArea) * 100) || 0;
  const isCrowded = occupancyPercentage > 45;

  if (isCrowded) {
    issues.push({
      id: 'high-occupancy',
      type: 'info',
      title: 'Taxa de ocupação elevada (> 45%)',
      description: 'O quarto possui muitos móveis em relação à sua área total. Considere peças multifuncionais para aumentar a sensação de amplitude.',
    });
  }

  return {
    totalArea,
    occupiedArea: +occupiedArea.toFixed(1),
    freeArea,
    occupancyPercentage,
    isCrowded,
    issues,
  };
}

function checkDoorSwingConflict(
  opening: WallOpening,
  dimensions: RoomDimensions,
  box: { minX: number; maxX: number; minZ: number; maxZ: number }
): { conflict: boolean } {
  const halfW = dimensions.width / 2;
  const halfL = dimensions.length / 2;
  const radius = opening.width;

  let pivotX = 0;
  let pivotZ = 0;

  if (opening.wall === 'south') {
    pivotX = -halfW + opening.offset;
    pivotZ = halfL;
    // Door swings inwards (into negative Z)
    const inRangeX = box.maxX > pivotX - 0.2 && box.minX < pivotX + radius + 0.2;
    const inRangeZ = box.maxZ > pivotZ - radius - 0.1 && box.minZ < pivotZ;
    return { conflict: inRangeX && inRangeZ };
  } else if (opening.wall === 'north') {
    pivotX = -halfW + opening.offset;
    pivotZ = -halfL;
    const inRangeX = box.maxX > pivotX - 0.2 && box.minX < pivotX + radius + 0.2;
    const inRangeZ = box.maxZ > pivotZ && box.minZ < pivotZ + radius + 0.1;
    return { conflict: inRangeX && inRangeZ };
  } else if (opening.wall === 'west') {
    pivotX = -halfW;
    pivotZ = -halfL + opening.offset;
    const inRangeX = box.maxX > pivotX && box.minX < pivotX + radius + 0.1;
    const inRangeZ = box.maxZ > pivotZ - 0.2 && box.minZ < pivotZ + radius + 0.2;
    return { conflict: inRangeX && inRangeZ };
  } else {
    // East wall
    pivotX = halfW;
    pivotZ = -halfL + opening.offset;
    const inRangeX = box.maxX > pivotX - radius - 0.1 && box.minX < pivotX;
    const inRangeZ = box.maxZ > pivotZ - 0.2 && box.minZ < pivotZ + radius + 0.2;
    return { conflict: inRangeX && inRangeZ };
  }
}
