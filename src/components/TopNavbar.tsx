/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  SquareDashedBottom, 
  Box, 
  Columns, 
  Coins, 
  Activity, 
  Download, 
  RotateCcw, 
  RotateCw, 
  Moon, 
  Sun 
} from 'lucide-react';

export type ViewMode = '2d' | '3d' | 'split';

interface TopNavbarProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenInitialSetup: () => void;
  onOpenBudget: () => void;
  onOpenExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  viewMode,
  onChangeViewMode,
  onOpenInitialSetup,
  onOpenBudget,
  onOpenExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none shrink-0 z-30">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          Nani Room
        </a>
      </div>

      {/* Zone 2: Viewport Mode Tabs & Tools */}
      <nav className="flex items-center gap-2">
        {/* Quick Room Dimensions Wizard trigger */}
        <button
          onClick={onOpenInitialSetup}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-md transition-colors whitespace-nowrap shrink-0 border border-slate-300/80 dark:border-slate-700 cursor-pointer"
          title="Personalizar medidas das paredes, portas e janelas"
        >
          <span>Medidas do Quarto</span>
        </button>

        {/* Segmented View Mode Controller */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => onChangeViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              viewMode === '2d'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SquareDashedBottom className="w-3.5 h-3.5" />
            <span>Planta 2D</span>
          </button>
          <button
            onClick={() => onChangeViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              viewMode === '3d'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Visualização 3D</span>
          </button>
          <button
            onClick={() => onChangeViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              viewMode === 'split'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dividido (2D + 3D)</span>
          </button>
        </div>

        {/* Action modal triggers */}
        <button
          onClick={onOpenBudget}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          <span>Orçamento & Peças</span>
        </button>

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5 ml-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
            title="Desfazer (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded transition-colors"
            title="Refazer (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Dark Mode toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          title={isDark ? 'Tema Claro' : 'Tema Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>

      {/* Zone 3: 1 Primary CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Projeto</span>
        </button>
      </div>
    </header>
  );
};
