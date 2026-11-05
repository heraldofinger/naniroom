/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RoomDimensions, 
  RoomFinishes, 
  WallOpening, 
  FurnitureItem, 
  CatalogItem, 
  RoomPreset 
} from './types/bedroom';
import { ROOM_PRESETS } from './data/roomPresets';
import { analyzeRoomErgonomics } from './utils/ergonomics';
import { TopNavbar, ViewMode } from './components/TopNavbar';
import { CatalogSidebar } from './components/CatalogSidebar';
import { Bedroom2DPlan } from './components/Bedroom2DPlan';
import { Bedroom3DView } from './components/Bedroom3DView';
import { ItemInspector } from './components/ItemInspector';
import { BudgetModal } from './components/BudgetModal';
import { ExportModal } from './components/ExportModal';
import { InitialSpaceSetupModal } from './components/InitialSpaceSetupModal';

const STORAGE_KEY = 'quartocraft_project_v1';

export default function App() {
  // Initial state from first preset (Master Bedroom) or localStorage
  const initialPreset = ROOM_PRESETS[0];

  const [dimensions, setDimensions] = useState<RoomDimensions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).dimensions;
    } catch {}
    return initialPreset.roomDimensions;
  });

  const [finishes, setFinishes] = useState<RoomFinishes>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).finishes;
    } catch {}
    return initialPreset.finishes;
  });

  const [openings, setOpenings] = useState<WallOpening[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).openings;
    } catch {}
    return initialPreset.openings;
  });

  const [furniture, setFurniture] = useState<FurnitureItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).furniture;
    } catch {}
    return initialPreset.furniture;
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [showClearances, setShowClearances] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Modals
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [initialSetupModalOpen, setInitialSetupModalOpen] = useState(false);

  // History for Undo / Redo
  const [history, setHistory] = useState<FurnitureItem[][]>([initialPreset.furniture]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync dark class on root document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Persist project changes to LocalStorage
  useEffect(() => {
    try {
      const data = { dimensions, finishes, openings, furniture };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [dimensions, finishes, openings, furniture]);

  // Push new history state
  const pushHistory = useCallback(
    (newFurniture: FurnitureItem[]) => {
      setFurniture(newFurniture);
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(newFurniture);
      // Keep maximum 25 history steps
      if (newHist.length > 25) newHist.shift();
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    },
    [history, historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setFurniture(prev);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setFurniture(next);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          pushHistory(furniture.filter((item) => item.id !== selectedItemId));
          setSelectedItemId(null);
        }
      } else if (e.key === 'Escape') {
        setSelectedItemId(null);
      } else if (e.key.toLowerCase() === 'r' && selectedItemId) {
        const item = furniture.find((f) => f.id === selectedItemId);
        if (item && !item.locked) {
          pushHistory(
            furniture.map((f) =>
              f.id === selectedItemId ? { ...f, rotation: (f.rotation + 90) % 360 } : f
            )
          );
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, furniture, pushHistory, handleUndo, handleRedo]);

  // Add item from catalog
  const handleAddFurniture = (catItem: CatalogItem) => {
    // Find a free spot in center of room
    const newItem: FurnitureItem = {
      id: `item-${Date.now()}`,
      catalogId: catItem.id,
      name: catItem.namePt,
      category: catItem.category,
      x: 0,
      z: 0,
      y: catItem.id === 'tv-wall' || catItem.id === 'wall-art' ? 1.0 : 0,
      width: catItem.defaultDimensions.width,
      depth: catItem.defaultDimensions.depth,
      height: catItem.defaultDimensions.height,
      rotation: 0,
      color: catItem.defaultColor,
      secondaryColor: catItem.defaultSecondaryColor,
    };

    pushHistory([...furniture, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Duplicate item
  const handleDuplicateItem = (item: FurnitureItem) => {
    const newItem: FurnitureItem = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Cópia)`,
      x: Math.min(dimensions.width / 2 - 0.4, item.x + 0.25),
      z: Math.min(dimensions.length / 2 - 0.4, item.z + 0.25),
    };
    pushHistory([...furniture, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    pushHistory(furniture.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // Load Preset
  const handleLoadPreset = (preset: RoomPreset) => {
    setDimensions(preset.roomDimensions);
    setFinishes(preset.finishes);
    setOpenings(preset.openings);
    pushHistory(preset.furniture);
    setSelectedItemId(null);
  };

  // Import custom layout
  const handleImportLayout = (data: {
    dimensions: RoomDimensions;
    finishes: RoomFinishes;
    openings: WallOpening[];
    furniture: FurnitureItem[];
  }) => {
    setDimensions(data.dimensions);
    setFinishes(data.finishes);
    setOpenings(data.openings);
    pushHistory(data.furniture);
    setSelectedItemId(null);
  };

  // Real-time ergonomics metrics calculation
  const roomMetrics = useMemo(
    () => analyzeRoomErgonomics(dimensions, furniture, openings),
    [dimensions, furniture, openings]
  );

  const selectedItem = furniture.find((f) => f.id === selectedItemId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased">
      {/* Top Bar Contract (Wordmark, Nav/View links, Primary CTA) */}
      <TopNavbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenInitialSetup={() => setInitialSetupModalOpen(true)}
        onOpenBudget={() => setBudgetModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
      />

      {/* Main Studio Body Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Furniture Catalog & Room Architecture Sidebar */}
        <CatalogSidebar
          dimensions={dimensions}
          onUpdateDimensions={setDimensions}
          finishes={finishes}
          onUpdateFinishes={setFinishes}
          openings={openings}
          onUpdateOpenings={setOpenings}
          onAddFurniture={handleAddFurniture}
          onLoadPreset={handleLoadPreset}
          onOpenInitialSetup={() => setInitialSetupModalOpen(true)}
        />

        {/* Central Viewport Area (2D, 3D, or Split Screen) */}
        <main className="flex-1 min-w-0 h-full relative overflow-hidden flex">
          {/* View Mode: 2D Blueprint Only */}
          {viewMode === '2d' && (
            <div className="w-full h-full relative">
              <Bedroom2DPlan
                dimensions={dimensions}
                furniture={furniture}
                openings={openings}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onUpdateFurniture={pushHistory}
                onUpdateOpenings={setOpenings}
                onOpenInitialSetup={() => setInitialSetupModalOpen(true)}
                showClearances={showClearances}
                onToggleClearances={() => setShowClearances((s) => !s)}
                snapToGrid={snapToGrid}
                onToggleSnap={() => setSnapToGrid((s) => !s)}
              />
            </div>
          )}

          {/* View Mode: 3D Room Viewer Only */}
          {viewMode === '3d' && (
            <div className="w-full h-full relative">
              <Bedroom3DView
                dimensions={dimensions}
                finishes={finishes}
                openings={openings}
                furniture={furniture}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onUpdateFurniture={pushHistory}
              />
            </div>
          )}

          {/* View Mode: Split Screen (2D Blueprint on left + 3D on right) */}
          {viewMode === 'split' && (
            <div className="w-full h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                <Bedroom2DPlan
                  dimensions={dimensions}
                  furniture={furniture}
                  openings={openings}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUpdateFurniture={pushHistory}
                  onUpdateOpenings={setOpenings}
                  onOpenInitialSetup={() => setInitialSetupModalOpen(true)}
                  showClearances={showClearances}
                  onToggleClearances={() => setShowClearances((s) => !s)}
                  snapToGrid={snapToGrid}
                  onToggleSnap={() => setSnapToGrid((s) => !s)}
                />
              </div>
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                <Bedroom3DView
                  dimensions={dimensions}
                  finishes={finishes}
                  openings={openings}
                  furniture={furniture}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUpdateFurniture={pushHistory}
                />
              </div>
            </div>
          )}
        </main>

        {/* Right Inspector & Ergonomics Diagnostics Panel */}
        <ItemInspector
          selectedItem={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onUpdateItem={(updated) =>
            pushHistory(furniture.map((f) => (f.id === updated.id ? updated : f)))
          }
          onDuplicateItem={handleDuplicateItem}
          onDeleteItem={handleDeleteItem}
          roomMetrics={roomMetrics}
          dimensions={dimensions}
          furnitureCount={furniture.length}
        />
      </div>

      {/* Modals */}
      <InitialSpaceSetupModal
        isOpen={initialSetupModalOpen}
        onClose={() => setInitialSetupModalOpen(false)}
        dimensions={dimensions}
        onSaveDimensions={setDimensions}
        openings={openings}
        onSaveOpenings={setOpenings}
        finishes={finishes}
        onSaveFinishes={setFinishes}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        furniture={furniture}
        dimensions={dimensions}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        dimensions={dimensions}
        finishes={finishes}
        openings={openings}
        furniture={furniture}
        onImportLayout={handleImportLayout}
      />
    </div>
  );
}
