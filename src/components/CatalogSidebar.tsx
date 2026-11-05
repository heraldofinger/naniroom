/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  LayoutTemplate, 
  Settings2, 
  Bed, 
  DoorClosed, 
  Sliders, 
  Paintbrush, 
  Square,
  Sparkles,
  Ruler,
  Trash2,
  ArrowLeftRight
} from 'lucide-react';
import { 
  CatalogItem, 
  FurnitureCategory, 
  FurnitureItem, 
  RoomDimensions, 
  RoomFinishes, 
  FloorFinish, 
  RoomPreset, 
  WallOpening,
  WallSide 
} from '../types/bedroom';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';
import { ROOM_PRESETS } from '../data/roomPresets';

interface CatalogSidebarProps {
  dimensions: RoomDimensions;
  onUpdateDimensions: (dims: RoomDimensions) => void;
  finishes: RoomFinishes;
  onUpdateFinishes: (finishes: RoomFinishes) => void;
  openings: WallOpening[];
  onUpdateOpenings: (openings: WallOpening[]) => void;
  onAddFurniture: (item: CatalogItem) => void;
  onLoadPreset: (preset: RoomPreset) => void;
  onOpenInitialSetup?: () => void;
}

export const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
  dimensions,
  onUpdateDimensions,
  finishes,
  onUpdateFinishes,
  openings,
  onUpdateOpenings,
  onAddFurniture,
  onLoadPreset,
  onOpenInitialSetup,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'presets' | 'room'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');

  const categories: { id: FurnitureCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'beds', label: 'Camas' },
    { id: 'wardrobes', label: 'Armários' },
    { id: 'desks', label: 'Escritório' },
    { id: 'nightstands', label: 'Cabeceira' },
    { id: 'seating', label: 'Assentos' },
    { id: 'storage', label: 'Módulos' },
    { id: 'decor', label: 'Decoração' },
    { id: 'lighting', label: 'Iluminação' },
  ];

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.namePt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionPt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const wallColors = [
    { label: 'Branco Giz', hex: '#F8FAFC' },
    { label: 'Areia Suave', hex: '#F5F3EF' },
    { label: 'Cinza Nórdico', hex: '#E5E7EB' },
    { label: 'Verde Sálvia', hex: '#E2E8DF' },
    { label: 'Terracota Warm', hex: '#EBDCD5' },
    { label: 'Azul Acinzentado', hex: '#DCE4EC' },
    { label: 'Chumbo Profundo', hex: '#334155' },
  ];

  const floorOptions: { id: FloorFinish; label: string; desc: string }[] = [
    { id: 'light-oak', label: 'Carvalho Claro', desc: 'Madeira clara escandinava' },
    { id: 'dark-walnut', label: 'Nogueira Escura', desc: 'Madeira nobre aconchegante' },
    { id: 'herringbone', label: 'Taco Espinha de Peixe', desc: 'Parquet clássico elegante' },
    { id: 'beige-travertine', label: 'Travertino Bege', desc: 'Pedra natural contemporânea' },
    { id: 'concrete-gray', label: 'Cimento Queimado', desc: 'Visual urbano moderno' },
    { id: 'cozy-carpet', label: 'Carpete Macio', desc: 'Conforto acústico e térmico' },
  ];

  // Helper to add new door
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
    onUpdateOpenings([...openings, newDoor]);
  };

  // Helper to add new window
  const handleAddWindow = () => {
    const newWin: WallOpening = {
      id: `win-${Date.now()}`,
      type: 'window',
      wall: 'east',
      offset: 1.0,
      width: 1.5,
      height: 1.2,
      sillHeight: 1.0,
    };
    onUpdateOpenings([...openings, newWin]);
  };

  const handleUpdateOpening = (id: string, updates: Partial<WallOpening>) => {
    onUpdateOpenings(
      openings.map((op) => (op.id === id ? { ...op, ...updates } : op))
    );
  };

  const handleDeleteOpening = (id: string) => {
    onUpdateOpenings(openings.filter((op) => op.id !== id));
  };

  const doorsList = openings.filter((o) => o.type === 'door');
  const windowsList = openings.filter((o) => o.type === 'window');

  return (
    <aside className="w-80 md:w-96 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      {/* Top Tabs */}
      <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 gap-1">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'catalog'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          <span>Móveis</span>
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'presets'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Modelos</span>
        </button>
        <button
          onClick={() => setActiveTab('room')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'room'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Espaço</span>
        </button>
      </div>

      {/* Tab 1: Furniture Catalog */}
      {activeTab === 'catalog' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cama, armário, escrivaninha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg shadow-2xs transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.namePt}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {item.descriptionPt}
                    </p>
                  </div>
                  <button
                    onClick={() => onAddFurniture(item)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-md shrink-0 transition-colors shadow-2xs cursor-pointer"
                    title="Adicionar ao quarto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Dimensions and price footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 font-mono">
                  <span>
                    {item.defaultDimensions.width.toFixed(2)}m × {item.defaultDimensions.depth.toFixed(2)}m
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    R$ {item.priceEstimate.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}

            {filteredCatalog.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                Nenhum móvel encontrado para essa busca.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Pre-configured Room Presets */}
      {activeTab === 'presets' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspire-se ou carregue uma disposição pré-calculada com ergonomia testada:
          </p>
          {ROOM_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onLoadPreset(preset)}
              className="p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                  {preset.name}
                </h4>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {preset.subtitle}
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>{preset.furniture.length} móveis inclusos</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Carregar layout →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Room Dimensions & Architecture Settings */}
      {activeTab === 'room' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Prominent Initial Space Setup Wizard Banner */}
          {onOpenInitialSetup && (
            <button
              onClick={onOpenInitialSetup}
              className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg shadow-sm transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Ruler className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Assistente de Medidas Iniciais</div>
                  <div className="text-[10px] opacity-80">
                    Definir paredes, portas e janelas
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold">Abrir →</span>
            </button>
          )}

          {/* Wall Dimensions Inputs */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Dimensões das Paredes</span>
            </h4>

            {/* Width */}
            <div>
              <div className="flex items-center justify-between font-mono mb-1 text-[11px]">
                <span className="text-slate-500">Largura (Norte / Sul):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {dimensions.width.toFixed(2)} m
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.05"
                value={dimensions.width}
                onChange={(e) =>
                  onUpdateDimensions({ ...dimensions, width: parseFloat(e.target.value) })
                }
                className="w-full accent-slate-900 dark:accent-slate-100 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Length */}
            <div>
              <div className="flex items-center justify-between font-mono mb-1 text-[11px]">
                <span className="text-slate-500">Comprimento (Leste / Oeste):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {dimensions.length.toFixed(2)} m
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.05"
                value={dimensions.length}
                onChange={(e) =>
                  onUpdateDimensions({ ...dimensions, length: parseFloat(e.target.value) })
                }
                className="w-full accent-slate-900 dark:accent-slate-100 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Ceiling Height */}
            <div>
              <div className="flex items-center justify-between font-mono mb-1 text-[11px]">
                <span className="text-slate-500">Pé-direito (Altura):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {dimensions.height.toFixed(2)} m
                </span>
              </div>
              <input
                type="range"
                min="2.2"
                max="3.8"
                step="0.05"
                value={dimensions.height}
                onChange={(e) =>
                  onUpdateDimensions({ ...dimensions, height: parseFloat(e.target.value) })
                }
                className="w-full accent-slate-900 dark:accent-slate-100 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px] flex justify-between">
              <span>Área Total do Quarto:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {(dimensions.width * dimensions.length).toFixed(1)} m²
              </span>
            </div>
          </div>

          {/* Doors Management Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Portas ({doorsList.length})</span>
              </h4>
              <button
                onClick={handleAddDoor}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar</span>
              </button>
            </div>

            {doorsList.map((door, idx) => (
              <div
                key={door.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span>Porta #{idx + 1} ({door.width}m)</span>
                  <button
                    onClick={() => handleDeleteOpening(door.id)}
                    className="text-rose-500 hover:text-rose-700 p-0.5"
                    title="Excluir porta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Parede:</label>
                    <select
                      value={door.wall}
                      onChange={(e) =>
                        handleUpdateOpening(door.id, { wall: e.target.value as WallSide })
                      }
                      className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                    >
                      <option value="south">Sul (Frente)</option>
                      <option value="north">Norte (Fundo)</option>
                      <option value="west">Oeste (Esquerda)</option>
                      <option value="east">Leste (Direita)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-0.5">Posição (m):</label>
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
                      className="w-full p-1 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Windows Management Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5" />
                <span>Janelas ({windowsList.length})</span>
              </h4>
              <button
                onClick={handleAddWindow}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar</span>
              </button>
            </div>

            {windowsList.map((win, idx) => (
              <div
                key={win.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span>Janela #{idx + 1} ({win.width}m)</span>
                  <button
                    onClick={() => handleDeleteOpening(win.id)}
                    className="text-rose-500 hover:text-rose-700 p-0.5"
                    title="Excluir janela"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Parede:</label>
                    <select
                      value={win.wall}
                      onChange={(e) =>
                        handleUpdateOpening(win.id, { wall: e.target.value as WallSide })
                      }
                      className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                    >
                      <option value="east">Leste (Direita)</option>
                      <option value="north">Norte (Fundo)</option>
                      <option value="west">Oeste (Esquerda)</option>
                      <option value="south">Sul (Frente)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-0.5">Largura (m):</label>
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
                      className="w-full p-1 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Wall Paint Swatches */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Pintura das Paredes</span>
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {wallColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => onUpdateFinishes({ ...finishes, wallColor: color.hex })}
                  className={`flex flex-col items-center gap-1 p-1 rounded-md border text-[10px] transition-all ${
                    finishes.wallColor === color.hex
                      ? 'border-slate-900 dark:border-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded border border-black/10 shadow-inner"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="truncate w-full text-center text-slate-600 dark:text-slate-400">
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Floor Finish Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5" />
              <span>Piso do Quarto</span>
            </h4>
            <div className="space-y-1.5">
              {floorOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateFinishes({ ...finishes, floorType: opt.id })}
                  className={`w-full text-left p-2 rounded-md border text-xs transition-all flex items-center justify-between ${
                    finishes.floorType === opt.id
                      ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-800 font-medium'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-slate-900 dark:text-slate-100">{opt.label}</div>
                    <div className="text-[10px] text-slate-500">{opt.desc}</div>
                  </div>
                  {finishes.floorType === opt.id && (
                    <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
