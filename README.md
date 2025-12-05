# 📊 Excel Cleaner - Herramienta de Análisis de Datos

Aplicación web avanzada para limpieza, análisis y visualización de archivos Excel y CSV de gran tamaño.

## ✨ Características Principales

### 🏗️ Edición de Estructura (NUEVO)
- **Corrección de Encabezados**: Selecciona cualquier fila como encabezado real de la tabla.
  - Soluciona problemas con columnas `__EMPTY`.
  - Elimina automáticamente filas superiores irrelevantes (metadatos, títulos, etc.).
- **Eliminación de Filas/Columnas**: Borra filas o columnas innecesarias antes del análisis.
- **Vista "Raw"**: Visualiza los datos crudos para tomar mejores decisiones de estructura.

### 🧹 Limpieza de Datos
- **Eliminar Duplicados**: Detecta y elimina filas duplicadas
- **Rellenar Valores Vacíos**: 
  - Valores personalizados
  - Promedio de columna
  - Suma de columna
  - Relleno predictivo (extrapolación lineal)

### 🔄 Unificación de Formatos
- **Fechas**: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
- **Números**: 1.234,56 (europeo), 1,234.56 (americano)
- Aplicable a hoja actual o documento completo

### 📈 Tabla Pivot
Análisis avanzado con:
- **Agregaciones**: Suma, Promedio, Conteo, Mínimo, Máximo
- **Visualizaciones**:
  - Tabla dinámica con totales
  - Gráfico de barras horizontal
  - Gráfico circular (pie chart)
- **Exportación**: Descarga resultados en CSV

### 🔍 Búsqueda y Filtrado
- Búsqueda global o por columna
- Filtrado reactivo en tiempo real

## 🚀 Uso Rápido

1. **Cargar archivo**: Arrastra archivos Excel/CSV.
2. **Ajustar Estructura**: 
   - Si las columnas salen como `__EMPTY`, ve a "Estructura".
   - Selecciona la fila que contiene los nombres reales (ej: "Sexo", "Nivel educativo").
   - Click en "Usar Fila como Encabezados".
3. **Limpiar datos**: Usa "Rellenar Vacíos" o "Sin Duplicados".
4. **Analizar**: Usa "Tabla Pivot" para generar reportes agregados.
5. **Exportar**: Descarga tu trabajo en Excel o CSV.

## 🛠️ Tecnologías

- **React 18** + TypeScript
- **Vite**
- **TailwindCSS**
- **XLSX** (SheetJS)
- **Lucide React**

## 📦 Instalación

```bash
npm install
npm run dev
```

---

**Desarrollado con ❤️ para análisis de datos eficiente**
