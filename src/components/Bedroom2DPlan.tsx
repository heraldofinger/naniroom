/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Magnet,
  DoorClosed,
  Square,
  Ruler,
  Plus,
  ArrowLeftRight,
  MoveHorizontal
} from 'lucide-react';
import { FurnitureItem, RoomDimensions, WallOpening, WallSide } from '../types/bedroom';
import { getItemBoundingBox } from '../utils/ergonomics';

interface Bedroom2DPlanProps {
  dimensions: RoomDimensions;
  furniture: FurnitureItem[];
  openings: WallOpening[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateFurniture: (updated: FurnitureItem[]) => void;
  onUpdateOpenings: (openings: WallOpening[]) => void;
  onOpenInitialSetup?: () => void;
  showClearances: boolean;
  onToggleClearances: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}

export const Bedroom2DPlan: React.FC<Bedroom2DPlanProps> = ({
  dimensions,
  furniture,
  openings,
  selectedItemId,
  onSelectItem,
  onUpdateFurniture,
  onUpdateOpenings,
  onOpenInitialSetup,
  showClearances,
  onToggleClearances,
  snapToGrid,
  onToggleSnap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport zoom & pan
  const [zoom, setZoom] = useState(105); // pixels per meter
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging furniture
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, z: 0 });

