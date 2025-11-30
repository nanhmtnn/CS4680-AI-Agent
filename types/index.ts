export interface Dataset {
  id: string;
  name: string;
  data: Record<string, string | number>[]; // More specific type
  columns: string[];
  info: DatasetInfo;
  cleaned: boolean;
}

export interface DatasetInfo {
  shape: [number, number];
  columns: ColumnInfo[];
  missingValues: MissingValue[];
  dataTypes: DataType[];
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  nonNullCount: number;
  nullCount: number;
}

export interface MissingValue {
  column: string;
  count: number;
  percentage: number;
}

export interface DataType {
  column: string;
  type: string;
}

export interface AnalysisResult {
  insights: string[];
  recommendations: string[];
  cleaningSteps: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}