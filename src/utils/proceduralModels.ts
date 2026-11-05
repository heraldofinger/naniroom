/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FurnitureItem } from '../types/bedroom';
import { createProceduralRugTexture, createWallArtTexture } from './proceduralTextures';

// Shared materials and geometries caching
const matCache = new Map<string, THREE.Material>();

function getStandardMat(color: string, roughness = 0.6, metalness = 0.05): THREE.MeshStandardMaterial {
  const key = `${color}-${roughness}-${metalness}`;
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness,
        metalness,
      })
    );
  }
  return matCache.get(key) as THREE.MeshStandardMaterial;
}

export function build3DFurniture(item: FurnitureItem): THREE.Group {
  const root = new THREE.Group();
  root.name = `furniture-${item.id}`;
  root.userData = { id: item.id };

  const { width: w, depth: d, height: h, color, secondaryColor = '#D4AF37' } = item;

  switch (item.category) {
    case 'beds':
      buildBedModel(root, w, d, h, color, secondaryColor, item.catalogId === 'bed-japandi');
      break;

    case 'wardrobes':
      buildWardrobeModel(root, w, d, h, color, secondaryColor);
      break;

    case 'desks':
      buildDeskModel(root, w, d, h, color, secondaryColor, item.catalogId === 'desk-vanity');
      break;

    case 'nightstands':
      buildNightstandModel(root, w, d, h, color, secondaryColor, item.catalogId === 'nightstand-round');
      break;

    case 'seating':
      if (item.catalogId === 'chair-office') {
        buildOfficeChairModel(root, w, d, h, color);
      } else if (item.catalogId === 'bench-endbed') {
        buildBenchModel(root, w, d, h, color, secondaryColor);
      } else {
        buildArmchairModel(root, w, d, h, color, secondaryColor);
      }
      break;

    case 'storage':
      if (item.catalogId === 'bookshelf-tall') {
        buildBookshelfModel(root, w, d, h, color, secondaryColor);
      } else {
        buildDresserModel(root, w, d, h, color, secondaryColor);
      }
      break;

    case 'decor':
      if (item.catalogId.includes('rug')) {
        buildRugModel(root, w, d, color, secondaryColor);
      } else if (item.catalogId === 'plant-monstera') {
        buildPlantModel(root, w, d, h, color, secondaryColor);
      } else if (item.catalogId === 'mirror-full') {
        buildMirrorModel(root, w, d, h, color, secondaryColor);
      } else if (item.catalogId === 'tv-wall') {
        buildTvModel(root, w, d, h, color, secondaryColor);
      } else if (item.catalogId === 'wall-art') {
        buildWallArtModel(root, w, d, h, color, secondaryColor);
      } else {
        buildGenericBox(root, w, d, h, color);
      }
      break;

    case 'lighting':
      if (item.catalogId === 'lamp-floor') {
        buildFloorLampModel(root, w, d, h, color, secondaryColor);
      } else {
        buildTableLampModel(root, w, d, h, color, secondaryColor);
      }
      break;

    default:
      buildGenericBox(root, w, d, h, color);
      break;
  }

  // Position and rotate the group (pivot is bottom center)
  root.position.set(item.x, item.y, item.z);
  root.rotation.y = THREE.MathUtils.degToRad(item.rotation);

  return root;
}

