import React, { useState } from 'react';
import FoodClassifier from '../components/FoodClassifier';

interface FoodAnalysis {
  primary_food_type: string;
  confidence: number;
  alternative_types: string[];
  is_food: boolean;
  detailed_predictions: Array<{
    food_type: string;
    confidence: number;
    category_id: number;
  }>;
}

const AIFoodPage: React.FC = () => {
  const [detectedFoods, setDetectedFoods] = useState<Array<{
    foodType: string;
    analysis: FoodAnalysis;
    timestamp: Date;
  }>>([]);

  const handleFoodDetected = (foodType: string, analysis: FoodAnalysis) => {
    setDetectedFoods(prev => [
      {
        foodType,
        analysis,
        timestamp: new Date()
      },
      ...prev.slice(0, 4) // Keep only last 5 detections
    ]);
  };

  const clearHistory = () => {
    setDetectedFoods([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🤖 AI Food Detection
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Upload photos of your food to automatically detect and classify food types using advanced computer vision AI
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Food Classifier Component */}
          <div>
            <FoodClassifier 
              onFoodDetected={handleFoodDetected}
              className="h-fit"
            />

            {/* Features Info */}
            <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">✨ AI Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    🎯
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">Accurate Detection</p>
                    <p className="text-sm text-gray-600">Identifies 20+ food categories</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    ⚡
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">Real-time Analysis</p>
                    <p className="text-sm text-gray-600">Instant food classification</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    📊
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">Confidence Scoring</p>
                    <p className="text-sm text-gray-600">Shows prediction accuracy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    🔄
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800">Multiple Suggestions</p>
                    <p className="text-sm text-gray-600">Alternative food possibilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detection History */}
          <div>
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">📋 Detection History</h3>
                {detectedFoods.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {detectedFoods.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-gray-500 text-lg">No detections yet</p>
                  <p className="text-gray-400 text-sm">Upload an image to see AI analysis results</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {detectedFoods.map((detection, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            🍽️
                          </span>
                          <div>
                            <h4 className="font-bold text-gray-800">
                              {detection.foodType}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {detection.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          detection.analysis.confidence >= 0.7 
                            ? 'bg-green-100 text-green-700'
                            : detection.analysis.confidence >= 0.5
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {(detection.analysis.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      {detection.analysis.alternative_types.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-600 mb-1">Alternatives:</p>
                          <div className="flex flex-wrap gap-1">
                            {detection.analysis.alternative_types.slice(0, 3).map((type, i) => (
                              <span
                                key={i}
                                className="bg-white text-gray-600 px-2 py-1 rounded-full text-xs"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span className={`flex items-center gap-1 ${
                          detection.analysis.is_food ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {detection.analysis.is_food ? '✅ Food' : '⚠️ Uncertain'}
                        </span>
                        <span className="text-gray-400">
                          {detection.analysis.detailed_predictions.length} predictions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Usage Tips */}
            <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Tips for Better Results</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">📸</span>
                  <div>
                    <p className="font-semibold text-gray-800">Good Lighting</p>
                    <p className="text-gray-600">Take photos in well-lit conditions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">🎯</span>
                  <div>
                    <p className="font-semibold text-gray-800">Clear Focus</p>
                    <p className="text-gray-600">Make sure food is the main subject</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-500 mt-1">📏</span>
                  <div>
                    <p className="font-semibold text-gray-800">Close-up Shots</p>
                    <p className="text-gray-600">Get closer to the food for better detail</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">🔧</span>
                  <div>
                    <p className="font-semibold text-gray-800">Single Item</p>
                    <p className="text-gray-600">Works best with one main food item</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFoodPage;