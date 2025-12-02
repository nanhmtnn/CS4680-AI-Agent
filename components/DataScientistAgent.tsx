// -------------------------------------------------------------------------------------------- 


'use client';

import React, { useState } from 'react';
import { Dataset } from '@/types';
import { DatasetTools } from '@/lib/datasetTools';
import { DataScientistAgent } from '@/lib/gemini';
import { 
  Upload, 
  BarChart3, 
  Eraser, 
  Database, 
  Brain, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  Sparkles,
  FileText,
  X,
  Settings,
  Zap
} from 'lucide-react';
import HistogramChart from "@/components/HistogramChart";

// 


// Numeric attributes statistics computation ------------------------------------------------------------ 
export default function DataScientistAgentApp() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'analyze' | 'clean'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);

  function computeNumericStats(values: number[]) {
  const n = values.length;
  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const mean = values.reduce((a, b) => a + b, 0) / n;

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;

  const std = Math.sqrt(variance);

  return { min, max, mean, median, std, variance };
}


  // Generate histogram data from dataset + dtype ------------------------------------------------------------ 1866-1924
function generateHistogram(columnName: string, dtype: string) {
  if (!dataset) return null;

  const values = dataset.data.map((row) => row[columnName]);

  // --- Numeric attributes ---
  if (dtype === "numeric") {
    // const numericValues = values.filter((v) => typeof v === "number") as number[];
    // if (numericValues.length === 0) return null;

    // const min = Math.min(...numericValues);
    // const max = Math.max(...numericValues);

    // // 10 bins
    // const numBins = 10;
    // const binSize = (max - min) / numBins;

    // const bins = Array.from({ length: numBins + 1 }, (_, i) => min + i * binSize);

    // const frequencies = Array(numBins).fill(0);
    // numericValues.forEach((v) => {
    //   const index = Math.min(Math.floor((v - min) / binSize), numBins - 1);
    //   frequencies[index]++;
    // });

    // return {
    //   column: columnName,
    //   bins,
    //   frequencies,
    //   min,
    //   max,
    //   type: "numeric" as const,
    // };
    return null; // Placeholder to avoid syntax error
  }

  // --- Categorical attributes ---
  if (dtype === "categorical") {
    const categories: Record<string, number> = {};

    values.forEach((v) => {
      const key = String(v);
      categories[key] = (categories[key] || 0) + 1;
    });

    return {
      column: columnName,
      type: "categorical" as const,
      categories: Object.keys(categories),
      categoryCounts: Object.values(categories),
      bins: [],
      frequencies: [],
      min: 0,
      max: 0,
    };
  }

  return null;
}
 
// Numeric statistics card component ------------------------------------------------------------