// --------------------------------------------------------------------------------
// 1. BED PROCEDURAL MODEL (Plinth, frame, mattress, headboard, duvet, pillows)
// --------------------------------------------------------------------------------
function buildBedModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  frameColor: string,
  beddingColor: string,
  isJapandi = false
) {
  const frameMat = getStandardMat(frameColor, 0.65, 0.05);
  const mattressMat = getStandardMat('#FAFAFA', 0.9, 0.0);
  const duvetMat = getStandardMat(beddingColor, 0.85, 0.0);
  const pillowMat = getStandardMat('#FFFFFF', 0.95, 0.0);
  const woodAccentMat = getStandardMat('#6E472D', 0.5, 0.05);

  const legH = isJapandi ? 0.05 : 0.12;
  const frameH = isJapandi ? 0.15 : 0.22;
  const mattressH = 0.24;
  const headboardH = h - (legH + frameH);
  const headboardThick = 0.1;

  // 1. Legs (4 corner feet)
  const legGeo = new THREE.CylinderGeometry(0.025, 0.02, legH, 12);
  const legOffsets = [
    [-w * 0.45, -d * 0.45],
    [w * 0.45, -d * 0.45],
    [-w * 0.45, d * 0.45],
    [w * 0.45, d * 0.45],
  ];
  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, woodAccentMat);
    leg.position.set(lx, legH / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // 2. Bed Base Frame
  const baseW = isJapandi ? w + 0.15 : w;
  const baseD = isJapandi ? d + 0.1 : d;
  const frameGeo = new THREE.BoxGeometry(baseW, frameH, baseD);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, legH + frameH / 2, 0);
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  // 3. Mattress
  const matGeo = new THREE.BoxGeometry(w - 0.06, mattressH, d - headboardThick - 0.05);
  const mattress = new THREE.Mesh(matGeo, mattressMat);
  const matY = legH + frameH + mattressH / 2;
  mattress.position.set(0, matY, (headboardThick + 0.05) / 2);
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  group.add(mattress);

  // 4. Headboard
  const hbGeo = new THREE.BoxGeometry(baseW, headboardH, headboardThick);
  const headboard = new THREE.Mesh(hbGeo, frameMat);
  const hbY = legH + frameH + headboardH / 2;
  headboard.position.set(0, hbY, -d / 2 + headboardThick / 2);
  headboard.castShadow = true;
  group.add(headboard);

  // Headboard tufting lines / detail
  const tuftMat = getStandardMat(frameColor, 0.8, 0.05);
  const tuftGeo = new THREE.BoxGeometry(baseW - 0.1, headboardH - 0.1, 0.02);
  const tuft = new THREE.Mesh(tuftGeo, tuftMat);
  tuft.position.set(0, hbY, -d / 2 + headboardThick + 0.01);
  group.add(tuft);

  // 5. Folded Duvet / Comforter
  const duvetL = (d - headboardThick) * 0.65;
  const duvetGeo = new THREE.BoxGeometry(w - 0.02, mattressH * 0.85, duvetL);
  const duvet = new THREE.Mesh(duvetGeo, duvetMat);
  duvet.position.set(0, matY + 0.02, d / 2 - duvetL / 2);
  duvet.castShadow = true;
  duvet.receiveShadow = true;
  group.add(duvet);

  // Duvet turnover accent strip
  const foldGeo = new THREE.BoxGeometry(w - 0.04, 0.03, 0.2);
  const fold = new THREE.Mesh(foldGeo, mattressMat);
  fold.position.set(0, matY + mattressH / 2 + 0.02, d / 2 - duvetL);
  group.add(fold);

  // 6. Pillows
  const pillowW = w > 1.2 ? (w - 0.2) / 2 : w - 0.2;
  const pillowD = 0.42;
  const pillowH = 0.12;
  const pillowGeo = new THREE.BoxGeometry(pillowW - 0.04, pillowH, pillowD);

  const pY = matY + mattressH / 2 + pillowH / 2;
  const pZ = -d / 2 + headboardThick + pillowD / 2 + 0.05;

  if (w > 1.2) {
    // 2 sleeping pillows
    const pLeft = new THREE.Mesh(pillowGeo, pillowMat);
    pLeft.position.set(-pillowW / 2 - 0.02, pY, pZ);
    pLeft.rotation.x = -0.15;
    pLeft.castShadow = true;
    group.add(pLeft);

    const pRight = new THREE.Mesh(pillowGeo, pillowMat);
    pRight.position.set(pillowW / 2 + 0.02, pY, pZ);
    pRight.rotation.x = -0.15;
    pRight.castShadow = true;
    group.add(pRight);

    // Accent throw cushion in center
    const accentCushionGeo = new THREE.BoxGeometry(0.4, 0.25, 0.12);
    const accentCushion = new THREE.Mesh(accentCushionGeo, duvetMat);
    accentCushion.position.set(0, pY + 0.03, pZ + 0.2);
    accentCushion.rotation.x = -0.25;
    group.add(accentCushion);
  } else {
    const pSingle = new THREE.Mesh(pillowGeo, pillowMat);
    pSingle.position.set(0, pY, pZ);
    pSingle.rotation.x = -0.15;
    pSingle.castShadow = true;
    group.add(pSingle);
  }
}

