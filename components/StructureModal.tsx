import React, { useState, useEffect } from 'react';
import { X, Table, ArrowDownToLine, Trash2, Save } from 'lucide-react';
import { DataRow, ExcelSheet } from '../types';

interface StructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheet: ExcelSheet | null;
    onApply: (newData: DataRow[], newHeaders: string[]) => void;
}

export const StructureModal: React.FC<StructureModalProps> = ({ isOpen, onClose, sheet, onApply }) => {
    const [localData, setLocalData] = useState<any[][]>([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [selectedColIndex, setSelectedColIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && sheet && sheet.rawData) {
            // Deep copy to avoid mutating original until apply
            setLocalData(JSON.parse(JSON.stringify(sheet.rawData)));
            setSelectedRowIndex(null);
            setSelectedColIndex(null);
        }
    }, [isOpen, sheet]);

    if (!isOpen || !sheet) return null;

    const handleSetHeader = () => {
        if (selectedRowIndex === null) return;

        // Use selected row as headers
        const newHeaders = localData[selectedRowIndex].map(String);

        // Data is everything AFTER selected row
        const dataRows = localData.slice(selectedRowIndex + 1);

        // Map array to object using headers
        const newData: DataRow[] = dataRows.map(row => {
            const rowObj: DataRow = {};
            newHeaders.forEach((header, idx) => {
                rowObj[header] = row[idx];
            });
            return rowObj;
        });

        onApply(newData, newHeaders);
        onClose();
    };

    const handleDeleteRow = () => {
        if (selectedRowIndex === null) return;
        const newData = [...localData];
        newData.splice(selectedRowIndex, 1);
        setLocalData(newData);
        setSelectedRowIndex(null);
    };

    const handleDeleteCol = () => {
        if (selectedColIndex === null) return;
        const newData = localData.map(row => {
            const newRow = [...row];
            newRow.splice(selectedColIndex, 1);
            return newRow;
        });
        setLocalData(newData);
        setSelectedColIndex(null);
    };

    const handleSave = () => {
        if (localData.length === 0) return;

        // Assume first row is header
        const newHeaders = localData[0].map(String);
        const dataRows = localData.slice(1);

        const newData: DataRow[] = dataRows.map(row => {
            const rowObj: DataRow = {};
            newHeaders.forEach((header, idx) => {
                rowObj[header] = row[idx];
            });
            return rowObj;
        });

        onApply(newData, newHeaders);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Table className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Modificar Estructura</h2>
                            <p className="text-sm text-slate-500">Define encabezados y elimina filas/columnas innecesarias</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 border-b border-slate-200 flex-wrap">
                    <button
                        onClick={handleSetHeader}
                        disabled={selectedRowIndex === null}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        Usar Fila como Encabezados
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                    </button>
                    <div className="w-px h-6 bg-slate-300"></div>
                    <button
                        onClick={handleDeleteRow}
                        disabled={selectedRowIndex === null}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar Fila
                    </button>
                    <button
                        onClick={handleDeleteCol}
                        disabled={selectedColIndex === null}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar Columna
                    </button>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto p-0 relative">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="sticky top-0 left-0 z-20 bg-slate-100 border-b border-r border-slate-300 w-12 text-center text-xs text-slate-500">
                                    #
                                </th>
                                {localData[0]?.map((_, idx) => (
                                    <th
                                        key={idx}
                                        onClick={() => setSelectedColIndex(idx === selectedColIndex ? null : idx)}
                                        className={`sticky top-0 z-10 px-4 py-2 border-b border-r border-slate-300 min-w-[100px] cursor-pointer hover:bg-slate-200 transition-colors text-left font-medium text-slate-600 ${selectedColIndex === idx ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-500' : 'bg-slate-50'
                                            }`}
                                    >
                                        Col {idx + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {localData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    onClick={() => setSelectedRowIndex(rowIdx === selectedRowIndex ? null : rowIdx)}
                                    className={`cursor-pointer transition-colors ${selectedRowIndex === rowIdx ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <td
                                        className={`sticky left-0 bg-slate-50 border-r border-b border-slate-200 text-center text-xs font-mono text-slate-400 select-none ${selectedRowIndex === rowIdx ? 'bg-indigo-100 text-indigo-700 font-bold border-r-indigo-300' : ''
                                            }`}
                                    >
                                        {rowIdx + 1}
                                    </td>
                                    {row.map((cell: any, colIdx: number) => (
                                        <td
                                            key={colIdx}
                                            className={`px-4 py-2 border-b border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] ${selectedColIndex === colIdx ? 'bg-indigo-50/50' : ''
                                                } ${cell === null || cell === '' ? 'text-slate-300 italic' : 'text-slate-700'}`}
                                        >
                                            {cell === null || cell === undefined || cell === '' ? 'null' : String(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {localData.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                            <p>No hay datos raw disponibles. Vuelve a cargar el archivo.</p>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                    <p>Selecciona una celda/fila para acciones. "Usar Fila como Encabezados" eliminará las filas superiores.</p>
                    <p>{localData.length} filas x {localData[0]?.length || 0} columnas</p>
                </div>
            </div>
        </div>
    );
};
