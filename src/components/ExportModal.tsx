/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { 
  X, 
  FileDown, 
  FileUp, 
  Image as ImageIcon, 
  Camera, 
  Check, 
  Layers 
} from 'lucide-react';
import { FurnitureItem, RoomDimensions, RoomFinishes, WallOpening } from '../types/bedroom';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensions: RoomDimensions;
  finishes: RoomFinishes;
  openings: WallOpening[];
  furniture: FurnitureItem[];
  onImportLayout: (data: {
    dimensions: RoomDimensions;
    finishes: RoomFinishes;
    openings: WallOpening[];
    furniture: FurnitureItem[];
  }) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dimensions,
  finishes,
  openings,
  furniture,
  onImportLayout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedJson, setCopiedJson] = React.useState(false);

  if (!isOpen) return null;

  // Download project as JSON file
  const handleDownloadJson = () => {
    const projectData = {
      version: '1.0',
      appName: 'QuartoCraft 3D',
      createdAt: new Date().toISOString(),
      dimensions,
      finishes,
      openings,
      furniture,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quarto-layout-${dimensions.width}x${dimensions.length}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    const projectData = {
      version: '1.0',
      dimensions,
      finishes,
      openings,
      furniture,
    };
    navigator.clipboard.writeText(JSON.stringify(projectData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Import JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.dimensions && parsed.furniture) {
          onImportLayout({
            dimensions: parsed.dimensions,
            finishes: parsed.finishes || finishes,
            openings: parsed.openings || openings,
            furniture: parsed.furniture,
          });
          onClose();
        } else {
          alert('Arquivo JSON inválido. Certifique-se de que é um projeto do QuartoCraft.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-900 dark:text-white" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Exportar ou Salvar Projeto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-4 space-y-3 text-xs">
          {/* Download Full Source Code Archive for GitHub */}
          <a
            href="/nani-room-smart-layout.tar.gz"
            download="nani-room-smart-layout.tar.gz"
            className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-all flex items-center justify-between group no-underline text-inherit"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                  Baixar Código Fonte Completo (.tar.gz)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Pacote pronto com todo o código React, Three.js e Git configurado.
                </div>
              </div>
            </div>
          </a>

          {/* Download JSON option */}
          <div
            onClick={handleDownloadJson}
            className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-md">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                  Baixar Arquivo do Layout (.json)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Salva o layout completo com dimensões e posições para editar depois.
                </div>
              </div>
            </div>
          </div>

          {/* Copy JSON */}
          <div
            onClick={handleCopyJson}
            className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-md">
                {copiedJson ? <Check className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {copiedJson ? 'Copiado para a área de transferência!' : 'Copiar Dados do Layout (JSON)'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Compartilhe o código do projeto com arquitetos ou amigos.
                </div>
              </div>
            </div>
          </div>

          {/* Import JSON */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-md">
                <FileUp className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
                  Abrir / Carregar Projeto Salvo
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Restaure um arquivo .json salvo anteriormente neste app.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