// --------------------------------------------------------------------------------
// 2. WARDROBE PROCEDURAL MODEL
// --------------------------------------------------------------------------------
function buildWardrobeModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  accentColor: string
) {
  const bodyMat = getStandardMat(color, 0.6, 0.05);
  const handleMat = getStandardMat('#1A1A1A', 0.2, 0.9);
  const plinthMat = getStandardMat(accentColor, 0.5, 0.05);

  const plinthH = 0.08;
  const crownH = 0.04;
  const bodyH = h - plinthH - crownH;

  // Plinth base
  const plinthGeo = new THREE.BoxGeometry(w - 0.04, plinthH, d - 0.04);
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.set(0, plinthH / 2, 0);
  group.add(plinth);

  // Main cabinet carcass
  const bodyGeo = new THREE.BoxGeometry(w, bodyH, d);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, plinthH + bodyH / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top crown
  const crownGeo = new THREE.BoxGeometry(w + 0.02, crownH, d + 0.02);
  const crown = new THREE.Mesh(crownGeo, bodyMat);
  crown.position.set(0, h - crownH / 2, 0);
  group.add(crown);

  // Sliding door division seams & handles
  const numDoors = w >= 2.0 ? 3 : 2;
  const doorW = w / numDoors;
  const handleGeo = new THREE.BoxGeometry(0.02, bodyH * 0.45, 0.03);

  for (let i = 0; i < numDoors; i++) {
    const doorCenter = -w / 2 + doorW * (i + 0.5);

    // Subtle door bevel panel
    const panelGeo = new THREE.BoxGeometry(doorW - 0.02, bodyH - 0.04, 0.015);
    const panel = new THREE.Mesh(panelGeo, bodyMat);
    panel.position.set(doorCenter, plinthH + bodyH / 2, d / 2 + 0.008);
    group.add(panel);

    // Slim handle on each door
    const handle = new THREE.Mesh(handleGeo, handleMat);
    const handleX = doorCenter + (i % 2 === 0 ? doorW * 0.35 : -doorW * 0.35);
    handle.position.set(handleX, plinthH + bodyH / 2, d / 2 + 0.025);
    handle.castShadow = true;
    group.add(handle);
  }
}

// --------------------------------------------------------------------------------
// 3. WORK DESK & VANITY MODEL
// --------------------------------------------------------------------------------
function buildDeskModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  topColor: string,
  legColor: string,
  isVanity = false
) {
  const topMat = getStandardMat(topColor, 0.5, 0.05);
  const legMat = getStandardMat(legColor, 0.3, 0.7);
  const blackMat = getStandardMat('#111827', 0.2, 0.8);
  const glassMat = getStandardMat('#E0F2FE', 0.1, 0.95);

  const topThick = 0.04;
  const legThick = 0.04;

  // 1. Table Top
  const topGeo = new THREE.BoxGeometry(w, topThick, d);
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, h - topThick / 2, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // 2. Legs (Square metal or wood legs)
  const legH = h - topThick;
  const legGeo = new THREE.BoxGeometry(legThick, legH, legThick);
  const legOffsets = [
    [-w / 2 + legThick, -d / 2 + legThick],
    [w / 2 - legThick, -d / 2 + legThick],
    [-w / 2 + legThick, d / 2 - legThick],
    [w / 2 - legThick, d / 2 - legThick],
  ];
  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, legH / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // 3. Support stretchers/rails
  const railGeo = new THREE.BoxGeometry(w - legThick * 2, 0.03, legThick);
  const backRail = new THREE.Mesh(railGeo, legMat);
  backRail.position.set(0, h - topThick - 0.05, -d / 2 + legThick);
  group.add(backRail);

  if (isVanity) {
    // Round Vanity Mirror mounted on desk
    const mirrorRadius = 0.28;
    const mirrorGeo = new THREE.CylinderGeometry(mirrorRadius, mirrorRadius, 0.02, 32);
    const mirror = new THREE.Mesh(mirrorGeo, glassMat);
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(0, h + mirrorRadius + 0.08, -d / 2 + 0.06);
    mirror.castShadow = true;
    group.add(mirror);

    // Mirror metal frame ring
    const ringGeo = new THREE.TorusGeometry(mirrorRadius, 0.015, 12, 36);
    const ring = new THREE.Mesh(ringGeo, legMat);
    ring.position.set(0, h + mirrorRadius + 0.08, -d / 2 + 0.06);
    group.add(ring);
  } else {
    // Open Laptop on desk
    const laptopBaseGeo = new THREE.BoxGeometry(0.32, 0.01, 0.22);
    const laptopBase = new THREE.Mesh(laptopBaseGeo, blackMat);
    laptopBase.position.set(0, h + 0.005, 0.02);
    group.add(laptopBase);

    const laptopScreenGeo = new THREE.BoxGeometry(0.32, 0.2, 0.01);
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, blackMat);
    laptopScreen.position.set(0, h + 0.1, -0.09);
    laptopScreen.rotation.x = -0.25;
    group.add(laptopScreen);

    // Pen holder cup
    const cupGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.1, 16);
    const cup = new THREE.Mesh(cupGeo, legMat);
    cup.position.set(w * 0.35, h + 0.05, -d * 0.25);
    group.add(cup);
  }
}

