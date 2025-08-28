import { ViewMode } from "./PotatoDetector";

interface ModeToggleProps {
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ModeToggle({ viewMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-700">View Mode:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onModeChange("normal")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "normal"
              ? "bg-green-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          👨‍🌾 Normal Mode
        </button>
        <button
          onClick={() => onModeChange("advanced")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "advanced"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          🔬 Advanced Mode
        </button>
      </div>
    </div>
  );
}
