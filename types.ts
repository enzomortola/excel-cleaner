export type CellValue = string | number | boolean | null | undefined;

export interface DataRow {
  [key: string]: CellValue;
}

export interface ExcelSheet {
  name: string;
  data: DataRow[];
  originalData: DataRow[];
  headers: string[];
  rawData?: any[][]; // Raw data from parsing with header: 1
}

export interface ProcessedFile {
  id: number;
  name: string;
  sheets: ExcelSheet[];
  activeSheetIndex: number;
  uploadDate: Date;
  originalWorkbook?: any; // Store original workbook to preserve styles
}

export type FilterScope = 'global' | 'column';
export type FilterMode = 'contains' | 'exact';

export interface FilterConfig {
  scope: FilterScope;
  column: string;
  value: string;
  mode: FilterMode;
}
