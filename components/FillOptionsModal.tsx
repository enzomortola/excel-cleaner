import React, { useState } from 'react';
import { X } from 'lucide-react';

export type FillMethod = 'custom' | 'mean' | 'sum' | 'predictive';

interface FillOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (method: FillMethod, value?: string) => void;
}

export const FillOptionsModal: React.FC<FillOptionsModalProps> = ({ isOpen, onClose, onApply }) => {
  const [method, setMethod] = useState<FillMethod>('custom');
  const [customValue, setCustomValue] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(method, customValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Rellenar Valores Vacíos</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Método de Relleno</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as FillMethod)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="custom">Valor Personalizado</option>
              <option value="mean">Promedio (Solo Numéricos)</option>
              <option value="sum">Suma (Solo Numéricos)</option>
              <option value="predictive">Relleno Predictivo (Detectar Patrón)</option>
            </select>
          </div>

          {method === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor</label>
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Escribe el valor..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-500">Este valor se usará para todas las celdas vacías.</p>
            </div>
          )}

          {method === 'mean' && (
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
              Se calculará el promedio de cada columna numérica y se usará para rellenar sus vacíos. Las columnas de texto se ignorarán.
            </div>
          )}

          {method === 'sum' && (
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
              Se calculará la suma total de cada columna numérica y se usará para rellenar sus vacíos.
            </div>
          )}

          {method === 'predictive' && (
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
              Se intentará detectar un patrón numérico en cada fila (ej: 2, 4, 6 -&gt; 8) para rellenar los vacíos. Si no se detecta patrón, se copiará el último valor.
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
            >
              Aplicar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