  // Selected Wall Opening (Door or Window)
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);

  // Measurement ruler tool
  const [measuring, setMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; z: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; z: number } | null>(null);

  const selectedItem = furniture.find((f) => f.id === selectedItemId) || null;
  const selectedOpening = openings.find((o) => o.id === selectedOpeningId) || null;

  // Center the view on mount or dimensions change
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  // Convert room meters to SVG canvas coordinates
  const mToPx = useCallback((val: number) => val * zoom, [zoom]);
  const pxToM = useCallback((val: number) => val / zoom, [zoom]);

  // Coordinate transforms
  // Room origin (0, 0) is center of the room.
  const roomToSvg = useCallback(
    (rx: number, rz: number) => ({
      x: pan.x + mToPx(rx),
      y: pan.y + mToPx(rz),
    }),
    [pan, mToPx]
  );

  const svgToRoom = useCallback(
    (sx: number, sy: number) => ({
      rx: pxToM(sx - pan.x),
      rz: pxToM(sy - pan.y),
    }),
    [pan, pxToM]
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(220, Math.max(50, prev * factor)));
  };

  // Mouse down on SVG background (start pan or ruler)
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === svgRef.current)) {
      if (measuring) {
        const rect = svgRef.current!.getBoundingClientRect();
        const pt = svgToRoom(e.clientX - rect.left, e.clientY - rect.top);
        if (!measureStart) {
          setMeasureStart({ x: pt.rx, z: pt.rz });
          setMeasureEnd({ x: pt.rx, z: pt.rz });
        } else {
          setMeasureStart(null);
          setMeasureEnd(null);
        }
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectItem(null);
      setSelectedOpeningId(null);
    }
  };

  // Mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (measuring && measureStart && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const pt = svgToRoom(e.clientX - rect.left, e.clientY - rect.top);
      setMeasureEnd({ x: pt.rx, z: pt.rz });
      return;
    }

    if (draggingItemId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const rawRoom = svgToRoom(e.clientX - rect.left, e.clientY - rect.top);
      let targetX = rawRoom.rx - dragOffset.x;
      let targetZ = rawRoom.rz - dragOffset.z;

      if (snapToGrid) {
        const step = 0.05; // 5 cm precision snapping
        targetX = Math.round(targetX / step) * step;
        targetZ = Math.round(targetZ / step) * step;
      }

      // Constrain within room walls with boundary buffer
      const halfW = dimensions.width / 2;
      const halfL = dimensions.length / 2;
      const curItem = furniture.find((f) => f.id === draggingItemId);
      if (curItem) {
        const maxExtent = Math.max(curItem.width, curItem.depth) / 2;
        targetX = Math.max(-halfW + maxExtent * 0.4, Math.min(halfW - maxExtent * 0.4, targetX));
        targetZ = Math.max(-halfL + maxExtent * 0.4, Math.min(halfL - maxExtent * 0.4, targetZ));

        onUpdateFurniture(
          furniture.map((item) =>
            item.id === draggingItemId
              ? { ...item, x: +targetX.toFixed(2), z: +targetZ.toFixed(2) }
              : item
          )
        );
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingItemId(null);
  };

  // Start dragging a furniture piece
  const handleItemMouseDown = (e: React.MouseEvent, item: FurnitureItem) => {
    e.stopPropagation();
    setSelectedOpeningId(null);
    if (item.locked) {
      onSelectItem(item.id);
      return;
    }
    onSelectItem(item.id);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickPos = svgToRoom(e.clientX - rect.left, e.clientY - rect.top);
      setDragOffset({
        x: clickPos.rx - item.x,
        z: clickPos.rz - item.z,
      });
      setDraggingItemId(item.id);
    }
  };

  // Rotate selected item
  const handleRotate = (deltaDeg: number) => {
    if (!selectedItem || selectedItem.locked) return;
    const newRot = (selectedItem.rotation + deltaDeg + 360) % 360;
    onUpdateFurniture(
      furniture.map((item) =>
        item.id === selectedItem.id ? { ...item, rotation: newRot } : item
      )
    );
  };

  // Duplicate item
  const handleDuplicate = () => {
    if (!selectedItem) return;
    const newItem: FurnitureItem = {
      ...selectedItem,
      id: `item-${Date.now()}`,
      name: `${selectedItem.name} (Cópia)`,
      x: Math.min(dimensions.width / 2 - 0.5, selectedItem.x + 0.3),
      z: Math.min(dimensions.length / 2 - 0.5, selectedItem.z + 0.3),
    };
    onUpdateFurniture([...furniture, newItem]);
    onSelectItem(newItem.id);
  };

  // Delete item
  const handleDelete = () => {
    if (!selectedItem) return;
    onUpdateFurniture(furniture.filter((item) => item.id !== selectedItem.id));
    onSelectItem(null);
  };

  // Toggle lock
  const handleToggleLock = () => {
    if (!selectedItem) return;
    onUpdateFurniture(
      furniture.map((item) =>
        item.id === selectedItem.id ? { ...item, locked: !item.locked } : item
      )
    );
  };

  // Reset viewport
  const handleFitView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 120;
      const zoomX = (rect.width - padding) / dimensions.width;
      const zoomY = (rect.height - padding) / dimensions.length;
      setZoom(Math.min(zoomX, zoomY, 150));
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  };

  // Add a quick door
  const handleQuickAddDoor = () => {
    const newDoor: WallOpening = {
      id: `door-${Date.now()}`,
      type: 'door',
      wall: 'south',
      offset: 0.6,
      width: 0.85,
      height: 2.1,
      swing: 'inward-right',
    };
    onUpdateOpenings([...openings, newDoor]);
    setSelectedOpeningId(newDoor.id);
    onSelectItem(null);
  };

  // Add a quick window
  const handleQuickAddWindow = () => {
    const newWin: WallOpening = {
      id: `win-${Date.now()}`,
      type: 'window',
      wall: 'east',
      offset: 0.8,
      width: 1.4,
      height: 1.2,
      sillHeight: 1.0,
    };
    onUpdateOpenings([...openings, newWin]);
    setSelectedOpeningId(newWin.id);
    onSelectItem(null);
  };

  // Adjust selected opening position along wall
  const handleNudgeOpening = (delta: number) => {
    if (!selectedOpening) return;
    const wallMax =
      selectedOpening.wall === 'north' || selectedOpening.wall === 'south'
        ? dimensions.width
        : dimensions.length;
    const newOffset = Math.max(
      0.1,
      Math.min(wallMax - selectedOpening.width - 0.1, selectedOpening.offset + delta)
    );
    onUpdateOpenings(
      openings.map((o) =>
        o.id === selectedOpening.id ? { ...o, offset: +newOffset.toFixed(2) } : o
      )
    );
  };

  // Flip opening swing (for door)
  const handleFlipDoorSwing = () => {
    if (!selectedOpening || selectedOpening.type !== 'door') return;
    const curSwing = selectedOpening.swing || 'inward-right';
    const nextSwing =
      curSwing === 'inward-right'
        ? 'inward-left'
        : curSwing === 'inward-left'
        ? 'outward-right'
        : curSwing === 'outward-right'
        ? 'outward-left'
        : 'inward-right';
    onUpdateOpenings(
      openings.map((o) => (o.id === selectedOpening.id ? { ...o, swing: nextSwing } : o))
    );
  };

  // Delete selected opening
  const handleDeleteOpening = () => {
    if (!selectedOpening) return;
    onUpdateOpenings(openings.filter((o) => o.id !== selectedOpening.id));
    setSelectedOpeningId(null);
  };

  const halfW = dimensions.width / 2;
  const halfL = dimensions.length / 2;
  const wallThickM = 0.15; // 15cm standard wall thickness
  const wallThickPx = mToPx(wallThickM);

  const roomTopLeft = roomToSvg(-halfW, -halfL);
  const roomWidthPx = mToPx(dimensions.width);
  const roomLengthPx = mToPx(dimensions.length);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-slate-100 dark:bg-slate-950"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 2D Floating Blueprint Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg backdrop-blur-xs">
        {onOpenInitialSetup && (
          <button
            onClick={onOpenInitialSetup}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-md transition-colors shadow-2xs mr-1"
            title="Configurar medidas iniciais das paredes, portas e janelas"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Medidas Iniciais</span>
          </button>
        )}

        <button
          onClick={handleQuickAddDoor}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Inserir nova porta na parede"
        >
          <DoorClosed className="w-3.5 h-3.5 text-slate-600" />
          <span>+ Porta</span>
        </button>

        <button
          onClick={handleQuickAddWindow}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Inserir nova janela na parede"
        >
          <Square className="w-3.5 h-3.5 text-blue-600" />
          <span>+ Janela</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <button
          onClick={() => setZoom((z) => Math.min(220, z * 1.15))}
          className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Aproximar Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(50, z * 0.85))}
          className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Afastar Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitView}
          className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Enquadrar Quarto na Tela"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            snapToGrid
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Alinhar automaticamente na grade de 5cm"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>
        <button
          onClick={onToggleClearances}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            showClearances
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Visualizar faixas de circulação e passagem livre"
        >
          {showClearances ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Circulação</span>
        </button>
      </div>

      {/* Selected Opening (Door/Window) Floating Bar */}
      {selectedOpening && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 p-2 bg-white/95 dark:bg-slate-900/95 border border-blue-500 shadow-lg rounded-lg">
          <div className="flex items-center gap-1.5 px-1 border-r border-slate-200 dark:border-slate-800">
            {selectedOpening.type === 'door' ? (
              <DoorClosed className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
              {selectedOpening.type === 'door' ? 'Porta' : 'Janela'} ({selectedOpening.width}m)
            </span>
          </div>

          {/* Position Nudge Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNudgeOpening(-0.1)}
              className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
              title="Mover 10cm para a esquerda na parede"
            >
              ← 10cm
            </button>
            <button
              onClick={() => handleNudgeOpening(0.1)}
              className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
              title="Mover 10cm para a direita na parede"
            >
              10cm →
            </button>
          </div>

          {/* Door Swing flip */}
          {selectedOpening.type === 'door' && (
            <button
              onClick={handleFlipDoorSwing}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Inverter lado de abertura da porta"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Inverter</span>
            </button>
          )}

          {/* Delete opening */}
          <button
            onClick={handleDeleteOpening}
            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            title="Excluir abertura da parede"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Furniture Item Floating Action Bar */}
      {selectedItem && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md rounded-lg">
          <div className="px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 truncate max-w-[140px]">
            {selectedItem.name}
          </div>
          <button
            onClick={() => handleRotate(-90)}
            disabled={selectedItem.locked}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-40 transition-colors"
            title="Girar -90°"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRotate(90)}
            disabled={selectedItem.locked}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-40 transition-colors"
            title="Girar +90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Duplicar móvel"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleLock}
            className={`p-1.5 rounded transition-colors ${
              selectedItem.locked
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={selectedItem.locked ? 'Desbloquear posição' : 'Travar posição'}
          >
            {selectedItem.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            title="Excluir móvel"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SVG Architectural Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleSvgMouseDown}
      >
        <defs>
          {/* Subtle grid pattern (0.1m and 0.5m cells) */}
          <pattern
            id="subgrid"
            width={mToPx(0.1)}
            height={mToPx(0.1)}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${mToPx(0.1)} 0 L 0 0 0 ${mToPx(0.1)}`}
              fill="none"
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="mainGrid"
            width={mToPx(0.5)}
            height={mToPx(0.5)}
            patternUnits="userSpaceOnUse"
          >
            <rect width={mToPx(0.5)} height={mToPx(0.5)} fill="url(#subgrid)" />
            <path
              d={`M ${mToPx(0.5)} 0 L 0 0 0 ${mToPx(0.5)}`}
              fill="none"
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Global Blueprint Grid background */}
        <rect width="100%" height="100%" fill="url(#mainGrid)" />

        {/* Outer Room Walls (Thick Architectural Exterior) */}
        <g>
          <rect
            x={roomTopLeft.x - wallThickPx}
            y={roomTopLeft.y - wallThickPx}
            width={roomWidthPx + wallThickPx * 2}
            height={roomLengthPx + wallThickPx * 2}
            fill="#334155"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Inner Room Floor Space */}
          <rect
            x={roomTopLeft.x}
            y={roomTopLeft.y}
            width={roomWidthPx}
            height={roomLengthPx}
            fill="#FFFFFF"
            className="dark:fill-slate-900"
          />
        </g>

        {/* Wall Openings (Doors with swing arc and Windows) */}
        {openings.map((opening) => (
          <WallOpening2D
            key={opening.id}
            opening={opening}
            dimensions={dimensions}
            zoom={zoom}
            roomToSvg={roomToSvg}
            isSelected={opening.id === selectedOpeningId}
            onSelectOpening={(id) => {
              setSelectedOpeningId(id);
              onSelectItem(null);
            }}
          />
        ))}

        {/* Room Dimension Labels along walls */}
        {/* Top/North Wall Length */}
        <g className="text-xs font-mono font-medium fill-slate-700 dark:fill-slate-300">
          <line
            x1={roomTopLeft.x}
            y1={roomTopLeft.y - wallThickPx - 16}
            x2={roomTopLeft.x + roomWidthPx}
            y2={roomTopLeft.y - wallThickPx - 16}
            stroke="#64748B"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={roomTopLeft.x + roomWidthPx / 2}
            y={roomTopLeft.y - wallThickPx - 22}
            textAnchor="middle"
            className="text-[11px] font-semibold tracking-wider"
          >
            {dimensions.width.toFixed(2)} m (PAREDE NORTE)
          </text>
        </g>

        {/* Left/West Wall Depth */}
        <g className="text-xs font-mono font-medium fill-slate-700 dark:fill-slate-300">
          <line
            x1={roomTopLeft.x - wallThickPx - 16}
            y1={roomTopLeft.y}
            x2={roomTopLeft.x - wallThickPx - 16}
            y2={roomTopLeft.y + roomLengthPx}
            stroke="#64748B"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x={roomTopLeft.x - wallThickPx - 24}
            y={roomTopLeft.y + roomLengthPx / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${roomTopLeft.x - wallThickPx - 24} ${roomTopLeft.y + roomLengthPx / 2})`}
            className="text-[11px] font-semibold tracking-wider"
          >
            {dimensions.length.toFixed(2)} m (PAREDE OESTE)
          </text>
        </g>

        {/* Bottom/South Wall Length */}
        <g className="text-xs font-mono font-medium fill-slate-700 dark:fill-slate-300">
          <text
            x={roomTopLeft.x + roomWidthPx / 2}
            y={roomTopLeft.y + roomLengthPx + wallThickPx + 22}
            textAnchor="middle"
            className="text-[10px] font-semibold tracking-wider text-slate-400"
          >
            PAREDE SUL: {dimensions.width.toFixed(2)} m
          </text>
        </g>

        {/* Room Area Stamp in center */}
        <text
          x={roomTopLeft.x + roomWidthPx / 2}
          y={roomTopLeft.y + roomLengthPx - 16}
          textAnchor="middle"
          className="text-xs font-mono font-bold fill-slate-300 dark:fill-slate-700 tracking-widest pointer-events-none"
        >
          QUARTO · {(dimensions.width * dimensions.length).toFixed(1)} m²
        </text>

        {/* Furniture Items Layer */}
        {furniture.map((item) => {
          const isSelected = item.id === selectedItemId;
          const pos = roomToSvg(item.x, item.z);
          const wPx = mToPx(item.width);
          const dPx = mToPx(item.depth);

          return (
            <g
              key={item.id}
              transform={`translate(${pos.x}, ${pos.y}) rotate(${item.rotation})`}
              onMouseDown={(e) => handleItemMouseDown(e, item)}
              className="cursor-move group"
            >
              {/* Optional Clearance Zone Aura */}
              {showClearances && (
                <rect
                  x={-wPx / 2 - mToPx(0.6)}
                  y={-dPx / 2 - mToPx(0.6)}
                  width={wPx + mToPx(1.2)}
                  height={dPx + mToPx(1.2)}
                  fill="rgba(59, 130, 246, 0.08)"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  rx="6"
                  pointerEvents="none"
                />
              )}

              {/* Architectural 2D Plan Graphic for this furniture item */}
              <FurnitureSymbol2D item={item} wPx={wPx} dPx={dPx} />

              {/* Selection Halo / Border */}
              {isSelected && (
                <g pointerEvents="none">
                  <rect
                    x={-wPx / 2 - 4}
                    y={-dPx / 2 - 4}
                    width={wPx + 8}
                    height={dPx + 8}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                    rx="4"
                  />
                  {/* Direction indicator arrow */}
                  <polygon
                    points={`0,${-dPx / 2 - 12} -6,${-dPx / 2 - 4} 6,${-dPx / 2 - 4}`}
                    fill="#2563EB"
                  />
                  {/* Dimension Tag */}
                  <text
                    x="0"
                    y={dPx / 2 + 16}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-blue-700 dark:fill-blue-400"
                  >
                    {item.width.toFixed(2)}m × {item.depth.toFixed(2)}m
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Temporary Measurement Ruler line */}
        {measureStart && measureEnd && (
          <g>
            {(() => {
              const p1 = roomToSvg(measureStart.x, measureStart.z);
              const p2 = roomToSvg(measureEnd.x, measureEnd.z);
              const dist = Math.hypot(measureEnd.x - measureStart.x, measureEnd.z - measureStart.z);
              return (
                <>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx={p1.x} cy={p1.y} r="4" fill="#EF4444" />
                  <circle cx={p2.x} cy={p2.y} r="4" fill="#EF4444" />
                  <text
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2 - 8}
                    textAnchor="middle"
                    className="text-xs font-mono font-bold fill-red-600 bg-white px-1"
                  >
                    {dist.toFixed(2)} m
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Coordinate & Scale HUD pill */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
        <span>Escala: {zoom.toFixed(0)} px/m</span>
        <span>·</span>
        <span>Clique em portas ou janelas para ajustar</span>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// Wall Opening 2D Renderer (Interactive Door & Window symbols)
// --------------------------------------------------------------------------------
interface WallOpeningProps {
  opening: WallOpening;
  dimensions: RoomDimensions;
  zoom: number;
  roomToSvg: (x: number, z: number) => { x: number; y: number };
  isSelected?: boolean;
  onSelectOpening?: (id: string) => void;
}

const WallOpening2D: React.FC<WallOpeningProps> = ({
  opening,
  dimensions,
  zoom,
  roomToSvg,
  isSelected,
  onSelectOpening,
}) => {
  const halfW = dimensions.width / 2;
  const halfL = dimensions.length / 2;
  const mToPx = (v: number) => v * zoom;
  const wallThickPx = mToPx(0.15);
  const widthPx = mToPx(opening.width);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectOpening?.(opening.id);
  };

  if (opening.type === 'door') {
    let hinge = { x: 0, y: 0 };
    let arcD = '';
    let doorLine = { x1: 0, y1: 0, x2: 0, y2: 0 };
    let openingGap = { x: 0, y: 0, w: 0, h: 0 };

    if (opening.wall === 'south') {
      const rx = -halfW + opening.offset;
      const rz = halfL;
      hinge = roomToSvg(rx, rz);
      arcD = `M ${hinge.x} ${hinge.y} A ${widthPx} ${widthPx} 0 0 0 ${hinge.x + widthPx} ${hinge.y}`;
      doorLine = { x1: hinge.x, y1: hinge.y, x2: hinge.x, y2: hinge.y - widthPx };
      openingGap = { x: hinge.x, y: hinge.y - wallThickPx / 2, w: widthPx, h: wallThickPx };
    } else if (opening.wall === 'north') {
      const rx = -halfW + opening.offset;
      const rz = -halfL;
      hinge = roomToSvg(rx, rz);
      arcD = `M ${hinge.x} ${hinge.y} A ${widthPx} ${widthPx} 0 0 1 ${hinge.x + widthPx} ${hinge.y}`;
      doorLine = { x1: hinge.x, y1: hinge.y, x2: hinge.x, y2: hinge.y + widthPx };
      openingGap = { x: hinge.x, y: hinge.y - wallThickPx / 2, w: widthPx, h: wallThickPx };
    } else if (opening.wall === 'west') {
      const rx = -halfW;
      const rz = -halfL + opening.offset;
      hinge = roomToSvg(rx, rz);
      arcD = `M ${hinge.x} ${hinge.y} A ${widthPx} ${widthPx} 0 0 1 ${hinge.x} ${hinge.y + widthPx}`;
      doorLine = { x1: hinge.x, y1: hinge.y, x2: hinge.x + widthPx, y2: hinge.y };
      openingGap = { x: hinge.x - wallThickPx / 2, y: hinge.y, w: wallThickPx, h: widthPx };
    } else {
      // East wall
      const rx = halfW;
      const rz = -halfL + opening.offset;
      hinge = roomToSvg(rx, rz);
      arcD = `M ${hinge.x} ${hinge.y} A ${widthPx} ${widthPx} 0 0 0 ${hinge.x} ${hinge.y + widthPx}`;
      doorLine = { x1: hinge.x, y1: hinge.y, x2: hinge.x - widthPx, y2: hinge.y };
      openingGap = { x: hinge.x - wallThickPx / 2, y: hinge.y, w: wallThickPx, h: widthPx };
    }

    return (
      <g onClick={handleClick} className="door-symbol cursor-pointer group">
        {/* Wall cutout clearance box (white background break in wall) */}
        <rect
          x={openingGap.x}
          y={openingGap.y}
          width={openingGap.w}
          height={openingGap.h}
          fill="#FFFFFF"
          className="dark:fill-slate-900"
        />

        {/* Selection / Hover Indicator */}
        {isSelected && (
          <rect
            x={openingGap.x - 4}
            y={openingGap.y - 4}
            width={openingGap.w + 8}
            height={openingGap.h + 8}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeDasharray="4 2"
            rx="3"
          />
        )}

        {/* Door panel line */}
        <line
          x1={doorLine.x1}
          y1={doorLine.y1}
          x2={doorLine.x2}
          y2={doorLine.y2}
          stroke={isSelected ? '#2563EB' : '#334155'}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Swing arc */}
        <path
          d={arcD}
          fill="none"
          stroke={isSelected ? '#3B82F6' : '#94A3B8'}
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Door width label */}
        <text
          x={doorLine.x1 + 10}
          y={doorLine.y1 - 6}
          className="text-[9px] font-mono font-bold fill-slate-700 dark:fill-slate-300 pointer-events-none"
        >
          Porta {opening.width.toFixed(2)}m
        </text>
      </g>
    );
  }

  // Window Symbol
  let wPos = { x: 0, y: 0 };
  const isHoriz = opening.wall === 'north' || opening.wall === 'south';

  if (opening.wall === 'north') wPos = roomToSvg(-halfW + opening.offset, -halfL);
  else if (opening.wall === 'south') wPos = roomToSvg(-halfW + opening.offset, halfL);
  else if (opening.wall === 'west') wPos = roomToSvg(-halfW, -halfL + opening.offset);
  else wPos = roomToSvg(halfW, -halfL + opening.offset);

  return (
    <g onClick={handleClick} className="window-symbol cursor-pointer group">
      {isHoriz ? (
        <>
          {/* Wall opening cutout */}
          <rect
            x={wPos.x}
            y={wPos.y - wallThickPx / 2}
            width={widthPx}
            height={wallThickPx}
            fill="#E0F2FE"
            stroke={isSelected ? '#2563EB' : '#0284C7'}
            strokeWidth={isSelected ? '2.5' : '1.5'}
          />
          {/* Center Glass Line */}
          <line
            x1={wPos.x}
            y1={wPos.y}
            x2={wPos.x + widthPx}
            y2={wPos.y}
            stroke="#0284C7"
            strokeWidth="2"
          />
          {/* Label */}
          <text
            x={wPos.x + widthPx / 2}
            y={wPos.y - 10}
            textAnchor="middle"
            className="text-[9px] font-mono font-bold fill-blue-700 dark:fill-blue-400 pointer-events-none"
          >
            Janela {opening.width.toFixed(2)}m
          </text>
        </>
      ) : (
        <>
          <rect
            x={wPos.x - wallThickPx / 2}
            y={wPos.y}
            width={wallThickPx}
            height={widthPx}
            fill="#E0F2FE"
            stroke={isSelected ? '#2563EB' : '#0284C7'}
            strokeWidth={isSelected ? '2.5' : '1.5'}
          />
          <line
            x1={wPos.x}
            y1={wPos.y}
            x2={wPos.x}
            y2={wPos.y + widthPx}
            stroke="#0284C7"
            strokeWidth="2"
          />
          <text
            x={wPos.x + (opening.wall === 'west' ? -12 : 12)}
            y={wPos.y + widthPx / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${wPos.x + (opening.wall === 'west' ? -12 : 12)} ${wPos.y + widthPx / 2})`}
            className="text-[9px] font-mono font-bold fill-blue-700 dark:fill-blue-400 pointer-events-none"
          >
            Janela {opening.width.toFixed(2)}m
          </text>
        </>
      )}
    </g>
  );
};

