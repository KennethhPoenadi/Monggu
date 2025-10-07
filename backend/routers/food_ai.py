from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any, List
import json
from models.food_classifier import food_classifier

router = APIRouter()

@router.post("/classify-food")
async def classify_food_image(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Classify food type from uploaded image using computer vision
    """
    try:
        print(f"📤 Received file: {file.filename} ({file.content_type})")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image bytes
        image_bytes = await file.read()
        print(f"📷 Image size: {len(image_bytes)} bytes")
        
        # Get food classification
        print("🚀 Starting AI classification...")
        analysis = food_classifier.predict_food_categories(image_bytes)
        print(f"✅ Classification complete: {analysis['primary_food_type']}")
        
        response_data = {
            "status": "success",
            "data": {
                "filename": file.filename,
                "file_size_bytes": len(image_bytes),
                "analysis": analysis,
                "suggestions": _get_food_suggestions(analysis["primary_food_type"]),
                "debug_info": {
                    "ai_model": analysis.get("ai_model", "EfficientNet-B0"),
                    "detection_source": analysis.get("detection_source", "unknown"),
                    "processing_notes": "Check server logs for detailed AI predictions"
                }
            }
        }
        
        print(f"📤 Sending response: {analysis['primary_food_type']} with {analysis['confidence']:.3f} confidence")
        return response_data
        
    except Exception as e:
        print(f"❌ Error in classify_food_image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/analyze-food-batch")
async def analyze_food_batch(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    """
    Analyze multiple food images at once
    """
    try:
        results = []
        
        for file in files:
            if not file.content_type.startswith('image/'):
                continue
                
            image_bytes = await file.read()
            analysis = food_classifier.predict_food_categories(image_bytes)
            
            results.append({
                "filename": file.filename,
                "analysis": analysis
            })
        
        return {
            "status": "success",
            "total_processed": len(results),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing images: {str(e)}")

@router.get("/food-categories")
async def get_food_categories() -> Dict[str, Any]:
    """
    Get available food categories
    """
    return {
        "status": "success",
        "categories": food_classifier.food_categories
    }

def _get_food_suggestions(food_type: str) -> List[str]:
    """
    Generate suggestions based on AI-detected food type
    """
    # Simple, dynamic suggestions based on the detected food
    base_suggestions = [
        f"{food_type} Segar",
        f"{food_type} Organik", 
        f"{food_type} Premium",
        "Makanan Sehat",
        "Bahan Alami"
    ]
    
    # Add specific suggestions if it's a known category
    if any(fruit in food_type.lower() for fruit in ["pisang", "apel", "jeruk", "buah"]):
        base_suggestions.extend(["Jus", "Smoothie", "Fruit Bowl"])
    elif any(veg in food_type.lower() for veg in ["sayur", "brokoli", "wortel", "tomat"]):
        base_suggestions.extend(["Salad", "Tumis", "Sayur Rebus"])
    elif any(bread in food_type.lower() for bread in ["roti", "bread", "bagel"]):
        base_suggestions.extend(["Sandwich", "Toast", "Roti Panggang"])
    
    return base_suggestions[:5]  # Return top 5 suggestions