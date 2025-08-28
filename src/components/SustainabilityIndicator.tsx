import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SustainabilityIndicator() {
  const sustainabilityData = useQuery(api.potatoes.getSustainabilityMetrics);

  if (!sustainabilityData) {
    return null;
  }

  const { totals } = sustainabilityData;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 text-lg">🌱</span>
        <h3 className="font-semibold text-green-800">Sustainability Impact</h3>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-green-700">Potatoes Saved:</span>
          <span className="font-medium text-green-800">{totals.potatoesSaved}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">Waste Reduced:</span>
          <span className="font-medium text-green-800">{totals.wasteReduced.toFixed(1)}kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">CO₂ Saved:</span>
          <span className="font-medium text-green-800">{totals.co2Saved.toFixed(1)}kg</span>
        </div>
        {totals.economicImpact > 0 && (
          <div className="flex justify-between">
            <span className="text-green-700">Economic Impact:</span>
            <span className="font-medium text-green-800">${totals.economicImpact.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
