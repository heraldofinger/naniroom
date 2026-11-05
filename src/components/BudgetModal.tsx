/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Printer, Copy, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { FurnitureItem, RoomDimensions } from '../types/bedroom';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  furniture: FurnitureItem[];
  dimensions: RoomDimensions;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  furniture,
  dimensions,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Calculate items and prices
  const itemsWithPrice = furniture.map((item) => {
    const catalogItem = FURNITURE_CATALOG.find((c) => c.id === item.catalogId);
    const price = catalogItem ? catalogItem.priceEstimate : 600;
    return { item, price };
  });

  const totalPrice = itemsWithPrice.reduce((sum, current) => sum + current.price, 0);

  const handleCopyList = () => {
    const text = itemsWithPrice
      .map(
        ({ item, price }) =>
          `• ${item.name} (${item.width}m × ${item.depth}m) - R$ ${price.toLocaleString('pt-BR')}`
      )
      .join('\n');
    const fullText = `PROJETO DE QUARTO (${dimensions.width}m × ${dimensions.length}m - ${(
      dimensions.width * dimensions.length
    ).toFixed(1)}m²)\n\nLista de Móveis:\n${text}\n\nTotal Estimado: R$ ${totalPrice.toLocaleString(
      'pt-BR'
    )}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-900 dark:text-white" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Orçamento & Lista de Móveis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>{furniture.length} itens no layout do quarto</span>
            <span>Área: {(dimensions.width * dimensions.length).toFixed(1)} m²</span>
          </div>

          {itemsWithPrice.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              Nenhum móvel adicionado ainda ao quarto.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {itemsWithPrice.map(({ item, price }) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.width.toFixed(2)}m × {item.depth.toFixed(2)}m · alt. {item.height.toFixed(2)}m
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    R$ {price.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Summary Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
              Investimento Estimado
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              R$ {totalPrice.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyList}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Lista'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
