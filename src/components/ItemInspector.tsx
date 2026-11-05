/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  RotateCw, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Sparkles,
  Move
} from 'lucide-react';
import { FurnitureItem, RoomDimensions } from '../types/bedroom';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';
import { RoomMetrics } from '../utils/ergonomics';

interface ItemInspectorProps {
  selectedItem: FurnitureItem | null;
  onClose: () => void;
  onUpdateItem: (updated: FurnitureItem) => void;
  onDuplicateItem: (item: FurnitureItem) => void;
  onDeleteItem: (id: string) => void;
  roomMetrics: RoomMetrics;
  dimensions: RoomDimensions;
  furnitureCount: number;
}

export const ItemInspector: React.FC<ItemInspectorProps> = ({
  selectedItem,
  onClose,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  roomMetrics,
  dimensions,
  furnitureCount,
}) => {
  // Find catalog item to read available color swatches & ergonomics tips
  const catalogDef = selectedItem
    ? FURNITURE_CATALOG.find((c) => c.id === selectedItem.catalogId)
    : null;

  return (
    <div className="w-72 md:w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      {selectedItem ? (
        <div className="p-4 space-y-4 text-xs">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Propriedades do Móvel
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedItem.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => onUpdateItem({ ...selectedItem, rotation: (selectedItem.rotation + 90) % 360 })}
              className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-[10px]"
              title="Girar 90°"
            >
              <RotateCw className="w-3.5 h-3.5 mb-0.5" />
              <span>Girar</span>
            </button>
            <button
              onClick={() => onDuplicateItem(selectedItem)}
              className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-[10px]"
              title="Duplicar"
            >
              <Copy className="w-3.5 h-3.5 mb-0.5" />
              <span>Copiar</span>
            </button>
            <button
              onClick={() => onUpdateItem({ ...selectedItem, locked: !selectedItem.locked })}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded transition-colors text-[10px] ${
                selectedItem.locked
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Travar Posição"
            >
              {selectedItem.locked ? (
                <Lock className="w-3.5 h-3.5 mb-0.5 text-amber-600" />
              ) : (
                <Unlock className="w-3.5 h-3.5 mb-0.5" />
              )}
              <span>{selectedItem.locked ? 'Travado' : 'Mover'}</span>
            </button>
            <button
              onClick={() => onDeleteItem(selectedItem.id)}
              className="flex flex-col items-center justify-center py-1.5 px-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors text-[10px]"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5 mb-0.5" />
              <span>Excluir</span>
            </button>
          </div>

          {/* Position Coordinates (X & Z) */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Move className="w-3.5 h-3.5" />
              <span>Posicionamento no Piso</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">X (Eixo L/O):</span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedItem.x.toFixed(2)} m
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono">Z (Eixo N/S):</span>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedItem.z.toFixed(2)} m
                </div>
              </div>
            </div>
          </div>

          {/* Rotation Angle Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-600 dark:text-slate-400">Ângulo de Rotação:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {selectedItem.rotation}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="355"
              step="5"
              value={selectedItem.rotation}
              onChange={(e) =>
                onUpdateItem({ ...selectedItem, rotation: parseInt(e.target.value) })
              }
              className="w-full accent-slate-900 dark:accent-slate-100 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <button
                onClick={() => onUpdateItem({ ...selectedItem, rotation: 0 })}
                className="hover:text-slate-900"
              >
                0°
              </button>
              <button
                onClick={() => onUpdateItem({ ...selectedItem, rotation: 90 })}
                className="hover:text-slate-900"
              >
                90°
              </button>
              <button
                onClick={() => onUpdateItem({ ...selectedItem, rotation: 180 })}
                className="hover:text-slate-900"
              >
                180°
              </button>
              <button
                onClick={() => onUpdateItem({ ...selectedItem, rotation: 270 })}
                className="hover:text-slate-900"
              >
                270°
              </button>
            </div>
          </div>

          {/* Dimensions Customizer */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
              Dimensões da Peça (m)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Largura:</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.2"
                  max="3.5"
                  value={selectedItem.width}
                  onChange={(e) =>
                    onUpdateItem({ ...selectedItem, width: parseFloat(e.target.value) || 0.5 })
                  }
                  className="w-full p-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Profund.:</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.2"
                  max="3.5"
                  value={selectedItem.depth}
                  onChange={(e) =>
                    onUpdateItem({ ...selectedItem, depth: parseFloat(e.target.value) || 0.5 })
                  }
                  className="w-full p-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Altura:</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.02"
                  max="2.8"
                  value={selectedItem.height}
                  onChange={(e) =>
                    onUpdateItem({ ...selectedItem, height: parseFloat(e.target.value) || 0.5 })
                  }
                  className="w-full p-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color & Material Finishes Swatches */}
          {catalogDef && catalogDef.availableColors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Acabamento / Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {catalogDef.availableColors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => onUpdateItem({ ...selectedItem, color: c.hex })}
                    className={`flex items-center gap-1.5 p-1 px-2 rounded-md border text-[11px] transition-all ${
                      selectedItem.color === c.hex
                        ? 'border-slate-900 dark:border-white shadow-2xs font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Architectural Recommendation Note */}
          {catalogDef?.clearanceNote && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Recomendação de Circulação</span>
              </div>
              <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                {catalogDef.clearanceNote}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State / Room Ergonomics Diagnostic Overview */
        <div className="p-4 space-y-4 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Diagnóstico do Ambiente
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Consultor de Ergonomia
            </h3>
          </div>

          {/* Area KPI breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Área do Quarto</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                {roomMetrics.totalArea} m²
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                {dimensions.width}m × {dimensions.length}m
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Área Livre</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {roomMetrics.freeArea} m²
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                {100 - roomMetrics.occupancyPercentage}% de circulação
              </span>
            </div>
          </div>

          {/* Occupancy Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-600 dark:text-slate-400">Ocupação do Piso:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {roomMetrics.occupancyPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  roomMetrics.isCrowded ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, roomMetrics.occupancyPercentage)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Faixa ideal para quartos: 30% a 42% de móveis.
            </div>
          </div>

          {/* Ergonomics Issues & Warnings */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <span>Alertas de Passagem ({roomMetrics.issues.length})</span>
            </h4>

            {roomMetrics.issues.length === 0 ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Layout Fluido & Ergonômico</span>
                </div>
                <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                  Nenhuma obstrução de portas ou colisões detectadas. O quarto tem boa circulação!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {roomMetrics.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-2.5 rounded-lg border text-[11px] ${
                      issue.type === 'error'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : issue.type === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      {issue.type === 'error' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : issue.type === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                      <span>{issue.title}</span>
                    </div>
                    <p className="mt-1 leading-relaxed opacity-90">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Dica: Clique em qualquer móvel na planta 2D ou na visualização 3D para editar suas dimensões, cor ou rotação.
          </div>
        </div>
      )}
    </div>
  );
};
