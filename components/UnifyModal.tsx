import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash } from 'lucide-react';

export type UnifyType = 'date' | 'number';
export type UnifyScope = 'sheet' | 'workbook';

interface UnifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: UnifyType;
    onApply: (scope: UnifyScope, format: string) => void;
}

export const UnifyModal: React.FC<UnifyModalProps> = ({ isOpen, onClose, type, onApply }) => {
    const [scope, setScope] = useState<UnifyScope>('sheet');
    const [format, setFormat] = useState<string>('');

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setScope('sheet');
            setFormat(type === 'date' ? 'DD/MM/YYYY' : '1.234,56');
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApply(scope, format);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        {type === 'date' ? <Calendar className="w-5 h-5 text-blue-500" /> : <Hash className="w-5 h-5 text-emerald-500" />}
                        {type === 'date' ? 'Unificar Formato de Fechas' : 'Unificar Formato de Números'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Scope Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">¿Dónde aplicar los cambios?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`
                relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${scope === 'sheet' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
              `}>
                                <input
                                    type="radio"
                                    name="scope"
                                    value="sheet"
                                    checked={scope === 'sheet'}
                                    onChange={() => setScope('sheet')}
                                    className="sr-only"
                                />
                                <span className="text-sm font-semibold text-slate-900">Página Actual</span>
                                <span className="text-xs text-slate-500 mt-1">Solo la hoja visible</span>
                            </label>

                            <label className={`
                relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${scope === 'workbook' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
              `}>
                                <input
                                    type="radio"
                                    name="scope"
                                    value="workbook"
                                    checked={scope === 'workbook'}
                                    onChange={() => setScope('workbook')}
                                    className="sr-only"
                                />
                                <span className="text-sm font-semibold text-slate-900">Todo el Documento</span>
                                <span className="text-xs text-slate-500 mt-1">Todas las hojas</span>
                            </label>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Formato Deseado</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {type === 'date' ? (
                                <>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY (ej: 31/12/2023)</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY (ej: 12/31/2023)</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD (ej: 2023-12-31)</option>
                                    <option value="DD-MM-YYYY">DD-MM-YYYY (ej: 31-12-2023)</option>
                                </>
                            ) : (
                                <>
                                    <option value="1.234,56">1.234,56 (Europeo/Latam)</option>
                                    <option value="1,234.56">1,234.56 (US/UK)</option>
                                    <option value="1234.56">1234.56 (Plano)</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-lg border border-slate-200">
                        <p>
                            <strong>Nota:</strong> Se intentará convertir automáticamente todas las celdas que parezcan {type === 'date' ? 'fechas' : 'números'} al formato seleccionado.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
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
                            Aplicar Formato
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
