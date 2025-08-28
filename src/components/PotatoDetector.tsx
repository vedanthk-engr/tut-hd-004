import { useState, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { ModeToggle } from "./ModeToggle";
import { ImageUpload } from "./ImageUpload";
import { PredictionResult } from "./PredictionResult";
import { BatchManager } from "./BatchManager";
import { ConveyorBelt } from "./ConveyorBelt";
import { Analytics } from "./Analytics";
import { SustainabilityIndicator } from "./SustainabilityIndicator";

export type ViewMode = "normal" | "advanced";
export type ActiveTab = "detector" | "batches" | "analytics" | "conveyor";

export interface PredictionData {
  _id: Id<"predictions">;
  isDefective: boolean;
  defectConfidence: number;
  defectType?: "hollow_heart" | "black_heart" | "internal_heat_necrosis";
  defectTypeConfidence?: number;
  severityLevel?: "mild" | "moderate" | "severe";
  processingTime: number;
  modelVersion: string;
  heatmapData?: string;
  imageUrl?: string;
}

export function PotatoDetector() {
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [activeTab, setActiveTab] = useState<ActiveTab>("detector");
  const [selectedBatch, setSelectedBatch] = useState<Id<"batches"> | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateUploadUrl = useMutation(api.potatoes.generateUploadUrl);
  const processPotato = useAction(api.potatoes.processPotato);
  const batches = useQuery(api.potatoes.getUserBatches) || [];

  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      
      // Process with AI
      const prediction = await processPotato({
        imageId: storageId,
        batchId: selectedBatch || undefined,
      });
      
      // Get image URL for display
      const imageUrl = URL.createObjectURL(file);
      
      setCurrentPrediction({
        _id: prediction.predictionId,
        ...prediction,
        imageUrl,
      });
      
      toast.success("Potato analyzed successfully!");
      
    } catch (error) {
      console.error("Error processing potato:", error);
      toast.error("Failed to process potato image");
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: "detector" as const, label: "Detector", icon: "🔍" },
    { id: "batches" as const, label: "Batches", icon: "📦" },
    { id: "analytics" as const, label: "Analytics", icon: "📊" },
    { id: "conveyor" as const, label: "Conveyor", icon: "🏭" },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-between items-center">
        <ModeToggle viewMode={viewMode} onModeChange={setViewMode} />
        <SustainabilityIndicator />
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === "detector" && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Upload */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Upload Potato Image
                  </h3>
                  
                  {/* Batch Selection */}
                  {batches.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Batch (Optional)
                      </label>
                      <select
                        value={selectedBatch || ""}
                        onChange={(e) => setSelectedBatch(e.target.value as Id<"batches"> || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">No batch (single analysis)</option>
                        {batches.map((batch) => (
                          <option key={batch._id} value={batch._id}>
                            {batch.name} ({batch.processedPotatoes} processed)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <ImageUpload
                    onImageUpload={handleImageUpload}
                    isProcessing={isProcessing}
                  />
                </div>
              </div>

              {/* Right Column - Results */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Analysis Results
                </h3>
                <PredictionResult
                  prediction={currentPrediction}
                  viewMode={viewMode}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "batches" && (
          <div className="p-6">
            <BatchManager
              selectedBatch={selectedBatch}
              onBatchSelect={setSelectedBatch}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="p-6">
            <Analytics selectedBatch={selectedBatch} />
          </div>
        )}

        {activeTab === "conveyor" && (
          <div className="p-6">
            <ConveyorBelt />
          </div>
        )}
      </div>
    </div>
  );
}
