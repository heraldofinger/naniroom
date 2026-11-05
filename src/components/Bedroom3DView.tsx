/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Sun, 
  Moon, 
  Camera, 
  Layers, 
  Rotate3d, 
  Compass, 
  Download 
} from 'lucide-react';
import { 
  FurnitureItem, 
  RoomDimensions, 
  RoomFinishes, 
  WallOpening 
} from '../types/bedroom';
import { getProceduralFloorTexture } from '../utils/proceduralTextures';
import { build3DFurniture } from '../utils/proceduralModels';

interface Bedroom3DViewProps {
  dimensions: RoomDimensions;
  finishes: RoomFinishes;
  openings: WallOpening[];
  furniture: FurnitureItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateFurniture: (updated: FurnitureItem[]) => void;
}

export const Bedroom3DView: React.FC<Bedroom3DViewProps> = ({
  dimensions,
  finishes,
  openings,
  furniture,
  selectedItemId,
  onSelectItem,
  onUpdateFurniture,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // 3D Visual Modes
  const [isNightMode, setIsNightMode] = useState(false);
  const [wallCutaway, setWallCutaway] = useState<'cutaway' | 'full' | 'floor-only'>('cutaway');
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'top' | 'eye-level'>('isometric');

  // Detect software WebGL as mandated by the Three.js skill
  const isSoftwareGl = useRef(
    (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })()
  ).current;

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? '#0F172A' : '#F1F5F9');
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(dimensions.width * 1.3, dimensions.height * 1.4, dimensions.length * 1.4);
    cameraRef.current = camera;

    // 3. Renderer with PBR color management
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Studio Environment Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    controls.minDistance = 1.5;
    controls.maxDistance = 25;
    controls.target.set(0, dimensions.height * 0.35, 0);
    controlsRef.current = controls;

    // 6. Lighting
    const hemiLight = new THREE.HemisphereLight(0xF8FAFC, 0x94A3B8, 0.7);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xFFF7ED, 1.4);
    sunLight.position.set(dimensions.width * 1.5, dimensions.height * 2.2, dimensions.length * 1.2);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
      const d = Math.max(dimensions.width, dimensions.length) * 0.8;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Central warm ceiling pendant light
    const ceilingLight = new THREE.PointLight(0xFFE8BD, 0.8, 8);
    ceilingLight.position.set(0, dimensions.height - 0.2, 0);
    scene.add(ceilingLight);

    // 7. Groups
    const wallsGroup = new THREE.Group();
    scene.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    // Render loop
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Floor & Walls whenever dimensions, finishes, or wallCutaway changes
  useEffect(() => {
    const scene = sceneRef.current;
    const wallsGroup = wallsGroupRef.current;
    if (!scene || !wallsGroup) return;

    // Clear old walls
    while (wallsGroup.children.length > 0) {
      wallsGroup.remove(wallsGroup.children[0]);
    }

    const { width: w, length: l, height: h } = dimensions;
    const wallThick = 0.12;

    // 1. Rebuild Floor Mesh
    if (floorMeshRef.current) {
      scene.remove(floorMeshRef.current);
    }
    const floorTexture = getProceduralFloorTexture(finishes.floorType);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: finishes.floorType === 'beige-travertine' ? 0.35 : 0.7,
      metalness: 0.05,
    });
    const floorGeo = new THREE.BoxGeometry(w, 0.1, l);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.05, 0);
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);
    floorMeshRef.current = floorMesh;

    // 2. Build Walls
    if (wallCutaway !== 'floor-only') {
      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(finishes.wallColor),
        roughness: 0.85,
        metalness: 0.0,
      });

      const accentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(finishes.accentWallColor || finishes.wallColor),
        roughness: 0.85,
        metalness: 0.0,
      });

      const baseboardMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(finishes.baseboardColor || '#FFFFFF'),
        roughness: 0.5,
        metalness: 0.05,
      });

      // Helper to construct a wall with cutouts for doors and windows
      const buildWallSegments = (
        wallSide: 'north' | 'south' | 'east' | 'west',
        wallLength: number,
        wallHeight: number,
        wallMaterial: THREE.Material
      ) => {
        const wallGroup = new THREE.Group();
        const wallOpenings = openings.filter((o) => o.wall === wallSide);

        if (wallOpenings.length === 0) {
          // Solid Wall
          const solidGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThick);
          const solidMesh = new THREE.Mesh(solidGeo, wallMaterial);
          solidMesh.position.set(0, wallHeight / 2, 0);
          solidMesh.receiveShadow = true;
          wallGroup.add(solidMesh);
        } else {
          // Sort openings by offset along wall
          const sorted = [...wallOpenings].sort((a, b) => a.offset - b.offset);
          let curX = 0;

          sorted.forEach((op) => {
            const startX = Math.max(0, Math.min(wallLength, op.offset));
            const opWidth = Math.min(wallLength - startX, op.width);
            const endX = startX + opWidth;

            // 1. Left wall segment before opening
            const leftW = startX - curX;
            if (leftW > 0.02) {
              const segGeo = new THREE.BoxGeometry(leftW, wallHeight, wallThick);
              const segMesh = new THREE.Mesh(segGeo, wallMaterial);
              segMesh.position.set(
                -wallLength / 2 + curX + leftW / 2,
                wallHeight / 2,
                0
              );
              segMesh.receiveShadow = true;
              wallGroup.add(segMesh);
            }

            if (op.type === 'door') {
              const doorH = Math.min(wallHeight, op.height || 2.1);
              // Top beam above door
              const topBeamH = wallHeight - doorH;
              if (topBeamH > 0.02) {
                const beamGeo = new THREE.BoxGeometry(opWidth, topBeamH, wallThick);
                const beamMesh = new THREE.Mesh(beamGeo, wallMaterial);
                beamMesh.position.set(
                  -wallLength / 2 + startX + opWidth / 2,
                  doorH + topBeamH / 2,
                  0
                );
                beamMesh.receiveShadow = true;
                wallGroup.add(beamMesh);
              }

              // 3D Door Frame & Casing (Batente)
              const frameMat = new THREE.MeshStandardMaterial({
                color: 0xF8FAFC,
                roughness: 0.5,
              });
              const frameThick = 0.04;
              // Left jamb
              const jambL = new THREE.Mesh(
                new THREE.BoxGeometry(frameThick, doorH, wallThick + 0.02),
                frameMat
              );
              jambL.position.set(-wallLength / 2 + startX + frameThick / 2, doorH / 2, 0);
              wallGroup.add(jambL);
              // Right jamb
              const jambR = new THREE.Mesh(
                new THREE.BoxGeometry(frameThick, doorH, wallThick + 0.02),
                frameMat
              );
              jambR.position.set(-wallLength / 2 + endX - frameThick / 2, doorH / 2, 0);
              wallGroup.add(jambR);
              // Header jamb
              const jambTop = new THREE.Mesh(
                new THREE.BoxGeometry(opWidth, frameThick, wallThick + 0.02),
                frameMat
              );
              jambTop.position.set(
                -wallLength / 2 + startX + opWidth / 2,
                doorH - frameThick / 2,
                0
              );
              wallGroup.add(jambTop);

              // 3D Door Leaf (Folha da Porta entreaberta a 30°)
              const doorLeafMat = new THREE.MeshStandardMaterial({
                color: 0xE2E8F0,
                roughness: 0.6,
              });
              const doorLeafW = opWidth - frameThick * 2;
              const doorLeafH = doorH - frameThick;
              const doorLeafGeo = new THREE.BoxGeometry(doorLeafW, doorLeafH, 0.035);
              const doorLeaf = new THREE.Mesh(doorLeafGeo, doorLeafMat);
              // Pivot at hinge
              const doorPivot = new THREE.Group();
              doorPivot.position.set(
                -wallLength / 2 + startX + frameThick,
                doorLeafH / 2,
                0
              );
              doorLeaf.position.set(doorLeafW / 2, 0, 0);
              doorPivot.add(doorLeaf);
              // Open door slightly inwards
              doorPivot.rotation.y = THREE.MathUtils.degToRad(30);
              wallGroup.add(doorPivot);

              // Door handle
              const handleMat = new THREE.MeshStandardMaterial({
                color: 0xD4AF37,
                metalness: 0.8,
                roughness: 0.2,
              });
              const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12),
                handleMat
              );
              handle.rotation.x = Math.PI / 2;
              handle.position.set(doorLeafW - 0.08, 0, 0.03);
              doorLeaf.add(handle);
            } else {
              // Window Cutout
              const sillH = op.sillHeight ?? 1.0;
              const winH = Math.min(wallHeight - sillH - 0.1, op.height || 1.2);
              const topBeamH = Math.max(0, wallHeight - (sillH + winH));

              // Bottom apron wall (peitoril)
              if (sillH > 0.02) {
                const apronGeo = new THREE.BoxGeometry(opWidth, sillH, wallThick);
                const apronMesh = new THREE.Mesh(apronGeo, wallMaterial);
                apronMesh.position.set(
                  -wallLength / 2 + startX + opWidth / 2,
                  sillH / 2,
                  0
                );
                apronMesh.receiveShadow = true;
                wallGroup.add(apronMesh);
              }

              // Top lintel beam
              if (topBeamH > 0.02) {
                const lintelGeo = new THREE.BoxGeometry(opWidth, topBeamH, wallThick);
                const lintelMesh = new THREE.Mesh(lintelGeo, wallMaterial);
                lintelMesh.position.set(
                  -wallLength / 2 + startX + opWidth / 2,
                  sillH + winH + topBeamH / 2,
                  0
                );
                lintelMesh.receiveShadow = true;
                wallGroup.add(lintelMesh);
              }

              // Window Frame Casing
              const winFrameMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                metalness: 0.6,
                roughness: 0.3,
              });
              // Outer frame box
              const frameGeo = new THREE.BoxGeometry(opWidth, winH, wallThick + 0.01);
              const winCenterY = sillH + winH / 2;

              // Transparent Glass Pane
              const glassMat = new THREE.MeshStandardMaterial({
                color: 0xBAE6FD,
                transparent: true,
                opacity: 0.45,
                roughness: 0.1,
                metalness: 0.9,
              });
              const glassGeo = new THREE.BoxGeometry(opWidth - 0.06, winH - 0.06, 0.01);
              const glassMesh = new THREE.Mesh(glassGeo, glassMat);
              glassMesh.position.set(
                -wallLength / 2 + startX + opWidth / 2,
                winCenterY,
                0
              );
              wallGroup.add(glassMesh);

              // Center vertical mullion bar
              const mullionGeo = new THREE.BoxGeometry(0.03, winH, wallThick + 0.015);
              const mullion = new THREE.Mesh(mullionGeo, winFrameMat);
              mullion.position.set(
                -wallLength / 2 + startX + opWidth / 2,
                winCenterY,
                0
              );
              wallGroup.add(mullion);

              // Marble / Wood Window Sill Ledge (Peitoril)
              const sillLedgeMat = new THREE.MeshStandardMaterial({
                color: 0xF1F5F9,
                roughness: 0.3,
                metalness: 0.1,
              });
              const sillLedge = new THREE.Mesh(
                new THREE.BoxGeometry(opWidth + 0.08, 0.03, wallThick + 0.08),
                sillLedgeMat
              );
              sillLedge.position.set(
                -wallLength / 2 + startX + opWidth / 2,
                sillH + 0.015,
                0.02
              );
              wallGroup.add(sillLedge);
            }

            curX = endX;
          });

          // Final right wall segment
          const rightW = wallLength - curX;
          if (rightW > 0.02) {
            const segGeo = new THREE.BoxGeometry(rightW, wallHeight, wallThick);
            const segMesh = new THREE.Mesh(segGeo, wallMaterial);
            segMesh.position.set(
              -wallLength / 2 + curX + rightW / 2,
              wallHeight / 2,
              0
            );
            segMesh.receiveShadow = true;
            wallGroup.add(segMesh);
          }
        }

        return wallGroup;
      };

      // Wall heights: if cutaway, front/south & east walls are lower (1.0m) unless user selected full
      const backWallH = h;
      const frontWallH = wallCutaway === 'cutaway' ? 0.85 : h;

      // North Wall (Back)
      const northMat = finishes.accentWallSide === 'north' ? accentMat : wallMat;
      const northWall = buildWallSegments('north', w, backWallH, northMat);
      northWall.position.set(0, 0, -l / 2 - wallThick / 2);
      wallsGroup.add(northWall);

      // West Wall (Left)
      const westMat = finishes.accentWallSide === 'west' ? accentMat : wallMat;
      const westWall = buildWallSegments('west', l, backWallH, westMat);
      westWall.rotation.y = Math.PI / 2;
      westWall.position.set(-w / 2 - wallThick / 2, 0, 0);
      wallsGroup.add(westWall);

      // South Wall (Front)
      const southMat = finishes.accentWallSide === 'south' ? accentMat : wallMat;
      const southWall = buildWallSegments('south', w, frontWallH, southMat);
      southWall.position.set(0, 0, l / 2 + wallThick / 2);
      wallsGroup.add(southWall);

      // East Wall (Right)
      const eastMat = finishes.accentWallSide === 'east' ? accentMat : wallMat;
      const eastWall = buildWallSegments('east', l, frontWallH, eastMat);
      eastWall.rotation.y = Math.PI / 2;
      eastWall.position.set(w / 2 + wallThick / 2, 0, 0);
      wallsGroup.add(eastWall);

      // Baseboard along perimeter
      const bbH = 0.09;
      const bbThick = 0.015;
      const bbNorth = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.02, bbH, bbThick),
        baseboardMat
      );
      bbNorth.position.set(0, bbH / 2, -l / 2 + bbThick / 2);
      wallsGroup.add(bbNorth);

      const bbWest = new THREE.Mesh(
        new THREE.BoxGeometry(bbThick, bbH, l - 0.02),
        baseboardMat
      );
      bbWest.position.set(-w / 2 + bbThick / 2, bbH / 2, 0);
      wallsGroup.add(bbWest);
    }
  }, [dimensions, finishes, openings, wallCutaway, isSoftwareGl]);

  // Update Furniture 3D Objects
  useEffect(() => {
    const furnitureGroup = furnitureGroupRef.current;
    if (!furnitureGroup) return;

    // Clear previous items
    while (furnitureGroup.children.length > 0) {
      furnitureGroup.remove(furnitureGroup.children[0]);
    }

    // Build procedural 3D furniture models
    furniture.forEach((item) => {
      const objGroup = build3DFurniture(item);

      // If selected, add an outline or glowing ring
      if (item.id === selectedItemId) {
        const ringGeo = new THREE.RingGeometry(
          Math.max(item.width, item.depth) * 0.55,
          Math.max(item.width, item.depth) * 0.58,
          32
        );
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x3B82F6,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.01;
        objGroup.add(ring);
      }

      furnitureGroup.add(objGroup);
    });
  }, [furniture, selectedItemId]);

  // Day / Night Mode Lighting Adjustment
  useEffect(() => {
    const scene = sceneRef.current;
    const sun = sunLightRef.current;
    const hemi = hemiLightRef.current;
    if (!scene || !sun || !hemi) return;

    if (isNightMode) {
      scene.background = new THREE.Color('#090D16');
      sun.color = new THREE.Color('#475569');
      sun.intensity = 0.2;
      hemi.color = new THREE.Color('#1E293B');
      hemi.groundColor = new THREE.Color('#0F172A');
      hemi.intensity = 0.4;
    } else {
      scene.background = new THREE.Color('#F1F5F9');
      sun.color = new THREE.Color('#FFF7ED');
      sun.intensity = 1.4;
      hemi.color = new THREE.Color('#F8FAFC');
      hemi.groundColor = new THREE.Color('#94A3B8');
      hemi.intensity = 0.7;
    }
  }, [isNightMode]);

  // Camera Presets
  const handleSetCameraPreset = (preset: 'isometric' | 'top' | 'eye-level') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setCameraPreset(preset);

    if (preset === 'isometric') {
      camera.position.set(dimensions.width * 1.3, dimensions.height * 1.4, dimensions.length * 1.4);
      controls.target.set(0, dimensions.height * 0.35, 0);
    } else if (preset === 'top') {
      camera.position.set(0, Math.max(dimensions.width, dimensions.length) * 1.8, 0.01);
      controls.target.set(0, 0, 0);
    } else {
      // Eye level perspective (standing near doorway looking in)
      camera.position.set(0, 1.5, dimensions.length * 0.48);
      controls.target.set(0, 0.8, -dimensions.length * 0.2);
    }
    controls.update();
  };

  // Raycasting click selection in 3D
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !furnitureGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(furnitureGroupRef.current.children, true);
    if (intersects.length > 0) {
      // Find ancestor group with userData.id
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && !current.userData?.id) {
        current = current.parent;
      }
      if (current && current.userData?.id) {
        onSelectItem(current.userData.id);
        return;
      }
    }
    // Clicking empty space deselects
    onSelectItem(null);
  };

  // Export 3D snapshot
  const handleExportSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `quarto-3d-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
      />

      {/* Top Floating 3D Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg backdrop-blur-xs">
        {/* Camera Presets */}
        <button
          onClick={() => handleSetCameraPreset('isometric')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            cameraPreset === 'isometric'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Vista Isométrica 3D"
        >
          <Rotate3d className="w-3.5 h-3.5" />
          <span>Isométrica</span>
        </button>
        <button
          onClick={() => handleSetCameraPreset('top')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            cameraPreset === 'top'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Vista Superior 3D (Top-Down)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Planta 3D</span>
        </button>
        <button
          onClick={() => handleSetCameraPreset('eye-level')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            cameraPreset === 'eye-level'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Nível dos Olhos (1.6m de altura)"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Olhos</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Wall Cutaway Mode */}
        <button
          onClick={() =>
            setWallCutaway((prev) =>
              prev === 'cutaway' ? 'full' : prev === 'full' ? 'floor-only' : 'cutaway'
            )
          }
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title={`Paredes: ${
            wallCutaway === 'cutaway' ? 'Corte Frontal (Visão Livre)' : wallCutaway === 'full' ? 'Paredes Completas' : 'Apenas Piso'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            {wallCutaway === 'cutaway' ? 'Corte Paredes' : wallCutaway === 'full' ? 'Paredes Altas' : 'Só Piso'}
          </span>
        </button>

        {/* Day / Night toggle */}
        <button
          onClick={() => setIsNightMode((n) => !n)}
          className={`p-1.5 rounded transition-colors ${
            isNightMode
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
              : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
          title={isNightMode ? 'Mudar para Iluminação Diurna (Sol)' : 'Mudar para Modo Noturno Aconchegante'}
        >
          {isNightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Screenshot capture */}
        <button
          onClick={handleExportSnapshot}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Salvar Foto PNG em Alta Resolução"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Capturar</span>
        </button>
      </div>

      {/* Orbit Tip in bottom-left */}
      <div className="absolute bottom-3 left-4 z-20 text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded border border-slate-200/60 dark:border-slate-800/60 pointer-events-none">
        Arraste com o mouse para orbitar · Scroll para zoom · Clique no móvel para inspecionar
      </div>
    </div>
  );
};
