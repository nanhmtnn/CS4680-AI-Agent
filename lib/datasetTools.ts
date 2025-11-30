import { Dataset, DatasetInfo, ColumnInfo, MissingValue, DataType } from '@/types';

export class DatasetTools {
  static createDataset(name: string, data: any[]): Dataset {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    const info = this.analyzeDataset(data, columns);
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      data,
      columns,
      info,
      cleaned: false
    };
  }

  static analyzeDataset(data: any[], columns: string[]): DatasetInfo {
    const shape: [number, number] = [data.length, columns.length];
    const columnsInfo: ColumnInfo[] = [];
    const missingValues: MissingValue[] = [];
    const dataTypes: DataType[] = [];

    // Pre-calculate column statistics in single pass
    columns.forEach(column => {
      let nonNullCount = 0;
      let hasNumbers = false;
      let hasStrings = false;
      let hasDates = false;

      for (let i = 0; i < data.length; i++) {
        const value = data[i][column];
        if (value !== null && value !== undefined && value !== '') {
          nonNullCount++;
          if (typeof value === 'number') {
            hasNumbers = true;
          } else if (typeof value === 'string') {
            hasStrings = true;
            if (!isNaN(Date.parse(value))) {
              hasDates = true;
            }
          }
        }
      }

      const nullCount = data.length - nonNullCount;
      const percentage = (nullCount / data.length) * 100;

      let dtype = 'unknown';
      if (hasNumbers && !hasStrings) {
        dtype = 'numeric';
      } else if (hasDates) {
        dtype = 'datetime';
      } else if (hasStrings) {
        dtype = 'categorical';
      }

      columnsInfo.push({
        name: column,
        dtype,
        nonNullCount,
        nullCount
      });

      if (nullCount > 0) {
        missingValues.push({
          column,
          count: nullCount,
          percentage: parseFloat(percentage.toFixed(2))
        });
      }

      dataTypes.push({
        column,
        type: dtype
      });
    });

    return {
      shape,
      columns: columnsInfo,
      missingValues,
      dataTypes
    };
  }

  static showInfo(dataset: Dataset): string {
    const info = dataset.info;
    let infoString = `Dataset: ${dataset.name}\n`;
    infoString += `Shape: ${info.shape[0]} rows × ${info.shape[1]} columns\n\n`;
    
    infoString += "Column Information:\n";
    info.columns.forEach(col => {
      infoString += `- ${col.name}: ${col.dtype} (Non-null: ${col.nonNullCount}, Null: ${col.nullCount})\n`;
    });

    if (info.missingValues.length > 0) {
      infoString += "\nMissing Values:\n";
      info.missingValues.forEach(mv => {
        infoString += `- ${mv.column}: ${mv.count} (${mv.percentage}%)\n`;
      });
    }

    return infoString;
  }

  static cleanDataset(dataset: Dataset, operations: string[]): Dataset {
    console.time('cleanDataset');
    let cleanedData = [...dataset.data];
    
    operations.forEach(op => {
      console.time(op);
      switch (op) {
        case 'remove_duplicates':
          cleanedData = this.removeDuplicatesOptimized(cleanedData);
          break;
        case 'fill_numeric_missing':
          cleanedData = this.fillNumericMissingOptimized(cleanedData, dataset.columns);
          break;
        case 'fill_categorical_missing':
          cleanedData = this.fillCategoricalMissingOptimized(cleanedData, dataset.columns);
          break;
        case 'remove_rows_with_missing':
          cleanedData = this.removeRowsWithMissingOptimized(cleanedData);
          break;
      }
      console.timeEnd(op);
    });

    const cleanedDataset = this.createDataset(`${dataset.name}_cleaned`, cleanedData);
    cleanedDataset.cleaned = true;
    
    console.timeEnd('cleanDataset');
    return cleanedDataset;
  }

  // HIGH-PERFORMANCE VERSIONS

  private static removeDuplicatesOptimized(data: any[]): any[] {
    if (data.length === 0) return data;
    
    const seen = new Set();
    const unique: any[] = [];
    const keys = Object.keys(data[0]);
    
    // Create a string key for faster comparison
    for (let i = 0; i < data.length; i++) {
      let key = '';
      for (let j = 0; j < keys.length; j++) {
        key += String(data[i][keys[j]]) + '|';
      }
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(data[i]);
      }
    }
    
    return unique;
  }

  private static fillNumericMissingOptimized(data: any[], columns: string[]): any[] {
    if (data.length === 0) return data;

    // Pre-calculate means for each column
    const columnMeans = new Map();
    
    columns.forEach(col => {
      if (this.isNumericColumnOptimized(data, col)) {
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < data.length; i++) {
          const val = data[i][col];
          if (val !== null && val !== undefined && val !== '') {
            sum += typeof val === 'string' ? parseFloat(val) : val;
            count++;
          }
        }
        
        if (count > 0) {
          columnMeans.set(col, sum / count);
        }
      }
    });

    // Fill missing values using pre-calculated means
    const filledData = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const newRow = { ...data[i] };
      columns.forEach(col => {
        if (columnMeans.has(col) && 
            (newRow[col] === null || newRow[col] === undefined || newRow[col] === '')) {
          newRow[col] = parseFloat(columnMeans.get(col).toFixed(6));
        }
      });
      filledData[i] = newRow;
    }
    
    return filledData;
  }

  private static fillCategoricalMissingOptimized(data: any[], columns: string[]): any[] {
    const filledData = new Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      const newRow = { ...data[i] };
      columns.forEach(col => {
        if (!this.isNumericColumnOptimized(data, col) && 
            (newRow[col] === null || newRow[col] === undefined || newRow[col] === '')) {
          newRow[col] = 'Unknown';
        }
      });
      filledData[i] = newRow;
    }
    
    return filledData;
  }

  private static removeRowsWithMissingOptimized(data: any[]): any[] {
    return data.filter(row => {
      for (const key in row) {
        if (row[key] === null || row[key] === undefined || row[key] === '') {
          return false;
        }
      }
      return true;
    });
  }

  private static isNumericColumnOptimized(data: any[], column: string): boolean {
    if (data.length === 0) return false;
    
    // Sample first 1000 rows for performance
    const sampleSize = Math.min(1000, data.length);
    let numericCount = 0;
    let totalChecked = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const val = data[i][column];
      if (val !== null && val !== undefined && val !== '') {
        totalChecked++;
        if (typeof val === 'number') {
          numericCount++;
        } else if (typeof val === 'string') {
          const num = parseFloat(val);
          if (!isNaN(num) && isFinite(num)) {
            numericCount++;
          }
        }
      }
    }
    
    // Consider column numeric if >80% of checked values are numeric
    return totalChecked > 0 && (numericCount / totalChecked) > 0.8;
  }
}

