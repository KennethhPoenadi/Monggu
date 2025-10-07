import torch
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
import torch.nn.functional as F
from PIL import Image
import io
import json
import numpy as np
from typing import List, Dict, Any

class FoodClassifier:
    def __init__(self, model_path: str = None):
        """
        Initialize the food classifier with EfficientNet-B0 - Pure AI, no hardcoding
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # ImageNet labels - Load real ImageNet class names
        self.imagenet_labels = self._load_imagenet_labels()
        
        # Simple translation dictionary for common food terms
        self.translation_dict = {
            "banana": "Pisang",
            "orange": "Jeruk", 
            "apple": "Apel",
            "pineapple": "Nanas",
            "strawberry": "Strawberry",
            "lemon": "Lemon",
            "broccoli": "Brokoli",
            "carrot": "Wortel",
            "corn": "Jagung",
            "bell pepper": "Paprika",
            "tomato": "Tomat",
            "bagel": "Roti",
            "pretzel": "Pretzel",
            "croissant": "Croissant",
            "pizza": "Pizza",
            "hot dog": "Hot Dog",
            "hamburger": "Burger",
            "french fries": "French Fries",
            "ice cream": "Es Krim",
            "chocolate": "Cokelat",
            "coffee": "Kopi",
            "tea": "Teh",
            "wine": "Wine",
            "beer": "Beer",
            "cake": "Kue",
            "pie": "Pie",
            "bread": "Roti",
            "cheese": "Keju",
            "egg": "Telur",
            "meat": "Daging",
            "chicken": "Ayam",
            "fish": "Ikan",
            "rice": "Nasi",
            "noodle": "Mie",
            "soup": "Sup",
            "salad": "Salad"
        }
        
        self._load_model(model_path)
    
    def _load_imagenet_labels(self):
        """
        Load ImageNet class labels - using the real 1000 classes from torchvision
        """
        try:
            from torchvision.models import EfficientNet_B0_Weights
            weights = EfficientNet_B0_Weights.IMAGENET1K_V1
            categories = weights.meta["categories"]
            
            # Create a mapping from index to category name
            labels = {}
            for i, category in enumerate(categories):
                labels[i] = category
            
            print(f"✅ Loaded {len(labels)} ImageNet class labels")
            return labels
            
        except Exception as e:
            print(f"⚠️ Error loading ImageNet labels: {e}")
            # Fallback to basic mapping
            return {i: f"class_{i}" for i in range(1000)}
    
    def _load_model(self, model_path: str = None):
        """
        Load the pre-trained EfficientNet model
        """
        try:
            print("🔄 Loading EfficientNet-B0 model...")
            
            # Use EfficientNet-B0 (lightweight but accurate)
            weights = EfficientNet_B0_Weights.IMAGENET1K_V1
            self.model = efficientnet_b0(weights=weights)
            
            # Set to evaluation mode
            self.model.to(self.device)
            self.model.eval()
            
            print(f"✅ EfficientNet-B0 model loaded successfully on {self.device}")
            print(f"📊 Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
            
        except ImportError as e:
            print(f"❌ Import error loading model: {e}")
            print("💡 Installing PyTorch and torchvision...")
            self.model = None
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print(f"🔧 Error details: {str(e)}")
            # Fallback to basic model or None
            self.model = None
    
    def _get_imagenet_class_name(self, class_idx: int) -> str:
        """
        Get the actual ImageNet class name for a given index
        """
        try:
            # Use the actual ImageNet class names from torchvision
            from torchvision.models import EfficientNet_B0_Weights
            weights = EfficientNet_B0_Weights.IMAGENET1K_V1
            categories = weights.meta["categories"]
            
            if 0 <= class_idx < len(categories):
                return categories[class_idx]
            else:
                return f"unknown_class_{class_idx}"
                
        except Exception as e:
            print(f"Error getting class name: {e}")
            return f"class_{class_idx}"
    
    def _translate_to_indonesian(self, english_text: str) -> str:
        """
        Translate English food terms to Indonesian
        """
        english_lower = english_text.lower()
        
        # Check if any translation keywords match
        for eng_word, indo_word in self.translation_dict.items():
            if eng_word in english_lower:
                return indo_word
        
        # If no translation found, clean up the English text
        # Remove common descriptors and return a cleaner name
        clean_text = english_text.replace("_", " ").title()
        
        # Remove common prefixes/suffixes that aren't food names
        clean_text = clean_text.replace(" n02", "").replace(" n01", "").replace(" n03", "")
        
        return clean_text
    
    def preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        """
        Preprocess image for model inference
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply transforms
            image_tensor = self.transform(image).unsqueeze(0)
            return image_tensor.to(self.device)
            
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {e}")
    
    def predict(self, image_bytes: bytes, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Pure AI prediction using EfficientNet + ImageNet - NO HARDCODING!
        """
        print("🤖 Starting PURE AI food classification (no hardcoding)...")
        
        if self.model is None:
            print("⚠️ Model not available, using fallback")
            return self._fallback_prediction()
        
        try:
            # Preprocess image
            image_tensor = self.preprocess_image(image_bytes)
            print(f"📷 Image preprocessed, tensor shape: {image_tensor.shape}")
            
            # Make prediction with EfficientNet - PURE AI
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = F.softmax(outputs[0], dim=0)
            
            # Get top predictions from AI
            top_probs, top_indices = torch.topk(probabilities, k=min(top_k * 2, 50))
            
            print(f"🎯 Top {min(10, len(top_probs))} AI predictions:")
            predictions = []
            
            for i, (prob, idx) in enumerate(zip(top_probs, top_indices)):
                confidence = float(prob.item())
                class_idx = idx.item()
                
                # Get the REAL ImageNet class name from AI model
                imagenet_class_name = self._get_imagenet_class_name(class_idx)
                
                # Translate to Indonesian if possible
                translated_name = self._translate_to_indonesian(imagenet_class_name)
                
                prediction = {
                    "food_type": translated_name,
                    "confidence": confidence,
                    "category_id": class_idx,
                    "source": "pure_ai",
                    "original_class": imagenet_class_name
                }
                
                predictions.append(prediction)
                
                print(f"  {i+1}. {imagenet_class_name} -> {translated_name} ({confidence:.4f})")
                
                # Stop when we have enough predictions
                if len(predictions) >= top_k:
                    break
            
            # Return pure AI results
            print(f"🎉 Pure AI predictions: {len(predictions)} found")
            return predictions[:top_k]
            
        except Exception as e:
            print(f"❌ Error during AI prediction: {e}")
            return self._fallback_prediction()
    
    def _fallback_prediction(self) -> List[Dict[str, Any]]:
        """
        Simple fallback when AI model fails
        """
        print("🔄 Using simple fallback prediction")
        
        return [{
            "food_type": "Objek Terdeteksi",
            "confidence": 0.5,
            "category_id": 0,
            "source": "fallback",
            "original_class": "unknown"
        }]
    
    def predict_food_categories(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Get detailed food analysis using PURE AI model
        """
        predictions = self.predict(image_bytes, top_k=3)
        
        # Get the top prediction
        top_prediction = predictions[0] if predictions else self._fallback_prediction()[0]
        
        # Detailed analysis
        analysis = {
            "primary_food_type": top_prediction["food_type"],
            "confidence": top_prediction["confidence"],
            "alternative_types": [p["food_type"] for p in predictions[1:] if p["confidence"] > 0.05],
            "is_food": top_prediction["confidence"] > 0.1,  # Lower threshold for AI detection
            "detailed_predictions": predictions,
            "ai_model": "EfficientNet-B0",
            "detection_source": top_prediction.get("source", "unknown"),
            "original_imagenet_class": top_prediction.get("original_class", "unknown")
        }
        
        return analysis

# Global classifier instance
food_classifier = FoodClassifier()