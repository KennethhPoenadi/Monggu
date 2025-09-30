"""
User-related API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import asyncpg
from models.user import UserCreate, UserResponse, UserUpdate
from database.connection import db_manager

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    """Dependency to get database pool"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.post("/", response_model=dict)
async def create_user(user_data: UserCreate, pool=Depends(get_db_pool)):
    """Create a new user"""
    try:
        async with pool.acquire() as connection:
            user_id = await connection.fetchval(
                "INSERT INTO users (email, poin, rank) VALUES ($1, $2, $3) RETURNING user_id",
                user_data.email, user_data.poin, user_data.rank
            )
            return {
                "status": "success", 
                "message": "User created successfully!",
                "user_id": user_id
            }
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=dict)
async def get_users(pool=Depends(get_db_pool)):
    """Get all users"""
    try:
        async with pool.acquire() as connection:
            rows = await connection.fetch("SELECT * FROM users ORDER BY created_at DESC")
            users = [dict(row) for row in rows]
            return {"status": "success", "users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: int, pool=Depends(get_db_pool)):
    """Get user by ID"""
    try:
        async with pool.acquire() as connection:
            user = await connection.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return {"status": "success", "user": dict(user)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{user_id}", response_model=dict)
async def update_user(user_id: int, user_data: UserUpdate, pool=Depends(get_db_pool)):
    """Update user by ID"""
    try:
        async with pool.acquire() as connection:
            # Check if user exists
            existing_user = await connection.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            if not existing_user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            param_count = 1
            
            if user_data.email is not None:
                update_fields.append(f"email = ${param_count}")
                update_values.append(user_data.email)
                param_count += 1
            
            if user_data.poin is not None:
                update_fields.append(f"poin = ${param_count}")
                update_values.append(user_data.poin)
                param_count += 1
            
            if user_data.rank is not None:
                update_fields.append(f"rank = ${param_count}")
                update_values.append(user_data.rank)
                param_count += 1
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_values.append(user_id)  # Add user_id for WHERE clause
            query = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = ${param_count} RETURNING *"
            
            updated_user = await connection.fetchrow(query, *update_values)
            return {"status": "success", "message": "User updated successfully!", "user": dict(updated_user)}
            
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already exists")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: int, pool=Depends(get_db_pool)):
    """Delete user by ID"""
    try:
        async with pool.acquire() as connection:
            # Check if user exists
            existing_user = await connection.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            if not existing_user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Delete user
            await connection.execute("DELETE FROM users WHERE user_id = $1", user_id)
            return {"status": "success", "message": "User deleted successfully!"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