// --------------------------------------------------------------------------------
// 4. NIGHTSTAND MODEL
// --------------------------------------------------------------------------------
function buildNightstandModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  accentColor: string,
  isRound = false
) {
  const bodyMat = getStandardMat(color, 0.6, 0.05);
  const handleMat = getStandardMat('#D4AF37', 0.2, 0.9);
  const legMat = getStandardMat(accentColor, 0.4, 0.1);

  const legH = h * 0.35;
  const bodyH = h - legH;

  if (isRound) {
    const radius = w / 2;
    // Round table top
    const topGeo = new THREE.CylinderGeometry(radius, radius, 0.03, 32);
    const top = new THREE.Mesh(topGeo, bodyMat);
    top.position.set(0, h - 0.015, 0);
    top.castShadow = true;
    group.add(top);

    // 3 Tapered dowel legs
    const roundLegGeo = new THREE.CylinderGeometry(0.015, 0.01, h - 0.03, 12);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(roundLegGeo, legMat);
      leg.position.set(Math.cos(angle) * (radius * 0.65), (h - 0.03) / 2, Math.sin(angle) * (radius * 0.65));
      leg.rotation.z = Math.cos(angle) * 0.08;
      leg.rotation.x = Math.sin(angle) * 0.08;
      leg.castShadow = true;
      group.add(leg);
    }
  } else {
    // Rectangular 2-drawer nightstand
    // 4 legs
    const legGeo = new THREE.CylinderGeometry(0.02, 0.015, legH, 12);
    const legOffsets = [
      [-w * 0.4, -d * 0.4],
      [w * 0.4, -d * 0.4],
      [-w * 0.4, d * 0.4],
      [w * 0.4, d * 0.4],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, legH / 2, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Cabinet body
    const bodyGeo = new THREE.BoxGeometry(w, bodyH, d);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, legH + bodyH / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 2 Drawer Fronts
    const drawerH = (bodyH - 0.04) / 2;
    for (let i = 0; i < 2; i++) {
      const dy = legH + 0.02 + drawerH * (i + 0.5);
      const knobGeo = new THREE.SphereGeometry(0.015, 12, 12);
      const knob = new THREE.Mesh(knobGeo, handleMat);
      knob.position.set(0, dy, d / 2 + 0.018);
      group.add(knob);
    }
  }
}

// --------------------------------------------------------------------------------
// 5. ERGONOMIC OFFICE CHAIR MODEL
// --------------------------------------------------------------------------------
function buildOfficeChairModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string
) {
  const fabricMat = getStandardMat(color, 0.85, 0.0);
  const metalMat = getStandardMat('#262626', 0.25, 0.8);

  // 1. 5-point caster base
  const starGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
  const centerHub = new THREE.Mesh(starGeo, metalMat);
  centerHub.position.set(0, 0.1, 0);
  group.add(centerHub);

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const armGeo = new THREE.BoxGeometry(0.24, 0.02, 0.03);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(Math.cos(angle) * 0.13, 0.08, Math.sin(angle) * 0.13);
    arm.rotation.y = -angle;
    group.add(arm);

    // Wheel
    const wheelGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const wheel = new THREE.Mesh(wheelGeo, metalMat);
    wheel.position.set(Math.cos(angle) * 0.24, 0.035, Math.sin(angle) * 0.24);
    group.add(wheel);
  }

  // 2. Hydraulic column
  const pistonGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 16);
  const piston = new THREE.Mesh(pistonGeo, metalMat);
  piston.position.set(0, 0.26, 0);
  group.add(piston);

  // 3. Padded seat cushion
  const seatGeo = new THREE.BoxGeometry(0.48, 0.08, 0.46);
  const seat = new THREE.Mesh(seatGeo, fabricMat);
  seat.position.set(0, 0.45, 0);
  seat.castShadow = true;
  group.add(seat);

  // 4. Ergonomic curved backrest
  const backGeo = new THREE.BoxGeometry(0.44, 0.45, 0.06);
  const back = new THREE.Mesh(backGeo, fabricMat);
  back.position.set(0, 0.72, -0.2);
  back.rotation.x = -0.1;
  back.castShadow = true;
  group.add(back);

  // 5. Armrests
  [-0.24, 0.24].forEach((ax) => {
    const armRestGeo = new THREE.BoxGeometry(0.06, 0.02, 0.24);
    const armRest = new THREE.Mesh(armRestGeo, metalMat);
    armRest.position.set(ax, 0.62, 0);
    group.add(armRest);

    const postGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8);
    const post = new THREE.Mesh(postGeo, metalMat);
    post.position.set(ax, 0.52, 0);
    group.add(post);
  });
}

// --------------------------------------------------------------------------------
// 6. READING ARMCHAIR MODEL
// --------------------------------------------------------------------------------
function buildArmchairModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  accentColor: string
) {
  const fabricMat = getStandardMat(color, 0.85, 0.0);
  const legMat = getStandardMat(accentColor, 0.4, 0.1);

  const legH = 0.2;
  const seatH = 0.22;
  const backH = h - (legH + seatH);

  // 4 angled legs
  const legGeo = new THREE.CylinderGeometry(0.025, 0.018, legH, 12);
  const legOffsets = [
    [-w * 0.38, -d * 0.38, 0.15, -0.15],
    [w * 0.38, -d * 0.38, -0.15, -0.15],
    [-w * 0.38, d * 0.38, 0.15, 0.15],
    [w * 0.38, d * 0.38, -0.15, 0.15],
  ];
  legOffsets.forEach(([lx, lz, rx, rz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, legH / 2, lz);
    leg.rotation.z = rz;
    leg.rotation.x = rx;
    leg.castShadow = true;
    group.add(leg);
  });

  // Seat cushion base
  const seatGeo = new THREE.BoxGeometry(w, seatH, d);
  const seat = new THREE.Mesh(seatGeo, fabricMat);
  seat.position.set(0, legH + seatH / 2, 0);
  seat.castShadow = true;
  group.add(seat);

  // Reclined backrest
  const backGeo = new THREE.BoxGeometry(w, backH, 0.14);
  const back = new THREE.Mesh(backGeo, fabricMat);
  back.position.set(0, legH + seatH + backH / 2, -d / 2 + 0.1);
  back.rotation.x = -0.18;
  back.castShadow = true;
  group.add(back);

  // Left & Right Armrests
  const armW = 0.12;
  const armH = backH * 0.55;
  const armGeo = new THREE.BoxGeometry(armW, armH, d - 0.1);
  [-w / 2 + armW / 2, w / 2 - armW / 2].forEach((ax) => {
    const arm = new THREE.Mesh(armGeo, fabricMat);
    arm.position.set(ax, legH + seatH + armH / 2, 0);
    arm.castShadow = true;
    group.add(arm);
  });
}

