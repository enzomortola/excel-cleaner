import React from 'react';
import { LayoutTemplate } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center max-w-md">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutTemplate className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Workspace Vacío</h3>
        <p className="text-sm text-slate-500">
          Selecciona un archivo del panel lateral o sube uno nuevo para comenzar a limpiar datos.
        </p>
      </div>
    </div>
  );
};