function NumericStatsCard({ values }: { values: number[] }) {
  const stats = computeNumericStats(values);
  if (!stats) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mt-3">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Numeric Summary
      </h4>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Min</div>
          <div className="font-semibold">{stats.min.toFixed(4)}</div>
        </div>

        <div>
          <div className="text-gray-500 dark:text-gray-400">Max</div>
          <div className="font-semibold">{stats.max.toFixed(4)}</div>
        </div>

        <div>
          <div className="text-gray-500 dark:text-gray-400">Mean</div>
          <div className="font-semibold">{stats.mean.toFixed(4)}</div>
        </div>

        <div>
          <div className="text-gray-500 dark:text-gray-400">Median</div>
          <div className="font-semibold">{stats.median.toFixed(4)}</div>
        </div>

        <div>
          <div className="text-gray-500 dark:text-gray-400">Std Dev</div>
          <div className="font-semibold">{stats.std.toFixed(4)}</div>
        </div>

        <div>
          <div className="text-gray-500 dark:text-gray-400">Variance</div>
          <div className="font-semibold">{stats.variance.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}


//--- End histogram generation ---

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string | number> = {};
          
          headers.forEach((header, index) => {
            const stringValue = values[index] || '';
            const numericValue = parseFloat(stringValue);
            if (stringValue !== '' && !isNaN(numericValue) && isFinite(numericValue)) {
              row[header] = numericValue;
            } else {
              row[header] = stringValue;
            }
          });
          
          return row;
        }).filter(row => {
          const values = Object.values(row);
          return values.length > 0 && !values.every(v => v === '');
        });

        const newDataset = DatasetTools.createDataset(file.name.replace('.csv', ''), data);
        setDataset(newDataset);
        setActiveTab('analyze');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing file. Please ensure it\'s a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // const analyzeDataset = async () => {
  //   if (!dataset) return;

  //   setLoading(true);
  //   try {
  //     const agent = new DataScientistAgent();
  //     const analysisResult = await agent.analyzeDataset(dataset.info);
  //     setAnalysis(analysisResult);
  //   } catch (error) {
  //     alert('Error analyzing dataset');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const analyzeDataset = async () => {
    if (!dataset) return;

    setLoading(true);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ datasetInfo: dataset.info }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (data.analysis) {
      setAnalysis(data.analysis);
    } else {
      alert("Error analyzing dataset");
    }

    setLoading(false);
  };



  const cleanDataset = async () => {
    if (!dataset) return;

    setIsCleaning(true);
    setCleaningProgress(0);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const operations = [
      'remove_duplicates',
      'fill_numeric_missing', 
      'fill_categorical_missing'
    ];

    const progressInterval = setInterval(() => {
      setCleaningProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 100);

    try {
      const cleanedDataset = DatasetTools.cleanDataset(dataset, operations);
      setDataset(cleanedDataset);
      setCleaningProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setActiveTab('analyze');
    } catch (error) {
      console.error('Cleaning error:', error);
      alert('Error cleaning dataset');
    } finally {
      clearInterval(progressInterval);
      setIsCleaning(false);
      setCleaningProgress(0);
    }
  };

  const downloadCleanedData = () => {
    if (!dataset) return;

    const headers = dataset.columns;
    const csvContent = [
      headers.join(','),
      ...dataset.data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_cleaned.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearDataset = () => {
    setDataset(null);
    setAnalysis('');
    setActiveTab('upload');
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30 transition-colors duration-300">
      <div className="min-h-screen bg-gradient-to-br from-white to-sky-50 dark:from-gray-950 dark:to-gray-900 transition-colors duration-500 text-gray-900 dark:text-gray-100">
      {/* <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-x-hidden"> */}
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DataScientist AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Data Analysis & Cleaning</p>
              </div>
            </div>
            
            {dataset && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{dataset.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dataset.info.shape[0]} rows × {dataset.info.shape[1]} columns
                    {dataset.cleaned && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        Cleaned
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={clearDataset}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Enhanced Input Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Analysis</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Analyze and Clean Your Datasets
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Upload your CSV files for intelligent analysis and automated data cleaning
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-fit mx-auto mb-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Data
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              disabled={!dataset}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'analyze'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analyze
            </button>
            <button
              onClick={() => setActiveTab('clean')}
              disabled={!dataset}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'clean'
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Eraser className="w-4 h-4" />
              Clean Data
            </button>
          </div>
        </section>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <div
                className={`relative rounded-3xl p-12 text-center transition-all ${
                  isDragging
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30 inline-block mb-6">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Upload Your Dataset
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  Drag and drop your CSV file or click to browse
                </p>
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-8 py-4 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                >
                  <Upload className="w-5 h-5" />
                  Choose CSV File
                </label>
                
                <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-3">
                    <Database className="w-5 h-5 text-emerald-500" />
                    Supported Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      CSV files with headers
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Automatic data typing
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Numeric & categorical support
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      Quality assessment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analyze Tab */}
          {activeTab === 'analyze' && dataset && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Dataset Overview */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dataset Overview</h2>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dataset.info.shape[0]}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Rows</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{dataset.info.shape[1]}</div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Columns</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {dataset.info.missingValues.reduce((sum, mv) => sum + mv.count, 0)}
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Missing Values</div>
                    </div>
                  </div>

                  {/* Data Types Overview */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Data Types Distribution</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        dataset.info.columns.reduce((acc, col) => {
                          acc[col.dtype] = (acc[col.dtype] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([dtype, count]) => (
                        <span
                          key={dtype}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                            dtype === 'numeric' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                            dtype === 'categorical' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                            'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {dtype} <span className="text-xs opacity-75">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column Details */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Column Details</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {dataset.info.columns.map((column, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{column.name}</span>
                            <span className={`ml-3 px-2 py-1 rounded-lg text-xs font-semibold ${
                              // column.dtype === 'numeric' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                              // column.dtype === 'categorical' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                              
                              'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                            }`}>
                              {column.dtype}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {((column.nonNullCount / dataset.info.shape[0]) * 100).toFixed(1)}% Complete
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {column.nullCount} null values
                            </div>
                          </div>
                        </div>
                        {column.nullCount > 0 && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${(column.nullCount / dataset.info.shape[0]) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* // Histogram */}
                {/* // Distribution Details */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Distribution Details</h3>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {dataset.info.columns.map((column, index) => {
                      const hist = generateHistogram(column.name, column.dtype);

                      // Extract numeric values for stats
                      const numericValues =
                        column.dtype === "numeric"
                          ? dataset.data
                              .map((row) => Number(row[column.name]))
                              .filter((v) => !isNaN(v))
                          : [];

                      const stats =
                        column.dtype === "numeric" && numericValues.length > 0
                          ? computeNumericStats(numericValues)
                          : null;

                      return (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors space-y-4"
                        >
                          {/* -------------------------------------- */}
                          {/* COLUMN HEADER */}
                          {/* -------------------------------------- */}
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">{column.name}</span>
                              <span
                                className={`ml-3 px-2 py-1 rounded-lg text-xs font-semibold ${
                                  column.dtype === "numeric"
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                {column.dtype}
                              </span>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {((column.nonNullCount / dataset.info.shape[0]) * 100).toFixed(1)}% Complete
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {column.nullCount} null values
                              </div>
                            </div>
                          </div>

                          {/* -------------------------------------- */}
                          {/* MISSING VALUES BAR */}
                          {/* -------------------------------------- */}
                          {column.nullCount > 0 && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                style={{ width: `${(column.nullCount / dataset.info.shape[0]) * 100}%` }}
                              ></div>
                            </div>
                          )}

                          {/* -------------------------------------- */}
                          {/* CATEGORICAL HISTOGRAM OR NUMERIC STATS */}
                          {/* -------------------------------------- */}
                          <div className="mt-2 pt-4 border-t border-gray-300 dark:border-gray-700">
                            {column.dtype === "categorical" && hist ? (
                              <HistogramChart data={hist} height={160} showTitle={false} />
                            ) : null}

                            {column.dtype === "numeric" && stats && (
                              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Min</div>
                                  <div className="font-semibold">{stats.min.toFixed(4)}</div>
                                </div>

                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Max</div>
                                  <div className="font-semibold">{stats.max.toFixed(4)}</div>
                                </div>

                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Mean</div>
                                  <div className="font-semibold">{stats.mean.toFixed(4)}</div>
                                </div>

                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Median</div>
                                  <div className="font-semibold">{stats.median.toFixed(4)}</div>
                                </div>

                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Std Dev</div>
                                  <div className="font-semibold">{stats.std.toFixed(4)}</div>
                                </div>

                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Variance</div>
                                  <div className="font-semibold">{stats.variance.toFixed(4)}</div>
                                </div>
                              </div>
                            )}

                            {/* For numeric with no stats */}
                            {column.dtype === "numeric" && !stats && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                No numeric data available
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* End of Distribution part */}
              </div>

              {/* AI Analysis */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Analysis</h2>
                </div>

                {analysis ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                        {analysis}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl inline-block mb-4 border border-gray-200 dark:border-gray-700">
                      <Brain className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Get AI-Powered Insights
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Leverage Google Gemini AI to analyze patterns, identify data quality issues, and receive professional recommendations.
                    </p>
                  </div>
                )}

                <button
                  onClick={analyzeDataset}
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analyze with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Clean Tab */}
          {activeTab === 'clean' && dataset && (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Data Quality Issues */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Quality Assessment</h2>
                  </div>

                  {dataset.info.missingValues.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Missing Values Detected</h3>
                      {dataset.info.missingValues.map((mv, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-900 dark:text-white">{mv.column}</span>
                            <span className="text-orange-700 dark:text-orange-300 font-bold">{mv.count} missing values</span>
                          </div>
                          <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2.5 mb-2">
                            <div 
                              className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${mv.percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600 dark:text-orange-400 font-medium">Data Completeness</span>
                            <span className="text-orange-700 dark:text-orange-300 font-semibold">
                              {(100 - mv.percentage).toFixed(1)}% Complete
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl inline-block mb-4 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Excellent Data Quality</h3>
                      <p className="text-gray-600 dark:text-gray-400">Your dataset is ready for advanced analysis.</p>
                    </div>
                  )}
                </div>

                {/* Cleaning Operations */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg">
                      <Eraser className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Cleaning</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Automated Cleaning Pipeline
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Our intelligent system will apply optimized cleaning operations to enhance your dataset quality.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Cleaning Operations:</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Remove Duplicates</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Eliminate duplicate rows</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">2</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Fill Numeric Gaps</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Mean imputation for numbers</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">3</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Handle Categorical Data</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">"Unknown" for missing text</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {isCleaning ? (
                        <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-gray-900 dark:text-white">Cleaning in Progress</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(cleaningProgress)}%</span>
                          </div>
                          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${cleaningProgress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Processing {dataset.info.shape[0].toLocaleString()} rows...</span>
                            <span>
                              {cleaningProgress < 100 ? 'Optimizing dataset' : 'Complete!'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={cleanDataset}
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 flex items-center justify-center gap-3"
                        >
                          <Eraser className="w-5 h-5" />
                          Execute Data Cleaning
                        </button>
                      )}

                      {dataset.cleaned && !isCleaning && (
                        <button
                          onClick={downloadCleanedData}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Download className="w-5 h-5" />
                          Download Cleaned Dataset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

