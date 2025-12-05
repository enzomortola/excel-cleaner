import React, { useState, useMemo } from 'react';
import { X, TrendingUp, BarChart3, PieChart, Download } from 'lucide-react';
import { DataRow } from '../types';

type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max';
type ChartType = 'table' | 'bar' | 'pie';

interface PivotTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DataRow[];
    headers: string[];
}

interface PivotConfig {
    rowField: string;
    columnField: string;
    valueField: string;
    aggregation: AggregationType;
}

export const PivotTableModal: React.FC<PivotTableModalProps> = ({ isOpen, onClose, data, headers }) => {
    const [config, setConfig] = useState<PivotConfig>({
        rowField: headers[0] || '',
        columnField: '',
        valueField: headers[1] || '',
        aggregation: 'sum'
    });
    const [chartType, setChartType] = useState<ChartType>('table');

    // Calcular tabla pivot
    const pivotData = useMemo(() => {
        if (!config.rowField || !config.valueField) return null;

        const result: Record<string, Record<string, number>> = {};
        const rowValues = new Set<string>();
        const colValues = new Set<string>();

        // Agrupar datos
        data.forEach(row => {
            const rowKey = String(row[config.rowField] || 'Sin datos');
            const colKey = config.columnField ? String(row[config.columnField] || 'Sin datos') : 'Total';
            const value = parseFloat(String(row[config.valueField])) || 0;

            rowValues.add(rowKey);
            colValues.add(colKey);

            if (!result[rowKey]) result[rowKey] = {};
            if (!result[rowKey][colKey]) result[rowKey][colKey] = 0;

            // Aplicar agregación
            switch (config.aggregation) {
                case 'sum':
                case 'average':
                    result[rowKey][colKey] += value;
                    break;
                case 'count':
                    result[rowKey][colKey] += 1;
                    break;
                case 'min':
                    result[rowKey][colKey] = result[rowKey][colKey] === 0 ? value : Math.min(result[rowKey][colKey], value);
                    break;
                case 'max':
                    result[rowKey][colKey] = Math.max(result[rowKey][colKey], value);
                    break;
            }
        });

        // Calcular promedio si es necesario
        if (config.aggregation === 'average') {
            const counts: Record<string, Record<string, number>> = {};
            data.forEach(row => {
                const rowKey = String(row[config.rowField] || 'Sin datos');
                const colKey = config.columnField ? String(row[config.columnField] || 'Sin datos') : 'Total';
                if (!counts[rowKey]) counts[rowKey] = {};
                counts[rowKey][colKey] = (counts[rowKey][colKey] || 0) + 1;
            });

            Object.keys(result).forEach(rowKey => {
                Object.keys(result[rowKey]).forEach(colKey => {
                    result[rowKey][colKey] /= counts[rowKey][colKey];
                });
            });
        }

        return {
            data: result,
            rows: Array.from(rowValues).sort(),
            columns: Array.from(colValues).sort()
        };
    }, [data, config]);

    // Calcular totales
    const totals = useMemo(() => {
        if (!pivotData) return null;

        const rowTotals: Record<string, number> = {};
        const colTotals: Record<string, number> = {};
        let grandTotal = 0;

        pivotData.rows.forEach(row => {
            rowTotals[row] = 0;
            pivotData.columns.forEach(col => {
                const val = pivotData.data[row]?.[col] || 0;
                rowTotals[row] += val;
                colTotals[col] = (colTotals[col] || 0) + val;
                grandTotal += val;
            });
        });

        return { rowTotals, colTotals, grandTotal };
    }, [pivotData]);

    // Exportar a CSV
    const exportToCSV = () => {
        if (!pivotData) return;

        let csv = config.rowField + ',' + pivotData.columns.join(',') + ',Total\n';

        pivotData.rows.forEach(row => {
            const values = pivotData.columns.map(col => pivotData.data[row]?.[col]?.toFixed(2) || '0');
            csv += `${row},${values.join(',')},${totals?.rowTotals[row].toFixed(2)}\n`;
        });

        csv += 'Total,' + pivotData.columns.map(col => totals?.colTotals[col].toFixed(2)).join(',') + ',' + totals?.grandTotal.toFixed(2);

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pivot_table.csv';
        a.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Tabla Pivot</h2>
                            <p className="text-sm text-slate-500">Análisis avanzado de datos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Configuración */}
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Filas</label>
                            <select
                                value={config.rowField}
                                onChange={(e) => setConfig({ ...config, rowField: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Columnas (opcional)</label>
                            <select
                                value={config.columnField}
                                onChange={(e) => setConfig({ ...config, columnField: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Ninguna</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Valores</label>
                            <select
                                value={config.valueField}
                                onChange={(e) => setConfig({ ...config, valueField: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Agregación</label>
                            <select
                                value={config.aggregation}
                                onChange={(e) => setConfig({ ...config, aggregation: e.target.value as AggregationType })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="sum">Suma</option>
                                <option value="average">Promedio</option>
                                <option value="count">Conteo</option>
                                <option value="min">Mínimo</option>
                                <option value="max">Máximo</option>
                            </select>
                        </div>
                    </div>

                    {/* Tipo de visualización */}
                    <div className="flex items-center gap-2 mt-4">
                        <button
                            onClick={() => setChartType('table')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${chartType === 'table' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Tabla
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${chartType === 'bar' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Gráfico de Barras
                        </button>
                        <button
                            onClick={() => setChartType('pie')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${chartType === 'pie' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <PieChart className="w-4 h-4" />
                            Gráfico Circular
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-auto p-6">
                    {!pivotData ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <p>Configura los campos para generar la tabla pivot</p>
                        </div>
                    ) : chartType === 'table' ? (
                        <div className="overflow-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                        <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-purple-600">{config.rowField}</th>
                                        {pivotData.columns.map(col => (
                                            <th key={col} className="px-4 py-3 text-right font-semibold">{col}</th>
                                        ))}
                                        <th className="px-4 py-3 text-right font-bold bg-purple-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pivotData.rows.map((row, idx) => (
                                        <tr key={row} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                            <td className="px-4 py-3 font-medium text-slate-700 sticky left-0 bg-inherit border-r border-slate-200">{row}</td>
                                            {pivotData.columns.map(col => (
                                                <td key={col} className="px-4 py-3 text-right text-slate-600">
                                                    {(pivotData.data[row]?.[col] || 0).toFixed(2)}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-right font-bold text-purple-700 bg-purple-50">
                                                {totals?.rowTotals[row].toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gradient-to-r from-purple-100 to-pink-100 font-bold">
                                        <td className="px-4 py-3 sticky left-0 bg-purple-100">Total</td>
                                        {pivotData.columns.map(col => (
                                            <td key={col} className="px-4 py-3 text-right text-purple-700">
                                                {totals?.colTotals[col].toFixed(2)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right text-purple-900 bg-purple-200">
                                            {totals?.grandTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : chartType === 'bar' ? (
                        <div className="space-y-4">
                            {pivotData.rows.map(row => {
                                const total = totals?.rowTotals[row] || 0;
                                const maxTotal = Math.max(...Object.values(totals?.rowTotals || {}));
                                const percentage = (total / maxTotal) * 100;

                                return (
                                    <div key={row} className="flex items-center gap-4">
                                        <div className="w-32 text-sm font-medium text-slate-700 truncate">{row}</div>
                                        <div className="flex-1 bg-slate-200 rounded-full h-8 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end px-3 text-white font-semibold text-sm transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            >
                                                {total.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="relative w-96 h-96">
                                <svg viewBox="0 0 200 200" className="w-full h-full">
                                    {pivotData.rows.map((row, idx) => {
                                        const total = totals?.rowTotals[row] || 0;
                                        const grandTotal = totals?.grandTotal || 1;
                                        const percentage = (total / grandTotal) * 100;
                                        const angle = (percentage / 100) * 360;

                                        const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
                                        const color = colors[idx % colors.length];

                                        const startAngle = pivotData.rows.slice(0, idx).reduce((sum, r) => {
                                            const t = totals?.rowTotals[r] || 0;
                                            return sum + ((t / grandTotal) * 360);
                                        }, 0);

                                        const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                                        const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                                        const x2 = 100 + 80 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                                        const y2 = 100 + 80 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                                        const largeArc = angle > 180 ? 1 : 0;

                                        return (
                                            <g key={row}>
                                                <path
                                                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                    fill={color}
                                                    stroke="white"
                                                    strokeWidth="2"
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-800">{totals?.grandTotal.toFixed(0)}</div>
                                            <div className="text-xs text-slate-500">Total</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-8 space-y-2">
                                {pivotData.rows.map((row, idx) => {
                                    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
                                    const color = colors[idx % colors.length];
                                    const total = totals?.rowTotals[row] || 0;
                                    const percentage = ((total / (totals?.grandTotal || 1)) * 100).toFixed(1);

                                    return (
                                        <div key={row} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                                            <div className="text-sm">
                                                <span className="font-medium text-slate-700">{row}</span>
                                                <span className="text-slate-500 ml-2">({percentage}%)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