// --------------------------------------------------------------------------------
// 7. BENCH MODEL
// --------------------------------------------------------------------------------
function buildBenchModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  accentColor: string
) {
  const cushionMat = getStandardMat(color, 0.9, 0.0);
  const woodMat = getStandardMat(accentColor, 0.5, 0.05);

  const legH = h * 0.6;
  const cushionH = h - legH;

  // 4 Legs & Frame
  const legGeo = new THREE.BoxGeometry(0.04, legH, 0.04);
  const offsets = [
    [-w / 2 + 0.06, -d / 2 + 0.06],
    [w / 2 - 0.06, -d / 2 + 0.06],
    [-w / 2 + 0.06, d / 2 - 0.06],
    [w / 2 - 0.06, d / 2 - 0.06],
  ];
  offsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(lx, legH / 2, lz);
    group.add(leg);
  });

  // Stretcher frame
  const frameGeo = new THREE.BoxGeometry(w - 0.08, 0.03, d - 0.08);
  const frame = new THREE.Mesh(frameGeo, woodMat);
  frame.position.set(0, legH - 0.015, 0);
  group.add(frame);

  // Top cushion
  const cushionGeo = new THREE.BoxGeometry(w, cushionH, d);
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.set(0, legH + cushionH / 2, 0);
  cushion.castShadow = true;
  group.add(cushion);
}

// --------------------------------------------------------------------------------
// 8. DRESSER & BOOKSHELF
// --------------------------------------------------------------------------------
function buildDresserModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  accentColor: string
) {
  const bodyMat = getStandardMat(color, 0.6, 0.05);
  const handleMat = getStandardMat(accentColor, 0.3, 0.6);

  const legH = 0.12;
  const bodyH = h - legH;

  // 4 Tapered legs
  const legGeo = new THREE.CylinderGeometry(0.025, 0.015, legH, 12);
  const offsets = [
    [-w * 0.42, -d * 0.4],
    [w * 0.42, -d * 0.4],
    [-w * 0.42, d * 0.4],
    [w * 0.42, d * 0.4],
  ];
  offsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, handleMat);
    leg.position.set(lx, legH / 2, lz);
    group.add(leg);
  });

  // Dresser body
  const bodyGeo = new THREE.BoxGeometry(w, bodyH, d);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, legH + bodyH / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 4 horizontal drawers with modern bar pulls
  const drawerH = (bodyH - 0.06) / 4;
  for (let i = 0; i < 4; i++) {
    const dy = legH + 0.03 + drawerH * (i + 0.5);

    // Pull bar
    const barGeo = new THREE.BoxGeometry(0.18, 0.015, 0.02);
    const bar = new THREE.Mesh(barGeo, handleMat);
    bar.position.set(0, dy, d / 2 + 0.015);
    group.add(bar);
  }
}

function buildBookshelfModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  accentColor: string
) {
  const frameMat = getStandardMat(color, 0.6, 0.05);
  const shelfMat = getStandardMat(accentColor, 0.4, 0.1);

  // Outer frame
  const sideThick = 0.03;
  const sideGeo = new THREE.BoxGeometry(sideThick, h, d);

  [-w / 2 + sideThick / 2, w / 2 - sideThick / 2].forEach((sx) => {
    const side = new THREE.Mesh(sideGeo, frameMat);
    side.position.set(sx, h / 2, 0);
    side.castShadow = true;
    group.add(side);
  });

  // Top & bottom caps
  const capGeo = new THREE.BoxGeometry(w, sideThick, d);
  const botCap = new THREE.Mesh(capGeo, frameMat);
  botCap.position.set(0, sideThick / 2, 0);
  group.add(botCap);

  const topCap = new THREE.Mesh(capGeo, frameMat);
  topCap.position.set(0, h - sideThick / 2, 0);
  group.add(topCap);

  // 4 Shelves
  const shelfCount = 4;
  const innerH = h - sideThick * 2;
  const shelfGeo = new THREE.BoxGeometry(w - sideThick * 2, 0.02, d - 0.02);

  for (let i = 1; i <= shelfCount; i++) {
    const sy = (innerH / (shelfCount + 1)) * i;
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, sy, 0);
    group.add(shelf);
  }
}

