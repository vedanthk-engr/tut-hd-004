import { ViewMode, PredictionData } from "./PotatoDetector";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface PredictionResultProps {
  prediction: PredictionData | null;
  viewMode: ViewMode;
  isProcessing: boolean;
}

export function PredictionResult({ prediction, viewMode, isProcessing }: PredictionResultProps) {
  const submitFeedback = useMutation(api.potatoes.submitFeedback);

  const handleFeedback = async (feedback: "correct" | "incorrect" | "uncertain") => {
    if (!prediction) return;
    
    try {
      await submitFeedback({
        predictionId: prediction._id,
        feedback,
      });
      toast.success("Feedback submitted! This helps improve our AI model.");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  if (isProcessing) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🥔</span>
        </div>
        <p className="text-gray-600">Upload a potato image to see AI analysis results</p>
      </div>
    );
  }

  const getDefectTypeLabel = (type: string) => {
    switch (type) {
      case "hollow_heart": return "Hollow Heart";
      case "black_heart": return "Black Heart";
      case "internal_heat_necrosis": return "Internal Heat Necrosis";
      default: return type;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild": return "text-yellow-600 bg-yellow-100";
      case "moderate": return "text-orange-600 bg-orange-100";
      case "severe": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (viewMode === "normal") {
    // Farmer-friendly simple view
    return (
      <div className="space-y-4">
        {prediction.imageUrl && (
          <img
            src={prediction.imageUrl}
            alt="Analyzed potato"
            className="w-full h-48 object-cover rounded-lg border"
          />
        )}
        
        <div className={`p-6 rounded-lg border-2 ${
          prediction.isDefective 
            ? "border-red-300 bg-red-50" 
            : "border-green-300 bg-green-50"
        }`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              prediction.isDefective ? "bg-red-500" : "bg-green-500"
            }`}>
              <span className="text-white text-2xl">
                {prediction.isDefective ? "❌" : "✅"}
              </span>
            </div>
            
            <h3 className={`text-2xl font-bold mb-2 ${
              prediction.isDefective ? "text-red-700" : "text-green-700"
            }`}>
              {prediction.isDefective ? "DEFECT DETECTED" : "HEALTHY POTATO"}
            </h3>
            
            <p className={`text-lg ${
              prediction.isDefective ? "text-red-600" : "text-green-600"
            }`}>
              Confidence: {prediction.defectConfidence}%
            </p>
            
            {prediction.isDefective && prediction.defectType && (
              <p className="text-gray-700 mt-2">
                Type: {getDefectTypeLabel(prediction.defectType)}
              </p>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">Was this prediction correct?</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback("correct")}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
            >
              ✅ Correct
            </button>
            <button
              onClick={() => handleFeedback("incorrect")}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
            >
              ❌ Wrong
            </button>
            <button
              onClick={() => handleFeedback("uncertain")}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              🤔 Unsure
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Advanced mode with detailed information
  return (
    <div className="space-y-6">
      {prediction.imageUrl && (
        <div className="relative">
          <img
            src={prediction.imageUrl}
            alt="Analyzed potato"
            className="w-full h-48 object-cover rounded-lg border"
          />
          {prediction.heatmapData && (
            <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg">
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                AI Heatmap Overlay
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Classification */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Primary Classification</h4>
          <div className={`p-3 rounded-lg ${
            prediction.isDefective ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${
                prediction.isDefective ? "text-red-700" : "text-green-700"
              }`}>
                {prediction.isDefective ? "Defective" : "Healthy"}
              </span>
              <span className={`text-sm ${
                prediction.isDefective ? "text-red-600" : "text-green-600"
              }`}>
                {prediction.defectConfidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Classification */}
        {prediction.isDefective && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Defect Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">
                  {prediction.defectType ? getDefectTypeLabel(prediction.defectType) : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{prediction.defectTypeConfidence}%</span>
              </div>
              {prediction.severityLevel && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Severity:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(prediction.severityLevel)}`}>
                    {prediction.severityLevel.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Technical Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Processing Time:</span>
            <span className="ml-2 font-medium">{prediction.processingTime}ms</span>
          </div>
          <div>
            <span className="text-gray-600">Model Version:</span>
            <span className="ml-2 font-medium">{prediction.modelVersion}</span>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Provide Feedback</h4>
        <p className="text-sm text-gray-600 mb-3">
          Your feedback helps improve our AI model accuracy
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleFeedback("correct")}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
          >
            ✅ Correct Prediction
          </button>
          <button
            onClick={() => handleFeedback("incorrect")}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
          >
            ❌ Incorrect Prediction
          </button>
          <button
            onClick={() => handleFeedback("uncertain")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
          >
            🤔 Uncertain
          </button>
        </div>
      </div>
    </div>
  );
}