// --------------------------------------------------------------------------------
// 2D Architectural Furniture Symbols
// --------------------------------------------------------------------------------
interface FurnitureSymbolProps {
  item: FurnitureItem;
  wPx: number;
  dPx: number;
}

const FurnitureSymbol2D: React.FC<FurnitureSymbolProps> = ({ item, wPx, dPx }) => {
  const halfW = wPx / 2;
  const halfD = dPx / 2;

  switch (item.category) {
    case 'beds':
      return (
        <g>
          {/* Bed Outer Frame */}
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx}
            fill="#F8FAFC"
            stroke="#334155"
            strokeWidth="1.5"
            rx="4"
          />
          {/* Headboard */}
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx * 0.12}
            fill="#E2E8F0"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Pillows */}
          {item.width > 1.2 ? (
            <>
              <rect
                x={-halfW + 4}
                y={-halfD + dPx * 0.15}
                width={halfW - 8}
                height={dPx * 0.22}
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="1"
                rx="3"
              />
              <rect
                x={4}
                y={-halfD + dPx * 0.15}
                width={halfW - 8}
                height={dPx * 0.22}
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="1"
                rx="3"
              />
            </>
          ) : (
            <rect
              x={-halfW + 6}
              y={-halfD + dPx * 0.15}
              width={wPx - 12}
              height={dPx * 0.22}
              fill="#FFFFFF"
              stroke="#64748B"
              strokeWidth="1"
              rx="3"
            />
          )}
          {/* Folded Duvet / Bedding */}
          <rect
            x={-halfW + 2}
            y={-halfD + dPx * 0.42}
            width={wPx - 4}
            height={dPx * 0.56}
            fill={item.color}
            opacity="0.35"
            rx="2"
          />
          <line
            x1={-halfW + 2}
            y1={-halfD + dPx * 0.42}
            x2={halfW - 2}
            y2={-halfD + dPx * 0.42}
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Label */}
          <text
            x="0"
            y={halfD - 8}
            textAnchor="middle"
            className="text-[10px] font-sans font-medium fill-slate-700 pointer-events-none"
          >
            {item.name}
          </text>
        </g>
      );

    case 'wardrobes':
      return (
        <g>
          {/* Wardrobe Body */}
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx}
            fill="#F1F5F9"
            stroke="#334155"
            strokeWidth="1.5"
            rx="2"
          />
          {/* Door line divisions */}
          <line x1={0} y1={-halfD} x2={0} y2={halfD} stroke="#94A3B8" strokeWidth="1" />
          <line
            x1={-halfW + 4}
            y1={0}
            x2={halfW - 4}
            y2={0}
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            className="text-[10px] font-sans font-medium fill-slate-700 pointer-events-none"
          >
            {item.name}
          </text>
        </g>
      );

    case 'desks':
      return (
        <g>
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx}
            fill="#FEF3C7"
            stroke="#92400E"
            strokeWidth="1.5"
            rx="3"
          />
          {/* Laptop symbol */}
          <rect
            x={-14}
            y={-10}
            width="28"
            height="18"
            fill="#1E293B"
            rx="2"
          />
          <text
            x="0"
            y={halfD - 6}
            textAnchor="middle"
            className="text-[10px] font-sans font-medium fill-amber-900 pointer-events-none"
          >
            {item.name}
          </text>
        </g>
      );

    case 'seating':
      return (
        <g>
          <circle
            cx="0"
            cy="0"
            r={Math.min(halfW, halfD) * 0.9}
            fill="#E2E8F0"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Backrest curved arc */}
          <path
            d={`M ${-halfW * 0.7} ${-halfD * 0.3} Q 0 ${-halfD * 0.8} ${halfW * 0.7} ${-halfD * 0.3}`}
            fill="none"
            stroke="#1E293B"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="text-[9px] font-sans font-medium fill-slate-700 pointer-events-none"
          >
            {item.name}
          </text>
        </g>
      );

    case 'nightstands':
      return (
        <g>
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx}
            fill="#F8FAFC"
            stroke="#475569"
            strokeWidth="1.5"
            rx="2"
          />
          <circle cx="0" cy="0" r="4" fill="#D97706" />
          <text
            x="0"
            y={halfD - 4}
            textAnchor="middle"
            className="text-[8px] font-sans font-medium fill-slate-600 pointer-events-none"
          >
            Apoio
          </text>
        </g>
      );

    case 'decor':
      if (item.catalogId.includes('rug')) {
        return (
          <g>
            <rect
              x={-halfW}
              y={-halfD}
              width={wPx}
              height={dPx}
              fill="rgba(241, 245, 249, 0.7)"
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeDasharray="6 4"
              rx="4"
            />
            {/* Geometric diamond in center */}
            <polygon
              points={`0,${-halfD * 0.6} ${halfW * 0.6},0 0,${halfD * 0.6} ${-halfW * 0.6},0`}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              className="text-[10px] font-sans font-medium fill-slate-500 pointer-events-none"
            >
              {item.name}
            </text>
          </g>
        );
      }
      if (item.catalogId === 'plant-monstera') {
        return (
          <g>
            <circle cx="0" cy="0" r={halfW * 0.65} fill="#D1FAE5" stroke="#059669" strokeWidth="1.5" />
            {/* Leaves spokes */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={Math.cos((deg * Math.PI) / 180) * (halfW * 0.85)}
                y2={Math.sin((deg * Math.PI) / 180) * (halfW * 0.85)}
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      }
      return (
        <g>
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx}
            fill="#F3F4F6"
            stroke="#4B5563"
            strokeWidth="1.5"
            rx="2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            className="text-[9px] font-sans font-medium fill-slate-700 pointer-events-none"
          >
            {item.name}
          </text>
        </g>
      );

    default:
      return (
        <g>
          <rect
            x={-halfW}
            y={-halfD}
            width={wPx}
            height={dPx}
            fill="#F8FAFC"
            stroke="#334155"
            strokeWidth="1.5"
            rx="2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            className="text-[9px] font-sans font-medium fill-slate-700 pointer-events-none"
          >
            {item.name}
          </text>
        </g>
      );
  }
};
