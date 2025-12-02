'use client';

import React from 'react';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface HistogramChartProps {
  data: {
    column: string;
    bins: number[];
    frequencies: number[];
    min: number;
    max: number;
    type: 'numeric' | 'categorical';
    categories?: string[];
    categoryCounts?: number[];
  };
  height?: number;
  showTitle?: boolean;
}

export default function HistogramChart({ 
  data, 
  height = 200,
  showTitle = true 
}: HistogramChartProps) {
  const { column, bins, frequencies, min, max, type, categories, categoryCounts } = data;
  
  // For numeric histograms
  if (type === 'numeric' && bins.length > 0) {
    const maxFrequency = Math.max(...frequencies);
    const barWidth = 100 / frequencies.length;
    
    return (
      <div className="space-y-3">
        {showTitle && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{column}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Range: {min.toFixed(2)} - {max.toFixed(2)}
            </span>
          </div>
        )}
        
        <div className="relative" style={{ height: `${height}px` }}>
          <div className="absolute inset-0 flex items-end">
            {frequencies.map((freq, index) => (
              <div
                key={index}
                className="flex flex-col items-center"
                style={{ width: `${barWidth}%` }}
              >
                <div
                  className="w-3/4 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md transition-all hover:from-blue-400 hover:to-blue-200"
                  style={{ 
                    height: `${(freq / maxFrequency) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${freq} values in ${bins[index].toFixed(2)} - ${bins[index + 1]?.toFixed(2) || max.toFixed(2)}`}
                >
                  <div className="absolute -top-6 text-xs text-gray-500 dark:text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
                    {freq}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{bins[0]?.toFixed(1)}</span>
            <span>{bins[Math.floor(bins.length / 2)]?.toFixed(1)}</span>
            <span>{bins[bins.length - 1]?.toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // For categorical histograms
  if (type === 'categorical' && categories && categoryCounts) {
    const maxCount = Math.max(...categoryCounts);
    const totalCount = categoryCounts.reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="space-y-3">
        {showTitle && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{column}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {categories.length} categories
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          {categories.map((category, index) => {
            const percentage = (categoryCounts[index] / totalCount) * 100;
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                    {category}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {categoryCounts[index]} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-green-400 h-2 rounded-full transition-all"
                    style={{ width: `${(categoryCounts[index] / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
      <div className="text-center">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No histogram data available</p>
      </div>
    </div>
  );
}