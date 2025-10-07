from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import asyncpg
from database.connection import db_manager
from pydantic import BaseModel

router = APIRouter()

async def get_db_pool():
    """Dependency to get database pool"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

# Pydantic models for request/response
class RecipeCreate(BaseModel):
    user_id: int
    title: str
    description: str
    ingredients: List[str]
    instructions: List[str]
    category: str
    prep_time: int
    servings: int
    difficulty: str
    image_url: Optional[str] = None

class RecipeResponse(BaseModel):
    recipe_id: int
    user_id: int
    title: str
    description: str
    ingredients: List[str]
    instructions: List[str]
    category: str
    prep_time: int
    servings: int
    difficulty: str
    image_url: Optional[str]
    created_at: str
    updated_at: Optional[str]

# Get all recipes or recipes by user
@router.get("/", response_model=dict)
async def get_recipes(
    user_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    try:
        query = """
            SELECT recipe_id, user_id, title, description, ingredients, instructions, 
                   category, prep_time, servings, difficulty, image_url, 
                   created_at, updated_at
            FROM recipes
            WHERE 1=1
        """
        params = []
        param_count = 0
        
        # Filter by user if specified
        if user_id:
            param_count += 1
            query += f" AND user_id = ${param_count}"
            params.append(user_id)
        
        # Filter by category
        if category and category != "All":
            param_count += 1
            query += f" AND category = ${param_count}"
            params.append(category)
        
        # Search in title, description, or ingredients
        if search:
            param_count += 1
            search_term = f"%{search.lower()}%"
            query += f" AND (LOWER(title) LIKE ${param_count} OR LOWER(description) LIKE ${param_count + 1} OR EXISTS(SELECT 1 FROM unnest(ingredients) AS ingredient WHERE LOWER(ingredient) LIKE ${param_count + 2}))"
            params.extend([search_term, search_term, search_term])
        
        query += " ORDER BY created_at DESC"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            recipes = []
            for row in rows:
                recipes.append({
                    "recipe_id": row["recipe_id"],
                    "user_id": row["user_id"],
                    "title": row["title"],
                    "description": row["description"],
                    "ingredients": row["ingredients"],
                    "instructions": row["instructions"],
                    "category": row["category"],
                    "prep_time": row["prep_time"],
                    "servings": row["servings"],
                    "difficulty": row["difficulty"],
                    "image_url": row["image_url"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
                })
        
        return {
            "status": "success",
            "recipes": recipes,
            "total": len(recipes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get recipe by ID
@router.get("/{recipe_id}", response_model=dict)
async def get_recipe(recipe_id: int, pool: asyncpg.Pool = Depends(get_db_pool)):
    try:
        query = """
            SELECT recipe_id, user_id, title, description, ingredients, instructions, 
                   category, prep_time, servings, difficulty, image_url, 
                   created_at, updated_at
            FROM recipes
            WHERE recipe_id = $1
        """
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, recipe_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Recipe not found")
            
            recipe = {
                "recipe_id": row["recipe_id"],
                "user_id": row["user_id"],
                "title": row["title"],
                "description": row["description"],
                "ingredients": row["ingredients"],
                "instructions": row["instructions"],
                "category": row["category"],
                "prep_time": row["prep_time"],
                "servings": row["servings"],
                "difficulty": row["difficulty"],
                "image_url": row["image_url"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            }
        
        return {
            "status": "success",
            "recipe": recipe
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create new recipe
@router.post("/", response_model=dict)
async def create_recipe(recipe_data: RecipeCreate, pool: asyncpg.Pool = Depends(get_db_pool)):
    try:
        query = """
            INSERT INTO recipes (user_id, title, description, ingredients, instructions, 
                               category, prep_time, servings, difficulty, image_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING recipe_id, user_id, title, description, ingredients, instructions, 
                     category, prep_time, servings, difficulty, image_url, created_at
        """
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                recipe_data.user_id,
                recipe_data.title,
                recipe_data.description,
                recipe_data.ingredients,
                recipe_data.instructions,
                recipe_data.category,
                recipe_data.prep_time,
                recipe_data.servings,
                recipe_data.difficulty,
                recipe_data.image_url
            )
            
            recipe = {
                "recipe_id": row["recipe_id"],
                "user_id": row["user_id"],
                "title": row["title"],
                "description": row["description"],
                "ingredients": row["ingredients"],
                "instructions": row["instructions"],
                "category": row["category"],
                "prep_time": row["prep_time"],
                "servings": row["servings"],
                "difficulty": row["difficulty"],
                "image_url": row["image_url"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": None,
            }
        
        return {
            "status": "success",
            "message": "Recipe created successfully",
            "recipe": recipe
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update recipe
@router.put("/{recipe_id}", response_model=dict)
async def update_recipe(recipe_id: int, recipe_data: RecipeCreate, pool: asyncpg.Pool = Depends(get_db_pool)):
    try:
        query = """
            UPDATE recipes 
            SET title = $2, description = $3, ingredients = $4, instructions = $5,
                category = $6, prep_time = $7, servings = $8, difficulty = $9, 
                image_url = $10, updated_at = NOW()
            WHERE recipe_id = $1
            RETURNING recipe_id, user_id, title, description, ingredients, instructions, 
                     category, prep_time, servings, difficulty, image_url, 
                     created_at, updated_at
        """
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                recipe_id,
                recipe_data.title,
                recipe_data.description,
                recipe_data.ingredients,
                recipe_data.instructions,
                recipe_data.category,
                recipe_data.prep_time,
                recipe_data.servings,
                recipe_data.difficulty,
                recipe_data.image_url
            )
            
            if not row:
                raise HTTPException(status_code=404, detail="Recipe not found")
            
            recipe = {
                "recipe_id": row["recipe_id"],
                "user_id": row["user_id"],
                "title": row["title"],
                "description": row["description"],
                "ingredients": row["ingredients"],
                "instructions": row["instructions"],
                "category": row["category"],
                "prep_time": row["prep_time"],
                "servings": row["servings"],
                "difficulty": row["difficulty"],
                "image_url": row["image_url"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            }
        
        return {
            "status": "success",
            "message": "Recipe updated successfully",
            "recipe": recipe
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete recipe
@router.delete("/{recipe_id}", response_model=dict)
async def delete_recipe(recipe_id: int, pool: asyncpg.Pool = Depends(get_db_pool)):
    try:
        query = "DELETE FROM recipes WHERE recipe_id = $1 RETURNING recipe_id"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, recipe_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Recipe not found")
        
        return {
            "status": "success",
            "message": "Recipe deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get recipe categories
@router.get("/categories/list", response_model=dict)
async def get_recipe_categories(pool: asyncpg.Pool = Depends(get_db_pool)):
    try:
        query = "SELECT DISTINCT category FROM recipes ORDER BY category"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            categories = [row["category"] for row in rows]
            
            # Add default categories if none exist
            default_categories = ["Vegetables", "Fruits", "Grains", "Dairy", "Meat", "Snacks"]
            for cat in default_categories:
                if cat not in categories:
                    categories.append(cat)
        
        return {
            "status": "success",
            "categories": ["All"] + sorted(categories)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))