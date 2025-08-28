import { useState, useEffect } from "react";

interface Potato {
  id: string;
  x: number;
  isDefective: boolean;
  defectType?: string;
}

export function ConveyorBelt() {
  const [potatoes, setPotatoes] = useState<Potato[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [stats, setStats] = useState({
    processed: 0,
    healthy: 0,
    defective: 0,
  });

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setPotatoes(prev => {
        // Move existing potatoes
        const moved = prev.map(potato => ({
          ...potato,
          x: potato.x + speed,
        }));

        // Remove potatoes that have passed through
        const remaining = moved.filter(potato => {
          if (potato.x > 800) {
            setStats(s => ({
              processed: s.processed + 1,
              healthy: s.healthy + (potato.isDefective ? 0 : 1),
              defective: s.defective + (potato.isDefective ? 1 : 0),
            }));
            return false;
          }
          return true;
        });

        // Add new potato occasionally
        if (Math.random() < 0.02) {
          const isDefective = Math.random() < 0.3;
          remaining.push({
            id: Date.now().toString(),
            x: -50,
            isDefective,
            defectType: isDefective ? 
              ["hollow_heart", "black_heart", "internal_heat_necrosis"][Math.floor(Math.random() * 3)] :
              undefined,
          });
        }

        return remaining;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, speed]);

  const resetSimulation = () => {
    setPotatoes([]);
    setStats({ processed: 0, healthy: 0, defective: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Conveyor Belt Simulation</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isRunning 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isRunning ? "⏸️ Stop" : "▶️ Start"}
          </button>
          <button
            onClick={resetSimulation}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Speed:</label>
          <input
            type="range"
            min="1"
            max="5"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm text-gray-600">{speed}x</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.processed}</p>
          <p className="text-sm text-gray-600">Processed</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
          <p className="text-sm text-gray-600">Healthy</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.defective}</p>
          <p className="text-sm text-gray-600">Defective</p>
        </div>
      </div>

      {/* Conveyor Belt Visualization */}
      <div className="bg-white border rounded-lg p-6">
        <div className="relative">
          {/* Conveyor Belt */}
          <div className="w-full h-32 bg-gray-800 rounded-lg relative overflow-hidden">
            {/* Belt pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 opacity-50"></div>
            
            {/* Potatoes */}
            {potatoes.map(potato => (
              <div
                key={potato.id}
                className={`absolute top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-100 ${
                  potato.isDefective 
                    ? "bg-red-500 border-2 border-red-600" 
                    : "bg-yellow-600 border-2 border-yellow-700"
                }`}
                style={{ left: `${potato.x}px` }}
              >
                🥔
              </div>
            ))}
            
            {/* AI Scanner */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-500 opacity-75">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                AI Scanner
              </div>
            </div>
          </div>

          {/* Sorting Bins */}
          <div className="flex justify-end mt-4 gap-4">
            <div className="w-24 h-16 bg-green-100 border-2 border-green-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-green-600 font-bold">✅</div>
                <div className="text-xs text-green-700">Healthy</div>
              </div>
            </div>
            <div className="w-24 h-16 bg-red-100 border-2 border-red-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-600 font-bold">❌</div>
                <div className="text-xs text-red-700">Defective</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
            <span>Healthy Potato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Defective Potato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500"></div>
            <span>AI Scanner</span>
          </div>
        </div>
      </div>

      {/* IoT Integration Mock */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">🔗 IoT Integration Ready</h3>
        <p className="text-sm text-blue-700 mb-3">
          This simulation demonstrates how the AI system would integrate with real conveyor belt hardware.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Edge Processing:</span>
            <span className="ml-2 text-blue-600">Real-time defect detection</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Cloud Analytics:</span>
            <span className="ml-2 text-blue-600">Batch reporting & insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
