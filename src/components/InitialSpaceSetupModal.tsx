/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Ruler, 
  DoorClosed, 
  Square, 
  Paintbrush, 
  Plus, 
  Trash2, 
  RotateCw, 
  Check, 
  Sliders,
  Maximize2
} from 'lucide-react';
import { 
  RoomDimensions, 
  RoomFinishes, 
  WallOpening, 
  WallSide, 
  FloorFinish 
} from '../types/bedroom';

interface InitialSpaceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensions: RoomDimensions;
  onSaveDimensions: (dims: RoomDimensions) => void;
  openings: WallOpening[];
  onSaveOpenings: (openings: WallOpening[]) => void;
  finishes: RoomFinishes;
  onSaveFinishes: (finishes: RoomFinishes) => void;
}

export const InitialSpaceSetupModal: React.FC<InitialSpaceSetupModalProps> = ({
  isOpen,
  onClose,
  dimensions,
  onSaveDimensions,
  openings,
  onSaveOpenings,
  finishes,
  onSaveFinishes,
}) => {
  const [activeTab, setActiveTab] = useState<'walls' | 'doors' | 'windows' | 'finishes'>('walls');

  // Local draft state so user can configure and confirm
  const [draftDims, setDraftDims] = useState<RoomDimensions>(dimensions);
  const [draftOpenings, setDraftOpenings] = useState<WallOpening[]>(openings);
  const [draftFinishes, setDraftFinishes] = useState<RoomFinishes>(finishes);

  // Sync draft state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftDims(dimensions);
      setDraftOpenings(openings);
      setDraftFinishes(finishes);
    }
  }, [isOpen, dimensions, openings, finishes]);

  if (!isOpen) return null;

  // Add new door
  const handleAddDoor = () => {
    const newDoor: WallOpening = {
      id: `door-${Date.now()}`,
      type: 'door',
      wall: 'south',
      offset: 0.5,
      width: 0.85,
      height: 2.1,
      swing: 'inward-right',
    };
    setDraftOpenings([...draftOpenings, newDoor]);
  };

  // Add new window
  const handleAddWindow = () => {
    const newWin: WallOpening = {
      id: `window-${Date.now()}`,
      type: 'window',
      wall: 'east',
      offset: 1.0,
      width: 1.5,
      height: 1.2,
      sillHeight: 1.0,
    };
    setDraftOpenings([...draftOpenings, newWin]);
  };

  const handleUpdateOpening = (id: string, updates: Partial<WallOpening>) => {
    setDraftOpenings(
      draftOpenings.map((op) => (op.id === id ? { ...op, ...updates } : op))
    );
  };

  const handleDeleteOpening = (id: string) => {
    setDraftOpenings(draftOpenings.filter((op) => op.id !== id));
  };

  // Save all and close
  const handleApply = () => {
    onSaveDimensions(draftDims);
    onSaveOpenings(draftOpenings);
    onSaveFinishes(draftFinishes);
    onClose();
  };

  const wallNames: { id: WallSide; label: string; orientation: string }[] = [
    { id: 'north', label: 'Parede Norte (Fundo)', orientation: 'Comprimento: ' + draftDims.width.toFixed(2) + 'm' },
    { id: 'south', label: 'Parede Sul (Frente)', orientation: 'Comprimento: ' + draftDims.width.toFixed(2) + 'm' },
    { id: 'west', label: 'Parede Oeste (Esquerda)', orientation: 'Comprimento: ' + draftDims.length.toFixed(2) + 'm' },
    { id: 'east', label: 'Parede Leste (Direita)', orientation: 'Comprimento: ' + draftDims.length.toFixed(2) + 'm' },
  ];

  const floorOptions: { id: FloorFinish; label: string }[] = [
    { id: 'light-oak', label: 'Carvalho Claro (Laminado)' },
    { id: 'dark-walnut', label: 'Nogueira Escura (Madeira)' },
    { id: 'herringbone', label: 'Taco Espinha de Peixe' },
    { id: 'beige-travertine', label: 'Porcelanato Travertino' },
    { id: 'concrete-gray', label: 'Cimento Queimado' },
    { id: 'cozy-carpet', label: 'Carpete Texturizado' },
  ];

  const doorsList = draftOpenings.filter((o) => o.type === 'door');
  const windowsList = draftOpenings.filter((o) => o.type === 'window');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-slate-900 dark:text-white" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Personalizar Espaço Inicial do Quarto
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Defina as medidas reais de paredes, portas e janelas antes de mobiliar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 gap-2">
          <button
            onClick={() => setActiveTab('walls')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'walls'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Paredes & Dimensões</span>
          </button>
          <button
            onClick={() => setActiveTab('doors')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'doors'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>2. Portas ({doorsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'windows'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>3. Janelas ({windowsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('finishes')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'finishes'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>4. Acabamentos</span>
          </button>
        </div>

        {/* Tab 1: Walls and Dimensions */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'walls' && (
            <div className="space-y-6">
              {/* Dimensions inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Largura do Quarto (X)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="2.0"
                      max="10.0"
                      value={draftDims.width}
                      onChange={(e) =>
                        setDraftDims({ ...draftDims, width: parseFloat(e.target.value) || 2.5 })
                      }
                      className="w-full text-base font-bold font-mono p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-slate-900 text-slate-900 dark:text-white"
                    />
                    <span className="font-mono text-slate-500 text-sm">metros</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Paredes Norte e Sul
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Comprimento do Quarto (Z)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="2.0"
                      max="10.0"
                      value={draftDims.length}
                      onChange={(e) =>
                        setDraftDims({ ...draftDims, length: parseFloat(e.target.value) || 2.5 })
                      }
                      className="w-full text-base font-bold font-mono p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-slate-900 text-slate-900 dark:text-white"
                    />
                    <span className="font-mono text-slate-500 text-sm">metros</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Paredes Leste e Oeste
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Pé-direito (Altura Y)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="2.2"
                      max="4.0"
                      value={draftDims.height}
                      onChange={(e) =>
                        setDraftDims({ ...draftDims, height: parseFloat(e.target.value) || 2.6 })
                      }
                      className="w-full text-base font-bold font-mono p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-slate-900 text-slate-900 dark:text-white"
                    />
                    <span className="font-mono text-slate-500 text-sm">metros</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Altura do chão ao teto
                  </span>
                </div>
              </div>

              {/* Schematic mini plan preview */}
              <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <span className="text-[11px] font-mono text-slate-500 mb-2">
                  Esquema das Paredes · Norte ↑
                </span>

                <div
                  className="relative bg-white dark:bg-slate-900 border-4 border-slate-700 dark:border-slate-500 flex items-center justify-center shadow-md"
                  style={{
                    width: Math.min(320, draftDims.width * 55),
                    height: Math.min(240, draftDims.length * 55),
                  }}
                >
                  <div className="text-center font-mono p-2">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {(draftDims.width * draftDims.length).toFixed(2)} m²
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {draftDims.width.toFixed(2)}m × {draftDims.length.toFixed(2)}m
                    </div>
                  </div>

                  {/* Wall dimension badges on preview */}
                  <span className="absolute -top-6 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    Norte: {draftDims.width.toFixed(2)}m
                  </span>
                  <span className="absolute -bottom-6 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    Sul: {draftDims.width.toFixed(2)}m
                  </span>
                  <span className="absolute -left-12 rotate-[-90deg] text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    Oeste: {draftDims.length.toFixed(2)}m
                  </span>
                  <span className="absolute -right-12 rotate-90 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    Leste: {draftDims.length.toFixed(2)}m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Doors */}
          {activeTab === 'doors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Portas do Quarto
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Inclua a porta principal de entrada, porta de suíte/banheiro ou sacada.
                  </p>
                </div>
                <button
                  onClick={handleAddDoor}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Porta</span>
                </button>
              </div>

              {doorsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                  <DoorClosed className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhuma porta configurada.</p>
                  <button
                    onClick={handleAddDoor}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Adicionar uma porta agora
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {doorsList.map((door, idx) => (
                    <div
                      key={door.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <DoorClosed className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                          <span>Porta #{idx + 1}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteOpening(door.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded"
                          title="Excluir Porta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Wall Side */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Parede:</label>
                          <select
                            value={door.wall}
                            onChange={(e) =>
                              handleUpdateOpening(door.id, { wall: e.target.value as WallSide })
                            }
                            className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          >
                            <option value="south">Parede Sul (Frente)</option>
                            <option value="north">Parede Norte (Fundo)</option>
                            <option value="west">Parede Oeste (Esquerda)</option>
                            <option value="east">Parede Leste (Direita)</option>
                          </select>
                        </div>

                        {/* Position / Offset along wall */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            Posição na Parede (m):
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="6.0"
                            value={door.offset}
                            onChange={(e) =>
                              handleUpdateOpening(door.id, {
                                offset: parseFloat(e.target.value) || 0.3,
                              })
                            }
                            className="w-full p-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                        </div>

                        {/* Door Width */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            Largura da Folha (m):
                          </label>
                          <select
                            value={door.width}
                            onChange={(e) =>
                              handleUpdateOpening(door.id, {
                                width: parseFloat(e.target.value) || 0.85,
                              })
                            }
                            className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                          >
                            <option value="0.70">0.70 m (Compacta / Banheiro)</option>
                            <option value="0.80">0.80 m (Padrão Quarto)</option>
                            <option value="0.85">0.85 m (Conforto)</option>
                            <option value="0.90">0.90 m (Acessibilidade)</option>
                            <option value="1.00">1.00 m (Ampla)</option>
                          </select>
                        </div>

                        {/* Swing Direction */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Abertura:</label>
                          <select
                            value={door.swing || 'inward-right'}
                            onChange={(e) =>
                              handleUpdateOpening(door.id, {
                                swing: e.target.value as WallOpening['swing'],
                              })
                            }
                            className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          >
                            <option value="inward-right">Para dentro (Direita)</option>
                            <option value="inward-left">Para dentro (Esquerda)</option>
                            <option value="outward-right">Para fora (Direita)</option>
                            <option value="outward-left">Para fora (Esquerda)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Windows */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Janelas do Quarto
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Configure a iluminação natural, ventilação e peitoril de cada janela.
                  </p>
                </div>
                <button
                  onClick={handleAddWindow}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Janela</span>
                </button>
              </div>

              {windowsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                  <Square className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhuma janela configurada.</p>
                  <button
                    onClick={handleAddWindow}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Adicionar janela
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {windowsList.map((win, idx) => (
                    <div
                      key={win.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Square className="w-4 h-4 text-blue-600" />
                          <span>Janela #{idx + 1}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteOpening(win.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded"
                          title="Excluir Janela"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Wall Side */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Parede:</label>
                          <select
                            value={win.wall}
                            onChange={(e) =>
                              handleUpdateOpening(win.id, { wall: e.target.value as WallSide })
                            }
                            className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          >
                            <option value="east">Parede Leste (Direita)</option>
                            <option value="north">Parede Norte (Fundo)</option>
                            <option value="west">Parede Oeste (Esquerda)</option>
                            <option value="south">Parede Sul (Frente)</option>
                          </select>
                        </div>

                        {/* Position along wall */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            Posição na Parede (m):
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="6.0"
                            value={win.offset}
                            onChange={(e) =>
                              handleUpdateOpening(win.id, {
                                offset: parseFloat(e.target.value) || 0.5,
                              })
                            }
                            className="w-full p-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                        </div>

                        {/* Window Width */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            Largura da Janela (m):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.6"
                            max="4.0"
                            value={win.width}
                            onChange={(e) =>
                              handleUpdateOpening(win.id, {
                                width: parseFloat(e.target.value) || 1.2,
                              })
                            }
                            className="w-full p-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                        </div>

                        {/* Sill Height */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            Peitoril (Altura do Piso):
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="1.8"
                            value={win.sillHeight ?? 1.0}
                            onChange={(e) =>
                              handleUpdateOpening(win.id, {
                                sillHeight: parseFloat(e.target.value) || 1.0,
                              })
                            }
                            className="w-full p-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Finishes */}
          {activeTab === 'finishes' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  Piso e Revestimento
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {floorOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDraftFinishes({ ...draftFinishes, floorType: opt.id })}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        draftFinishes.floorType === opt.id
                          ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 font-medium'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {draftFinishes.floorType === opt.id && (
                        <Check className="w-4 h-4 text-slate-900 dark:text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  Cor das Paredes
                </h4>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draftFinishes.wallColor}
                    onChange={(e) =>
                      setDraftFinishes({ ...draftFinishes, wallColor: e.target.value })
                    }
                    className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-mono text-xs">{draftFinishes.wallColor}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Clique no seletor para escolher qualquer tonalidade de tinta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {draftDims.width.toFixed(2)}m × {draftDims.length.toFixed(2)}m ·{' '}
            {(draftDims.width * draftDims.length).toFixed(1)} m²
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Medidas & Construir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
