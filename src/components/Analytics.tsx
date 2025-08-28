import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface AnalyticsProps {
  selectedBatch: Id<"batches"> | null;
}

export function Analytics({ selectedBatch }: AnalyticsProps) {
  const analytics = useQuery(api.potatoes.getAnalytics, {
    batchId: selectedBatch || undefined,
  });

  if (!analytics) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const defectTypeEntries = Object.entries(analytics.defectTypes);
  const totalDefects = defectTypeEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        {selectedBatch && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Batch Analysis
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Analyzed</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalPredictions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🥔</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{analytics.healthyPredictions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Defective</p>
              <p className="text-2xl font-bold text-red-600">{analytics.defectivePredictions}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">❌</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Defect Rate</p>
              <p className="text-2xl font-bold text-orange-600">{analytics.defectRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Type Distribution */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Defect Type Distribution</h3>
          {defectTypeEntries.length > 0 ? (
            <div className="space-y-3">
              {defectTypeEntries.map(([type, count]) => {
                const percentage = totalDefects > 0 ? (count / totalDefects) * 100 : 0;
                const label = type === "hollow_heart" ? "Hollow Heart" :
                             type === "black_heart" ? "Black Heart" :
                             type === "internal_heat_necrosis" ? "Internal Heat Necrosis" : type;
                
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No defects detected yet</p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analytics.avgConfidence}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-800">{analytics.avgConfidence}%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Processing Time</span>
              <span className="font-medium text-gray-800">{analytics.avgProcessingTime}ms</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Model Version</span>
              <span className="font-medium text-gray-800">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Insights */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quality Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Quality Score</h4>
            <p className="text-2xl font-bold text-green-600">
              {analytics.totalPredictions > 0 ? (100 - analytics.defectRate).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-green-600 mt-1">Overall batch quality</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">AI Confidence</h4>
            <p className="text-2xl font-bold text-blue-600">{analytics.avgConfidence}%</p>
            <p className="text-sm text-blue-600 mt-1">Model certainty</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2">Efficiency</h4>
            <p className="text-2xl font-bold text-purple-600">
              {analytics.avgProcessingTime < 500 ? "High" : analytics.avgProcessingTime < 1000 ? "Medium" : "Low"}
            </p>
            <p className="text-sm text-purple-600 mt-1">{analytics.avgProcessingTime}ms avg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
