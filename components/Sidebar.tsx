import React from 'react';
import { Database, UploadCloud, FileSpreadsheet, X } from 'lucide-react';
import { ProcessedFile } from '../types';

interface SidebarProps {
  files: ProcessedFile[];
  activeFileId: number | null;
  onSelectFile: (id: number) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (e: React.MouseEvent, id: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onUpload,
  onRemoveFile
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 h-full shrink-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Database className="w-6 h-6" />
          <h1 className="font-bold text-xl tracking-tight">Data Sweeper</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium">Limpia y organiza tus excel</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <label className="block mb-6 group cursor-pointer">
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center bg-slate-50 group-hover:bg-blue-50 group-hover:border-blue-300 transition-all duration-200">
            <UploadCloud className="w-8 h-8 mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-blue-600 font-semibold block">Subir Archivo</span>
            <span className="text-xs text-slate-400 mt-1 block">CSV o Excel</span>
            <input
              type="file"
              multiple
              accept=".csv, .xlsx, .xls"
              onChange={onUpload}
              className="hidden"
            />
          </div>
        </label>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Tus Archivos</h3>
          {files.length === 0 && (
            <div className="text-center py-8 opacity-50">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Sin archivos</p>
            </div>
          )}
          {files.map(file => (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group relative p-3 rounded-lg cursor-pointer flex items-center justify-between text-sm transition-all duration-200 border ${activeFileId === file.id
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-md ${activeFileId === file.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate font-semibold">{file.name}</span>
                  <span className="text-[10px] opacity-70">
                    {file.uploadDate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => onRemoveFile(e, file.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-amber-600 block mb-1">Aviso:</span>
          Data Sweeper utiliza librerías gratis, el archivo excel perderá su estilo y personalización.
        </p>
      </div>
    </aside>
  );
};