// --------------------------------------------------------------------------------
// 9. RUG MODEL (Zero Z-fighting with floor)
// --------------------------------------------------------------------------------
function buildRugModel(
  group: THREE.Group,
  w: number,
  d: number,
  color: string,
  secondaryColor: string
) {
  const rugTexture = createProceduralRugTexture(color, secondaryColor);
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTexture,
    roughness: 0.95,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const rugGeo = new THREE.BoxGeometry(w, 0.01, d);
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.position.set(0, 0.006, 0);
  rug.receiveShadow = true;
  group.add(rug);
}

// --------------------------------------------------------------------------------
// 10. PLANT MODEL
// --------------------------------------------------------------------------------
function buildPlantModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  leafColor: string,
  potColor: string
) {
  const potMat = getStandardMat(potColor, 0.5, 0.05);
  const soilMat = getStandardMat('#2B1D14', 0.9, 0.0);
  const leafMat = getStandardMat(leafColor, 0.65, 0.0);

  const potH = h * 0.4;
  const potR = w * 0.45;

  // Ceramic pot
  const potGeo = new THREE.CylinderGeometry(potR, potR * 0.75, potH, 20);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.set(0, potH / 2, 0);
  pot.castShadow = true;
  group.add(pot);

  // Soil disc
  const soilGeo = new THREE.CylinderGeometry(potR * 0.95, potR * 0.95, 0.02, 16);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.set(0, potH - 0.01, 0);
  group.add(soil);

  // 6 Monstera / Fiddle Leaf stalks and leaves
  const leafCount = 6;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i * Math.PI * 2) / leafCount;
    const stemH = (h - potH) * (0.6 + (i % 3) * 0.2);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.01, 0.012, stemH, 8);
    const stem = new THREE.Mesh(stemGeo, leafMat);
    stem.position.set(
      Math.cos(angle) * (potR * 0.4),
      potH + stemH / 2,
      Math.sin(angle) * (potR * 0.4)
    );
    stem.rotation.z = Math.cos(angle) * 0.35;
    stem.rotation.x = Math.sin(angle) * 0.35;
    group.add(stem);

    // Broad leaf plane
    const leafGeo = new THREE.SphereGeometry(0.18, 8, 8);
    leafGeo.scale(1, 0.1, 1.4);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(
      Math.cos(angle) * (potR * 0.8),
      potH + stemH,
      Math.sin(angle) * (potR * 0.8)
    );
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.4;
    leaf.castShadow = true;
    group.add(leaf);
  }
}

// --------------------------------------------------------------------------------
// 11. MIRROR MODEL
// --------------------------------------------------------------------------------
function buildMirrorModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  frameColor: string,
  glassColor: string
) {
  const frameMat = getStandardMat(frameColor, 0.4, 0.1);
  const mirrorMat = getStandardMat(glassColor, 0.05, 0.95);

  const frameThick = 0.04;

  // Frame
  const frameGeo = new THREE.BoxGeometry(w, h, d);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, h / 2, 0);
  frame.castShadow = true;
  group.add(frame);

  // Glass mirror pane
  const glassGeo = new THREE.BoxGeometry(w - frameThick * 2, h - frameThick * 2, 0.01);
  const glass = new THREE.Mesh(glassGeo, mirrorMat);
  glass.position.set(0, h / 2, d / 2 + 0.005);
  group.add(glass);
}

