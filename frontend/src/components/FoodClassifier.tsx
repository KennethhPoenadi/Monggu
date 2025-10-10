import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Check } from 'lucide-react';

interface FoodAnalysis {
  primary_food_type: string;
  confidence: number;
  category: string;
  confidence_level: string;
  alternative_types: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  is_food: boolean;
  detailed_predictions: Array<{
    food_type: string;
    confidence: number;
    category: string;
    source: string;
  }>;
  nutritional_info: {
    found: boolean;
    food: string;
    nutrition?: {
      kalori?: number;
      karbohidrat?: number;
      protein?: number;
      lemak?: number;
    };
    message?: string;
  };
  processing_time: number;
  metadata: {
    file_name: string;
    file_size: number;
    ai_model: string;
  };
}

interface FoodClassifierProps {
  onFoodDetected?: (foodType: string, analysis: FoodAnalysis) => void;
  className?: string;
}

const FoodClassifier: React.FC<FoodClassifierProps> = ({ 
  onFoodDetected, 
  className = "" 
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setError(null);
    setAnalysis(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const analyzeFood = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedImage);

      const response = await fetch('http://localhost:8000/ai/classify-food', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('API Response:', data); // Debug log

      // Check if the response is successful (new format)
      if (data.success === true || response.ok) {
        // Handle new API response format
        const foodAnalysis: FoodAnalysis = {
          primary_food_type: data.primary_food_type,
          confidence: data.confidence,
          category: data.category,
          confidence_level: data.confidence_level,
          alternative_types: data.alternative_types || [],
          is_food: data.is_food,
          detailed_predictions: data.detailed_predictions || [],
          nutritional_info: data.nutritional_info || { found: false, food: data.primary_food_type },
          processing_time: data.processing_time || 0,
          metadata: data.metadata || {}
        };
        
        setAnalysis(foodAnalysis);
        
        if (onFoodDetected) {
          onFoodDetected(foodAnalysis.primary_food_type, foodAnalysis);
        }
      } else {
        setError(data.detail || 'Failed to analyze image');
      }
    } catch (err) {
      setError('Error connecting to AI service');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          🤖 AI Food Classifier
        </h3>
        <p className="text-gray-600">
          Upload an image to automatically detect food type
        </p>
      </div>

      {/* Upload Area */}
      {!imagePreview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-400 transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Upload Food Image
              </p>
              <p className="text-gray-500 text-sm">
                PNG, JPG, or JPEG up to 10MB
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Choose Image
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imagePreview}
              alt="Food preview"
              className="w-full h-64 object-cover rounded-2xl shadow-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={analyzeFood}
              disabled={isAnalyzing}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Analyze Food
                  </>
                )}
              </span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-2xl transition-colors"
            >
              Change Image
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-bold text-gray-800">Analysis Results</h4>
              </div>

              {/* Primary Detection */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-800">Primary Detection:</h5>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                      {(analysis.confidence * 100).toFixed(1)}% confident
                    </span>
                    {analysis.confidence_level && (
                      <span className="text-xs text-gray-500 mt-1">
                        Level: {analysis.confidence_level.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-green-600">
                    🍽️ {analysis.primary_food_type}
                  </p>
                  {analysis.category && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {analysis.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Alternative Types */}
              {analysis.alternative_types && analysis.alternative_types.length > 0 && (
                <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <h5 className="font-semibold text-gray-800 mb-2">Alternative Possibilities:</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.alternative_types.map((type, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {typeof type === 'string' ? type : type.name} 
                        {typeof type === 'object' && type.confidence && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({(type.confidence * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Predictions */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <h5 className="font-semibold text-gray-800 mb-3">Detailed Analysis:</h5>
                <div className="space-y-2">
                  {analysis.detailed_predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex flex-col">
                        <span className="text-gray-700">{prediction.food_type}</span>
                        {prediction.category && (
                          <span className="text-xs text-gray-500">Category: {prediction.category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${prediction.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12">
                          {(prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutritional Information */}
              {analysis.nutritional_info?.found && analysis.nutritional_info.nutrition && (
                <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                  <h5 className="font-semibold text-gray-800 mb-3">🥗 Nutritional Information (per 100g):</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.nutritional_info.nutrition.kalori && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <span className="text-orange-600 font-medium">Calories</span>
                        <p className="text-lg font-bold text-orange-800">{analysis.nutritional_info.nutrition.kalori} kcal</p>
                      </div>
                    )}
                    {analysis.nutritional_info.nutrition.protein && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <span className="text-red-600 font-medium">Protein</span>
                        <p className="text-lg font-bold text-red-800">{analysis.nutritional_info.nutrition.protein}g</p>
                      </div>
                    )}
                    {analysis.nutritional_info.nutrition.karbohidrat && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-blue-600 font-medium">Carbs</span>
                        <p className="text-lg font-bold text-blue-800">{analysis.nutritional_info.nutrition.karbohidrat}g</p>
                      </div>
                    )}
                    {analysis.nutritional_info.nutrition.lemak && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <span className="text-yellow-600 font-medium">Fat</span>
                        <p className="text-lg font-bold text-yellow-800">{analysis.nutritional_info.nutrition.lemak}g</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing Info */}
              {analysis.processing_time && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>🤖 AI Model: {analysis.metadata?.ai_model || 'Advanced Food Classifier'}</span>
                    <span>⏱️ Processing: {analysis.processing_time.toFixed(2)}s</span>
                  </div>
                </div>
              )}

              {/* Food Detection Status */}
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  analysis.is_food 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {analysis.is_food ? '✅ Food detected' : '⚠️ Low confidence food detection'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodClassifier;