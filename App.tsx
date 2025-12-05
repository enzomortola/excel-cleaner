import React, { useState, useMemo } from 'react';
import {
  Search,
  CopyMinus,
  Eraser,
  Sheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  TrendingUp,
  Table
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { DataPreview } from './components/DataPreview';
import { FillOptionsModal, FillMethod } from './components/FillOptionsModal';
import { UnifyModal, UnifyType, UnifyScope } from './components/UnifyModal';
import { PivotTableModal } from './components/PivotTableModal';
import { StructureModal } from './components/StructureModal';
import { parseFile, downloadFile } from './services/fileService';
import { ProcessedFile, FilterConfig, DataRow } from './types';

// UI Components
const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled }: any) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-300",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 focus:ring-red-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm hover:shadow",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue" }: { children: React.ReactNode, color?: string }) => {
  const colors: any = {
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700"
  };
  return (
    <span className={`${colors[color] || colors.blue} text-xs px-2.5 py-0.5 rounded-full font-semibold border border-transparent`}>
      {children}
    </span>
  );
};

// Hook for logic
const useFileProcessor = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [stats, setStats] = useState({ removed: 0, filled: 0 });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files);

    const newFilesPromises = uploadedFiles.map(file => parseFile(file));

    try {
      const results = await Promise.all(newFilesPromises);
      const validFiles = results;

      setFiles(prev => [...prev, ...validFiles]);
      if (validFiles.length > 0 && !activeFileId) {
        setActiveFileId(validFiles[0].id);
      }
    } catch (err) {
      console.error("Error uploading files", err);
      alert("Error al cargar archivos. Asegúrate de que sean CSV o Excel válidos.");
    }
  };

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const updateActiveSheetData = (newData: DataRow[]) => {
    if (!activeFile) return;

    setFiles(prev => prev.map(f =>
      f.id === activeFileId ? {
        ...f,
        sheets: f.sheets.map((sheet, index) =>
          index === f.activeSheetIndex ? { ...sheet, data: newData } : sheet
        )
      } : f
    ));
  };

  const setActiveSheet = (fileId: number, sheetIndex: number) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, activeSheetIndex: sheetIndex } : f
    ));
  };

  const removeDuplicates = () => {
    if (!activeFile) return;
    const activeSheet = activeFile.sheets[activeFile.activeSheetIndex];

    // Set para detectar duplicados stringify
    const seen = new Set();
    const uniqueData = activeSheet.data.filter(row => {
      const serialized = JSON.stringify(row);
      const isDuplicate = seen.has(serialized);
      seen.add(serialized);
      return !isDuplicate;
    });

    const removedCount = activeSheet.data.length - uniqueData.length;
    updateActiveSheetData(uniqueData);
    setStats(prev => ({ ...prev, removed: prev.removed + removedCount }));
    return removedCount;
  };

  const fillEmptyValues = (method: FillMethod, value?: string) => {
    if (!activeFile) return;
    const activeSheet = activeFile.sheets[activeFile.activeSheetIndex];

    let filledCount = 0;
    let newData = [...activeSheet.data];

    // Helper to check if a value is "empty"
    const isEmpty = (val: any) => val === "" || val === null || val === undefined;

    if (method === 'predictive') {
      // Predictive Fill (Linear Extrapolation per row)
      newData = newData.map(row => {
        const newRow = { ...row };
        const headers = activeSheet.headers;

        // Extract numeric values and their indices from the row
        const numericValues: { val: number, index: number }[] = [];
        headers.forEach((header, index) => {
          const val = newRow[header];
          if (!isEmpty(val) && !isNaN(Number(val))) {
            numericValues.push({ val: Number(val), index });
          }
        });

        // If we have at least 2 points, we can try to find a linear trend
        let step = 0;
        let startVal = 0;
        let startIndex = 0;
        let canPredict = false;

        if (numericValues.length >= 2) {
          const first = numericValues[0];
          const last = numericValues[numericValues.length - 1];
          // Calculate average step
          if (last.index !== first.index) {
            step = (last.val - first.val) / (last.index - first.index);
            startVal = first.val;
            startIndex = first.index;
            canPredict = true;
          }
        } else if (numericValues.length === 1) {
          // Only one value, fallback to constant fill (copy value)
          startVal = numericValues[0].val;
          step = 0;
          startIndex = numericValues[0].index;
          canPredict = true;
        }

        headers.forEach((header, index) => {
          if (isEmpty(newRow[header])) {
            if (canPredict) {
              // Linear prediction: y = mx + b
              // val = startVal + step * (index - startIndex)
              const predictedVal = startVal + step * (index - startIndex);
              // Round to 2 decimals if step is not integer, otherwise keep integer
              newRow[header] = Number.isInteger(step) && Number.isInteger(startVal)
                ? Math.round(predictedVal)
                : Number(predictedVal.toFixed(2));
              filledCount++;
            }
          }
        });

        return newRow;
      });
    } else if (method === 'mean' || method === 'sum') {
      // Calculate stats per column
      const colStats: Record<string, number> = {};

      activeSheet.headers.forEach(header => {
        const values = activeSheet.data
          .map(row => Number(row[header]))
          .filter(val => !isNaN(val) && val !== 0); // Filter out 0s if they are considered empty? No, usually 0 is a value. But here we are looking for valid numbers.

        if (values.length > 0) {
          if (method === 'sum') {
            colStats[header] = values.reduce((a, b) => a + b, 0);
          } else {
            colStats[header] = values.reduce((a, b) => a + b, 0) / values.length;
          }
        }
      });

      newData = newData.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (isEmpty(newRow[key]) && colStats[key] !== undefined) {
            newRow[key] = method === 'mean' ? Number(colStats[key].toFixed(2)) : colStats[key];
            filledCount++;
          }
        });
        return newRow;
      });
    } else {
      // Custom Value
      const fillVal = value || "0";
      newData = newData.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (isEmpty(newRow[key])) {
            newRow[key] = fillVal;
            filledCount++;
          }
        });
        return newRow;
      });
    }

    updateActiveSheetData(newData);
    setStats(prev => ({ ...prev, filled: prev.filled + filledCount }));
    return filledCount;
  };

  const updateFileStructure = (fileId: number, sheetIndex: number, newData: DataRow[], newHeaders: string[]) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;

      const newSheets = f.sheets.map((sheet, index) => {
        if (index !== sheetIndex) return sheet;
        return {
          ...sheet,
          data: newData,
          headers: newHeaders
          // We keep rawData active so user can change headers again if they executed it wrong
        };
      });

      return { ...f, sheets: newSheets };
    }));
  };

  const handleDownload = (format: 'csv' | 'xlsx') => {
    if (!activeFile) return;
    downloadFile(activeFile, format);
  };

  const removeFile = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  return {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    setActiveSheet,
    handleFileUpload,
    removeDuplicates,
    fillEmptyValues,
    handleDownload,
    removeFile,
    stats,
    setFiles,
    updateFileStructure
  };
};

export default function App() {
  const {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    setActiveSheet,
    handleFileUpload,
    removeDuplicates,
    fillEmptyValues,
    handleDownload,
    removeFile,
    setFiles,
    updateFileStructure
  } = useFileProcessor();

  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    scope: 'global',
    column: '',
    value: '',
    mode: 'contains'
  });

  const [isFillModalOpen, setIsFillModalOpen] = useState(false);
  const [isUnifyModalOpen, setIsUnifyModalOpen] = useState(false);
  const [isPivotModalOpen, setIsPivotModalOpen] = useState(false);
  const [unifyType, setUnifyType] = useState<UnifyType>('date');

  const handleUnify = (scope: UnifyScope, format: string) => {
    if (!activeFile) return;

    const processSheet = (sheet: any) => {
      const newData = sheet.data.map((row: any) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          let val = newRow[key];
          if (val === null || val === undefined || val === "") return;

          if (unifyType === 'date') {
            // Try to parse date
            let dateObj: Date | null = null;

            // Handle Excel serial dates (numbers)
            if (typeof val === 'number' && val > 20000 && val < 60000) {
              // Approximate check for Excel dates
              const excelEpoch = new Date(1899, 11, 30);
              dateObj = new Date(excelEpoch.getTime() + val * 86400000);
            } else {
              const parsed = Date.parse(String(val));
              if (!isNaN(parsed)) dateObj = new Date(parsed);
            }

            if (dateObj) {
              const d = dateObj.getDate().toString().padStart(2, '0');
              const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const y = dateObj.getFullYear();

              if (format === 'DD/MM/YYYY') newRow[key] = `${d}/${m}/${y}`;
              else if (format === 'MM/DD/YYYY') newRow[key] = `${m}/${d}/${y}`;
              else if (format === 'YYYY-MM-DD') newRow[key] = `${y}-${m}-${d}`;
              else if (format === 'DD-MM-YYYY') newRow[key] = `${d}-${m}-${y}`;
            }
          } else {
            // Number formatting
            let numVal: number | null = null;
            if (typeof val === 'number') {
              numVal = val;
            } else {
              const strVal = String(val).trim();
              // Remove all non-numeric chars except dot and minus
              // This is a simplification. For robust parsing we might need more logic or a library.
              // Assuming input is relatively clean or standard.
              // If we have commas, replace them with dots if they look like decimals?
              // Or just strip everything that is not digit, dot, minus.

              // Simple heuristic: 
              // 1.234,56 -> replace . with nothing, replace , with .
              // 1,234.56 -> replace , with nothing

              // Let's try to detect format based on last separator
              const lastDot = strVal.lastIndexOf('.');
              const lastComma = strVal.lastIndexOf(',');

              let cleanStr = strVal;
              if (lastComma > lastDot) {
                // Comma is likely decimal
                cleanStr = strVal.replace(/\./g, '').replace(',', '.');
              } else {
                // Dot is likely decimal (or no decimal)
                cleanStr = strVal.replace(/,/g, '');
              }

              const parsed = parseFloat(cleanStr);
              if (!isNaN(parsed)) numVal = parsed;
            }

            if (numVal !== null) {
              if (format === '1.234,56') {
                newRow[key] = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numVal);
              } else if (format === '1,234.56') {
                newRow[key] = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numVal);
              } else {
                newRow[key] = numVal.toFixed(2);
              }
            }
          }
        });
        return newRow;
      });
      return { ...sheet, data: newData };
    };

    setFiles(prev => prev.map(f => {
      if (f.id !== activeFile.id) return f;

      const newSheets = f.sheets.map((sheet, index) => {
        if (scope === 'sheet' && index !== f.activeSheetIndex) return sheet;
        return processSheet(sheet);
      });

      return { ...f, sheets: newSheets };
    }));

    alert(`Formato de ${unifyType === 'date' ? 'fechas' : 'números'} aplicado en ${scope === 'sheet' ? 'la hoja actual' : 'todo el documento'}.`);
  };

  // Get active sheet data
  const activeSheet = useMemo(() => {
    if (!activeFile) return null;
    return activeFile.sheets[activeFile.activeSheetIndex];
  }, [activeFile]);

  // Filtrado Reactivo
  const filteredData = useMemo(() => {
    if (!activeSheet) return [];
    const { scope, column, value, mode } = filterConfig;
    if (!value) return activeSheet.data;

    const searchVal = value.toString().toLowerCase();
    return activeSheet.data.filter(row => {
      if (scope === 'column' && column) {
        const cellVal = String(row[column] || "").toLowerCase();
        return mode === 'exact' ? cellVal === searchVal : cellVal.includes(searchVal);
      } else {
        return Object.values(row).some(val => {
          const cellVal = String(val).toLowerCase();
          return mode === 'exact' ? cellVal === searchVal : cellVal.includes(searchVal);
        });
      }
    });
  }, [activeSheet, filterConfig]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        files={files}
        activeFileId={activeFileId}
        onSelectFile={setActiveFileId}
        onUpload={handleFileUpload}
        onRemoveFile={removeFile}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {!activeFile || !activeSheet ? (
          <EmptyState />
        ) : (
          <>
            {/* Header Toolbar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 flex-shrink-0">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

                {/* File Info and Sheet Navigation */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    {activeFile.name}
                    <Badge color="blue">{filteredData.length} filas</Badge>
                  </h2>

                  {/* Sheet Navigation */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium">Páginas:</span>
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setActiveSheet(activeFile.id, Math.max(0, activeFile.activeSheetIndex - 1))}
                        disabled={activeFile.activeSheetIndex === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <select
                        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1 px-2"
                        value={activeFile.activeSheetIndex}
                        onChange={(e) => setActiveSheet(activeFile.id, parseInt(e.target.value))}
                      >
                        {activeFile.sheets.map((sheet, index) => (
                          <option key={sheet.name} value={index}>
                            {sheet.name} ({sheet.data.length} filas)
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => setActiveSheet(activeFile.id, Math.min(activeFile.sheets.length - 1, activeFile.activeSheetIndex + 1))}
                        disabled={activeFile.activeSheetIndex === activeFile.sheets.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-xs text-slate-400">
                      {activeFile.activeSheetIndex + 1} de {activeFile.sheets.length}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {activeSheet.headers.length} columnas detectadas
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <div className="flex items-center px-2 border-r border-slate-200">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <select
                      className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
                      value={filterConfig.scope}
                      onChange={(e) => setFilterConfig({ ...filterConfig, scope: e.target.value as any })}
                    >
                      <option value="global">Global</option>
                      <option value="column">Columna</option>
                    </select>
                  </div>

                  {filterConfig.scope === 'column' && (
                    <div className="px-2 border-r border-slate-200">
                      <select
                        className="bg-transparent text-sm text-slate-600 focus:outline-none max-w-[120px]"
                        value={filterConfig.column}
                        onChange={(e) => setFilterConfig({ ...filterConfig, column: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {activeSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Escribe para buscar..."
                    className="bg-transparent text-sm px-3 py-1 focus:outline-none w-48 text-slate-700 placeholder:text-slate-400"
                    value={filterConfig.value}
                    onChange={(e) => setFilterConfig({ ...filterConfig, value: e.target.value })}
                  />

                  <div className="flex ml-2 bg-white rounded shadow-sm">
                    <button
                      onClick={() => setFilterConfig({ ...filterConfig, mode: 'contains' })}
                      className={`px-3 py-1 text-xs font-medium rounded-l transition-colors ${filterConfig.mode === 'contains' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Contiene
                    </button>
                    <div className="w-px bg-slate-200"></div>
                    <button
                      onClick={() => setFilterConfig({ ...filterConfig, mode: 'exact' })}
                      className={`px-3 py-1 text-xs font-medium rounded-r transition-colors ${filterConfig.mode === 'exact' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Exacto
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Data Table */}
            <DataPreview data={filteredData} headers={activeSheet.headers} />

            {/* Actions Footer */}
            <footer className="bg-white border-t border-slate-200 p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Limpieza:</span>
                    <Button variant="ghost" onClick={() => setIsStructureModalOpen(true)} className="h-8 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100" icon={Table}>
                      Estructura
                    </Button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <Button variant="ghost" onClick={() => { const n = removeDuplicates(); if (n) alert(`Eliminados ${n} duplicados`); }} className="h-8 text-xs" icon={CopyMinus}>
                      Sin Duplicados
                    </Button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <Button variant="ghost" onClick={() => setIsFillModalOpen(true)} className="h-8 text-xs" icon={Eraser}>
                      Rellenar Vacíos
                    </Button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <Button variant="ghost" onClick={() => { setUnifyType('date'); setIsUnifyModalOpen(true); }} className="h-8 text-xs" icon={Calendar}>
                      Unificar Fechas
                    </Button>
                    <Button variant="ghost" onClick={() => { setUnifyType('number'); setIsUnifyModalOpen(true); }} className="h-8 text-xs" icon={Hash}>
                      Unificar Números
                    </Button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <Button variant="ghost" onClick={() => setIsPivotModalOpen(true)} className="h-8 text-xs" icon={TrendingUp}>
                      Tabla Pivot
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Descargar:</span>
                  <Button variant="success" onClick={() => handleDownload('xlsx')} icon={Sheet}>
                    Excel (.xlsx)
                  </Button>
                  <Button variant="primary" onClick={() => handleDownload('csv')} icon={FileText}>
                    CSV
                  </Button>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>
      <FillOptionsModal
        isOpen={isFillModalOpen}
        onClose={() => setIsFillModalOpen(false)}
        onApply={(method, value) => {
          const n = fillEmptyValues(method, value);
          if (n) alert(`Rellenados ${n} valores vacíos`);
        }}
      />
      <UnifyModal
        isOpen={isUnifyModalOpen}
        onClose={() => setIsUnifyModalOpen(false)}
        type={unifyType}
        onApply={handleUnify}
      />
      <PivotTableModal
        isOpen={isPivotModalOpen}
        onClose={() => setIsPivotModalOpen(false)}
        data={filteredData}
        headers={activeSheet?.headers || []}
      />
      <StructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        sheet={activeSheet || null}
        onApply={(newData, newHeaders) => {
          if (activeFileId !== null && activeFile) {
            updateFileStructure(activeFileId, activeFile.activeSheetIndex, newData, newHeaders);
          }
        }}
      />
    </div>
  );
}