// --------------------------------------------------------------------------------
// 12. WALL TV & SOUNDBAR
// --------------------------------------------------------------------------------
function buildTvModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  tvColor: string,
  panelColor: string
) {
  const panelMat = getStandardMat(panelColor, 0.5, 0.05);
  const tvBezelMat = getStandardMat('#111111', 0.2, 0.8);
  const tvScreenMat = getStandardMat('#050505', 0.1, 0.9);

  // Decorative wall back panel
  const panelW = w + 0.3;
  const panelH = h + 0.3;
  const panelGeo = new THREE.BoxGeometry(panelW, panelH, 0.03);
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, h / 2, -0.02);
  group.add(panel);

  // TV Outer frame
  const tvGeo = new THREE.BoxGeometry(w, h, 0.04);
  const tv = new THREE.Mesh(tvGeo, tvBezelMat);
  tv.position.set(0, h / 2, 0.02);
  group.add(tv);

  // TV Screen
  const screenGeo = new THREE.BoxGeometry(w - 0.04, h - 0.04, 0.005);
  const screen = new THREE.Mesh(screenGeo, tvScreenMat);
  screen.position.set(0, h / 2, 0.042);
  group.add(screen);

  // Soundbar below TV
  const sbGeo = new THREE.BoxGeometry(w * 0.75, 0.08, 0.08);
  const sb = new THREE.Mesh(sbGeo, tvBezelMat);
  sb.position.set(0, -0.06, 0.03);
  group.add(sb);
}

// --------------------------------------------------------------------------------
// 13. WALL ART
// --------------------------------------------------------------------------------
function buildWallArtModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  secondaryColor: string
) {
  const frameMat = getStandardMat('#2B2B2B', 0.4, 0.2);
  const artTexture = createWallArtTexture(color, secondaryColor);
  const canvasMat = new THREE.MeshStandardMaterial({
    map: artTexture,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Outer frame
  const frameGeo = new THREE.BoxGeometry(w, h, d);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, h / 2, 0);
  group.add(frame);

  // Canvas plane
  const canvasGeo = new THREE.BoxGeometry(w - 0.05, h - 0.05, 0.01);
  const canvas = new THREE.Mesh(canvasGeo, canvasMat);
  canvas.position.set(0, h / 2, d / 2 + 0.005);
  group.add(canvas);
}

// --------------------------------------------------------------------------------
// 14. LAMPS (Floor Lamp & Table Lamp with Warm Glow)
// --------------------------------------------------------------------------------
function buildFloorLampModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  color: string,
  shadeColor: string
) {
  const metalMat = getStandardMat(color, 0.3, 0.8);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shadeColor),
    emissive: new THREE.Color('#FFF5E1'),
    emissiveIntensity: 0.4,
    roughness: 0.8,
  });

  // Base plate
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24);
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.position.set(0, 0.015, 0);
  base.castShadow = true;
  group.add(base);

  // Slender curved pole
  const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, h - 0.3, 12);
  const pole = new THREE.Mesh(poleGeo, metalMat);
  pole.position.set(0, (h - 0.3) / 2 + 0.03, 0);
  pole.castShadow = true;
  group.add(pole);

  // Conical Lamp shade
  const shadeGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.3, 24, 1, true);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.set(0, h - 0.15, 0);
  shade.castShadow = true;
  group.add(shade);

  // Soft warm point light
  const lampLight = new THREE.PointLight('#FFF1D0', 0.6, 3.5);
  lampLight.position.set(0, h - 0.2, 0);
  group.add(lampLight);
}

function buildTableLampModel(
  group: THREE.Group,
  w: number,
  d: number,
  h: number,
  baseColor: string,
  shadeColor: string
) {
  const baseMat = getStandardMat(baseColor, 0.6, 0.1);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shadeColor),
    emissive: new THREE.Color('#FFF3D4'),
    emissiveIntensity: 0.5,
    roughness: 0.85,
  });

  const baseH = h * 0.45;
  const shadeH = h - baseH;

  // Ceramic base
  const baseGeo = new THREE.CylinderGeometry(w * 0.25, w * 0.4, baseH, 16);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, baseH / 2, 0);
  group.add(base);

  // Drum shade
  const shadeGeo = new THREE.CylinderGeometry(w * 0.45, w * 0.48, shadeH, 20);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.set(0, baseH + shadeH / 2, 0);
  group.add(shade);

  // Warm micro light
  const light = new THREE.PointLight('#FFE6A3', 0.4, 2.0);
  light.position.set(0, baseH + shadeH / 2, 0);
  group.add(light);
}

function buildGenericBox(group: THREE.Group, w: number, d: number, h: number, color: string) {
  const mat = getStandardMat(color, 0.5, 0.1);
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, h / 2, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}
