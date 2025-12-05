import React from 'react';
import { DataRow } from '../types';
import { Search } from 'lucide-react';

interface DataPreviewProps {
  data: DataRow[];
  headers: string[];
}

export const DataPreview: React.FC<DataPreviewProps> = ({ data, headers }) => {
  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-full inline-block align-middle">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-6 py-3 bg-slate-50 text-left text-xs font-semibold text-slate-400 uppercase border-b border-slate-200">#</th>
              {headers.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {data.slice(0, 100).map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-400 font-mono bg-slate-50/30 group-hover:bg-blue-50/30">{idx + 1}</td>
                {headers.map((header) => (
                  <td key={`${idx}-${header}`} className="px-6 py-3 whitespace-nowrap text-sm text-slate-700 border-r border-transparent last:border-0 hover:border-slate-200">
                    {row[header] === "" ? <span className="text-slate-300 italic">null</span> : row[header]}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={headers.length + 1} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center text-slate-400">
                    <Search className="w-8 h-8 mb-2 opacity-50" />
                    <p>No se encontraron resultados para tu búsqueda.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.length > 100 && (
        <div className="text-center mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
            Mostrando primeros 100 de {data.length} registros
          </span>
        </div>
      )}
    </div>
  );
};