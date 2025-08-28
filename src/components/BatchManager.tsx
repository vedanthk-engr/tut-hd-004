import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface BatchManagerProps {
  selectedBatch: Id<"batches"> | null;
  onBatchSelect: (batchId: Id<"batches"> | null) => void;
}

export function BatchManager({ selectedBatch, onBatchSelect }: BatchManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDescription, setNewBatchDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");

  const batches = useQuery(api.potatoes.getUserBatches) || [];
  const createBatch = useMutation(api.potatoes.createBatch);
  const generateBatchReport = useAction(api.reports.generateBatchReport);
  const generateBatchQR = useMutation(api.reports.generateBatchQR);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    try {
      const batchId = await createBatch({
        name: newBatchName.trim(),
        description: newBatchDescription.trim() || undefined,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      });
      
      toast.success("Batch created successfully!");
      setNewBatchName("");
      setNewBatchDescription("");
      setEstimatedValue("");
      setShowCreateForm(false);
      onBatchSelect(batchId);
    } catch (error) {
      toast.error("Failed to create batch");
    }
  };

  const handleGenerateReport = async (batchId: Id<"batches">, type: "batch_summary" | "detailed_analysis") => {
    try {
      const report = await generateBatchReport({
        batchId,
        reportType: type,
        format: "json",
      });
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-report-${batchId}-${type}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Report generated and downloaded!");
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const handleGenerateQR = async (batchId: Id<"batches">) => {
    try {
      const qrCode = await generateBatchQR({ batchId });
      
      // Create QR code display (simplified - in production would use QR library)
      const qrWindow = window.open("", "_blank");
      if (qrWindow) {
        qrWindow.document.write(`
          <html>
            <head><title>Batch QR Code</title></head>
            <body style="text-align: center; padding: 20px;">
              <h2>Batch QR Code</h2>
              <div style="border: 2px solid #000; padding: 20px; display: inline-block;">
                <p>QR Code Data:</p>
                <code>${qrCode}</code>
              </div>
              <p><small>In production, this would be a scannable QR code</small></p>
            </body>
          </html>
        `);
      }
      
      toast.success("QR code generated!");
    } catch (error) {
      toast.error("Failed to generate QR code");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Batch Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          + New Batch
        </button>
      </div>

      {/* Create Batch Form */}
      {showCreateForm && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Batch</h3>
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name *
              </label>
              <input
                type="text"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Morning Harvest - Field A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newBatchDescription}
                onChange={(e) => setNewBatchDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Optional description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Value ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Create Batch
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batch List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch) => (
          <div
            key={batch._id}
            className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedBatch === batch._id
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onBatchSelect(batch._id)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-800 truncate">{batch.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                batch.status === "active" ? "bg-green-100 text-green-700" :
                batch.status === "completed" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {batch.status}
              </span>
            </div>
            
            {batch.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{batch.description}</p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Processed:</span>
                <span className="font-medium">{batch.processedPotatoes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Defective:</span>
                <span className={`font-medium ${
                  batch.defectivePotatoes > 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {batch.defectivePotatoes}
                </span>
              </div>
              {batch.estimatedLoss !== undefined && batch.estimatedLoss > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Loss:</span>
                  <span className="font-medium text-red-600">
                    ${batch.estimatedLoss.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateReport(batch._id, "batch_summary");
                }}
                className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
              >
                📊 Report
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateQR(batch._id);
                }}
                className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              >
                📱 QR Code
              </button>
            </div>
          </div>
        ))}
      </div>

      {batches.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No batches yet</h3>
          <p className="text-gray-600 mb-4">Create your first batch to start organizing potato inspections</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Create First Batch
          </button>
        </div>
      )}
    </div>
  );
}
