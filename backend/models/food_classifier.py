import torch
import torchvision.transforms as transforms
from transformers import AutoImageProcessor, AutoModelForImageClassification, pipeline
from PIL import Image
import io
import json
import numpy as np
from typing import List, Dict, Any
import threading
import logging

class FoodClassifier:
    def __init__(self, model_path: str = None):
        """
        Initialize the food classifier with specialized food classification models
        Using Hugging Face models specifically trained for food recognition
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.processor = None
        self.classifier_pipeline = None
        self.model_lock = threading.Lock()
        
        # Food-specific AI models to try (in order of preference)
        self.food_models = [
            "Kaludi/food-category-classification-v2.0",  # Specialized food classifier
            "nateraw/food",  # Another food classifier
            "microsoft/resnet-50",  # General vision model as fallback
        ]
        
        # Enhanced food translations (English -> Indonesian)
        self.translation_dict = {
            # Fruits
            "banana": "Pisang", "orange": "Jeruk", "apple": "Apel", "pineapple": "Nanas",
            "strawberry": "Strawberry", "lemon": "Lemon", "lime": "Jeruk Nipis", 
            "mango": "Mangga", "papaya": "Pepaya", "watermelon": "Semangka",
            "avocado": "Alpukat", "coconut": "Kelapa", "grape": "Anggur",
            
            # Vegetables  
            "broccoli": "Brokoli", "carrot": "Wortel", "corn": "Jagung",
            "bell pepper": "Paprika", "tomato": "Tomat", "onion": "Bawang",
            "potato": "Kentang", "spinach": "Bayam", "cabbage": "Kubis",
            "lettuce": "Selada", "cucumber": "Timun", "mushroom": "Jamur",
            "eggplant": "Terong", "chili": "Cabai", "ginger": "Jahe",
            
            # Proteins
            "chicken": "Ayam", "beef": "Daging Sapi", "pork": "Daging Babi",
            "fish": "Ikan", "shrimp": "Udang", "egg": "Telur", "tofu": "Tahu",
            "tempeh": "Tempe", "meat": "Daging", "salmon": "Salmon",
            
            # Grains & Carbs
            "rice": "Nasi", "bread": "Roti", "noodle": "Mie", "pasta": "Pasta",
            "wheat": "Gandum", "oats": "Oat", "quinoa": "Quinoa",
            
            # Dairy
            "milk": "Susu", "cheese": "Keju", "butter": "Mentega", "yogurt": "Yogurt",
            
            # Prepared Foods
            "pizza": "Pizza", "burger": "Burger", "sandwich": "Sandwich",
            "salad": "Salad", "soup": "Sup", "cake": "Kue", "pie": "Pie",
            "cookie": "Kue Kering", "ice cream": "Es Krim", "chocolate": "Cokelat",
            
            # Beverages
            "coffee": "Kopi", "tea": "Teh", "juice": "Jus", "water": "Air",
            "soda": "Soda", "wine": "Wine", "beer": "Beer",
            
            # Indonesian Foods (keep original)
            "rendang": "Rendang", "satay": "Sate", "gado-gado": "Gado-Gado",
            "nasi gudeg": "Gudeg", "soto": "Soto", "bakso": "Bakso"
        }
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the best available food classification model"""
        print("🔄 Initializing advanced food classification model...")
        
        with self.model_lock:
            if self.classifier_pipeline is not None:
                return True
                
            for model_name in self.food_models:
                try:
                    print(f"🧠 Trying to load model: {model_name}")
                    
                    # Try to create image classification pipeline
                    self.classifier_pipeline = pipeline(
                        "image-classification",
                        model=model_name,
                        device=0 if torch.cuda.is_available() else -1,
                        top_k=10  # Get top 10 predictions
                    )
                    
                    print(f"✅ Successfully loaded food classification model: {model_name}")
                    print(f"🎯 Using device: {self.device}")
                    
                    # Test the model with a simple prediction
                    self._test_model()
                    return True
                    
                except Exception as e:
                    print(f"⚠️ Failed to load {model_name}: {e}")
                    continue
            
            print("❌ Failed to load any food classification model")
            self.classifier_pipeline = None
            return False
    
    def _test_model(self):
        """Test the model to ensure it's working"""
        try:
            # Create a simple test image (white square)
            test_image = Image.new('RGB', (224, 224), color='white')
            test_results = self.classifier_pipeline(test_image)
            print(f"🧪 Model test successful, got {len(test_results)} predictions")
        except Exception as e:
            print(f"⚠️ Model test failed: {e}")
    
    def preprocess_image(self, image_bytes: bytes) -> Image.Image:
        """
        Preprocess image for model inference
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (for performance)
            max_size = 1024
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {e}")
    
    def predict(self, image_bytes: bytes, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Advanced AI food classification using specialized models
        """
        print("🤖 Starting advanced food classification with specialized AI model...")
        
        if self.classifier_pipeline is None:
            print("⚠️ AI model not available, initializing...")
            if not self._initialize_model():
                return self._fallback_prediction()
        
        try:
            # Preprocess image
            image = self.preprocess_image(image_bytes)
            print(f"📷 Image preprocessed, size: {image.size}")
            
            # Make prediction with specialized food classification model
            raw_predictions = self.classifier_pipeline(image)
            print(f"🔮 AI model returned {len(raw_predictions)} predictions")
            
            # Process and enhance predictions
            predictions = []
            for i, pred in enumerate(raw_predictions[:top_k]):
                confidence = float(pred['score'])
                label = pred['label']
                
                # Clean and translate the label
                cleaned_label = self._clean_label(label)
                translated_label = self._translate_to_indonesian(cleaned_label)
                
                # Determine food category
                category = self._determine_food_category(cleaned_label)
                
                prediction = {
                    "food_type": translated_label,
                    "confidence": confidence,
                    "category": category,
                    "source": "specialized_ai",
                    "original_label": label,
                    "cleaned_label": cleaned_label,
                    "category_id": i
                }
                
                predictions.append(prediction)
                print(f"  {i+1}. {cleaned_label} -> {translated_label} ({confidence:.4f}) [{category}]")
            
            print(f"🎉 Advanced AI food classification complete: {len(predictions)} predictions")
            return predictions
            
        except Exception as e:
            print(f"❌ Error during AI food classification: {e}")
            return self._fallback_prediction()
    
    def _clean_label(self, label: str) -> str:
        """Clean up model prediction labels"""
        # Remove common artifacts from model labels
        label = label.replace("_", " ").replace("-", " ")
        label = label.strip().lower()
        
        # Remove model-specific prefixes/suffixes
        prefixes_to_remove = ["n0", "class_", "category_", "food_"]
        for prefix in prefixes_to_remove:
            if label.startswith(prefix):
                label = label[len(prefix):]
        
        # Capitalize first letter of each word
        return label.title()
    
    def _translate_to_indonesian(self, english_text: str) -> str:
        """Enhanced translation with better food term mapping"""
        english_lower = english_text.lower()
        
        # Direct translation lookup
        for eng_word, indo_word in self.translation_dict.items():
            if eng_word in english_lower:
                return indo_word
        
        # Try partial matches for compound foods
        for eng_word, indo_word in self.translation_dict.items():
            if any(part in english_lower for part in eng_word.split()):
                return f"{indo_word} (variant)"
        
        # If no translation found, return cleaned English
        return self._clean_label(english_text)
    
    def _determine_food_category(self, food_name: str) -> str:
        """Determine food category based on the food name"""
        food_lower = food_name.lower()
        
        # Category keywords
        categories = {
            "buah": ["fruit", "apple", "banana", "orange", "strawberry", "grape", "mango"],
            "sayuran": ["vegetable", "broccoli", "carrot", "tomato", "onion", "spinach", "lettuce"],
            "protein": ["meat", "chicken", "fish", "beef", "pork", "egg", "tofu", "tempeh"],
            "karbohidrat": ["rice", "bread", "noodle", "pasta", "potato", "wheat", "oats"],
            "dairy": ["milk", "cheese", "butter", "yogurt"],
            "makanan_siap": ["pizza", "burger", "sandwich", "cake", "cookie", "soup"],
            "minuman": ["coffee", "tea", "juice", "water", "soda", "wine", "beer"]
        }
        
        for category, keywords in categories.items():
            if any(keyword in food_lower for keyword in keywords):
                return category
        
        return "lainnya"  # Other
    
    def _fallback_prediction(self) -> List[Dict[str, Any]]:
        """Enhanced fallback when AI model fails"""
        print("🔄 Using enhanced fallback prediction")
        
        return [{
            "food_type": "Makanan Terdeteksi",
            "confidence": 0.6,
            "category": "umum",
            "source": "fallback",
            "original_label": "unknown",
            "cleaned_label": "unknown",
            "category_id": 0
        }]
    
    def predict_food_categories(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Complete food analysis using advanced AI models
        """
        predictions = self.predict(image_bytes, top_k=5)
        
        # Get the top prediction
        top_prediction = predictions[0] if predictions else self._fallback_prediction()[0]
        
        # Enhanced analysis
        analysis = {
            "primary_food_type": top_prediction["food_type"],
            "confidence": top_prediction["confidence"],
            "category": top_prediction["category"],
            "alternative_types": [
                {
                    "name": p["food_type"], 
                    "confidence": p["confidence"],
                    "category": p["category"]
                } 
                for p in predictions[1:] if p["confidence"] > 0.1
            ],
            "is_food": top_prediction["confidence"] > 0.15,  # Reasonable threshold
            "confidence_level": self._get_confidence_level(top_prediction["confidence"]),
            "detailed_predictions": predictions,
            "ai_model": "specialized_food_classifier",
            "detection_source": top_prediction.get("source", "unknown"),
            "processing_metadata": {
                "total_predictions": len(predictions),
                "model_type": "transformer_based",
                "device_used": str(self.device)
            }
        }
        
        return analysis
    
    def _get_confidence_level(self, confidence: float) -> str:
        """Get human-readable confidence level"""
        if confidence >= 0.8:
            return "sangat_yakin"  # Very confident
        elif confidence >= 0.6:
            return "yakin"        # Confident
        elif confidence >= 0.4:
            return "cukup_yakin"  # Somewhat confident
        elif confidence >= 0.2:
            return "kurang_yakin" # Not very confident
        else:
            return "tidak_yakin"  # Not confident
    
    def get_nutritional_info(self, food_type: str) -> Dict[str, Any]:
        """Get basic nutritional information for detected food"""
        # Basic nutritional database (could be expanded)
        nutrition_db = {
            "pisang": {"kalori": 89, "karbohidrat": 23, "protein": 1, "lemak": 0.3},
            "apel": {"kalori": 52, "karbohidrat": 14, "protein": 0.3, "lemak": 0.2},
            "nasi": {"kalori": 130, "karbohidrat": 28, "protein": 2.7, "lemak": 0.3},
            "ayam": {"kalori": 165, "karbohidrat": 0, "protein": 31, "lemak": 3.6},
            "telur": {"kalori": 155, "karbohidrat": 1, "protein": 13, "lemak": 11}
        }
        
        food_lower = food_type.lower()
        for food_key, nutrition in nutrition_db.items():
            if food_key in food_lower:
                return {
                    "found": True,
                    "food": food_type,
                    "nutrition": nutrition,
                    "per_serving": "100g"
                }
        
        return {
            "found": False,
            "food": food_type,
            "message": "Data nutrisi tidak tersedia"
        }

# Global classifier instance
food_classifier = FoodClassifier()