"""
Reward-related API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import asyncpg
from models.reward import RewardCreate, RewardResponse, RewardUpdate, UserRewardCreate, UserRewardResponse
from database.connection import db_manager

router = APIRouter(
    prefix="/rewards",
    tags=["rewards"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    """Dependency to get database pool"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

# REWARD MANAGEMENT
@router.post("/", response_model=dict)
async def create_reward(reward_data: RewardCreate, pool=Depends(get_db_pool)):
    """Create a new reward (admin function)"""
    try:
        async with pool.acquire() as connection:
            reward_id = await connection.fetchval(
                """INSERT INTO rewards (name, description, points_required, reward_type, value, is_active) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING reward_id""",
                reward_data.name,
                reward_data.description,
                reward_data.points_required,
                reward_data.reward_type,
                reward_data.value,
                reward_data.is_active
            )
            
            return {
                "status": "success", 
                "message": "Reward created successfully!",
                "reward_id": reward_id
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=dict)
async def get_rewards(
    active_only: bool = Query(True, description="Show only active rewards"),
    user_id: Optional[int] = Query(None, description="Show rewards with user's claim status"),
    pool=Depends(get_db_pool)
):
    """Get all available rewards"""
    try:
        async with pool.acquire() as connection:
            where_clause = "WHERE is_active = TRUE" if active_only else ""
            
            if user_id:
                # Include user's claim status
                query = f"""
                    SELECT r.*, 
                           ur.user_reward_id,
                           ur.claimed_at,
                           ur.is_used,
                           ur.used_at,
                           u.poin as user_points,
                           CASE WHEN r.points_required <= u.poin THEN TRUE ELSE FALSE END as can_claim
                    FROM rewards r
                    LEFT JOIN user_rewards ur ON r.reward_id = ur.reward_id AND ur.user_id = $1
                    LEFT JOIN users u ON u.user_id = $1
                    {where_clause}
                    ORDER BY r.points_required ASC
                """
                rows = await connection.fetch(query, user_id)
            else:
                query = f"SELECT * FROM rewards {where_clause} ORDER BY points_required ASC"
                rows = await connection.fetch(query)
            
            rewards = [dict(row) for row in rows]
            return {"status": "success", "rewards": rewards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{reward_id}", response_model=dict)
async def get_reward(reward_id: int, pool=Depends(get_db_pool)):
    """Get reward by ID"""
    try:
        async with pool.acquire() as connection:
            reward = await connection.fetchrow("SELECT * FROM rewards WHERE reward_id = $1", reward_id)
            
            if not reward:
                raise HTTPException(status_code=404, detail="Reward not found")
            
            return {"status": "success", "reward": dict(reward)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{reward_id}", response_model=dict)
async def update_reward(reward_id: int, reward_data: RewardUpdate, pool=Depends(get_db_pool)):
    """Update reward (admin function)"""
    try:
        async with pool.acquire() as connection:
            existing_reward = await connection.fetchrow("SELECT * FROM rewards WHERE reward_id = $1", reward_id)
            if not existing_reward:
                raise HTTPException(status_code=404, detail="Reward not found")
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            param_count = 1
            
            if reward_data.name is not None:
                update_fields.append(f"name = ${param_count}")
                update_values.append(reward_data.name)
                param_count += 1
                
            if reward_data.description is not None:
                update_fields.append(f"description = ${param_count}")
                update_values.append(reward_data.description)
                param_count += 1
                
            if reward_data.points_required is not None:
                update_fields.append(f"points_required = ${param_count}")
                update_values.append(reward_data.points_required)
                param_count += 1
                
            if reward_data.reward_type is not None:
                update_fields.append(f"reward_type = ${param_count}")
                update_values.append(reward_data.reward_type)
                param_count += 1
                
            if reward_data.value is not None:
                update_fields.append(f"value = ${param_count}")
                update_values.append(reward_data.value)
                param_count += 1
                
            if reward_data.is_active is not None:
                update_fields.append(f"is_active = ${param_count}")
                update_values.append(reward_data.is_active)
                param_count += 1
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_values.append(reward_id)
            query = f"UPDATE rewards SET {', '.join(update_fields)} WHERE reward_id = ${param_count} RETURNING *"
            
            updated_reward = await connection.fetchrow(query, *update_values)
            return {"status": "success", "message": "Reward updated successfully!", "reward": dict(updated_reward)}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# USER REWARD CLAIMS
@router.post("/claim/{reward_id}", response_model=dict)
async def claim_reward(reward_id: int, user_id: int = Query(..., description="User ID claiming the reward"), pool=Depends(get_db_pool)):
    """Claim a reward for a user"""
    try:
        async with pool.acquire() as connection:
            # Check if reward exists and is active
            reward = await connection.fetchrow("SELECT * FROM rewards WHERE reward_id = $1 AND is_active = TRUE", reward_id)
            if not reward:
                raise HTTPException(status_code=404, detail="Reward not found or inactive")
            
            # Check user's points
            user = await connection.fetchrow("SELECT poin FROM users WHERE user_id = $1", user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
            if user['poin'] < reward['points_required']:
                raise HTTPException(status_code=400, detail=f"Insufficient points. Required: {reward['points_required']}, You have: {user['poin']}")
            
            # Check if already claimed
            existing_claim = await connection.fetchrow("SELECT * FROM user_rewards WHERE user_id = $1 AND reward_id = $2", user_id, reward_id)
            if existing_claim:
                raise HTTPException(status_code=400, detail="Reward already claimed")
            
            # Claim the reward and deduct points
            async with connection.transaction():
                user_reward_id = await connection.fetchval(
                    "INSERT INTO user_rewards (user_id, reward_id) VALUES ($1, $2) RETURNING user_reward_id",
                    user_id, reward_id
                )
                
                await connection.execute(
                    "UPDATE users SET poin = poin - $1 WHERE user_id = $2",
                    reward['points_required'], user_id
                )
                
                # Create notification
                await connection.execute("""
                    INSERT INTO notifications (user_id, title, message, notification_type)
                    VALUES ($1, $2, $3, $4)
                """, 
                user_id,
                "Reward Claimed!",
                f"You have successfully claimed: {reward['name']}",
                "Reward Earned"
                )
            
            return {
                "status": "success", 
                "message": f"Reward '{reward['name']}' claimed successfully!",
                "user_reward_id": user_reward_id
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/user/{user_id}", response_model=dict)
async def get_user_rewards(user_id: int, pool=Depends(get_db_pool)):
    """Get all rewards claimed by a user"""
    try:
        async with pool.acquire() as connection:
            rows = await connection.fetch("""
                SELECT ur.*, r.name, r.description, r.reward_type, r.value
                FROM user_rewards ur
                JOIN rewards r ON ur.reward_id = r.reward_id
                WHERE ur.user_id = $1
                ORDER BY ur.claimed_at DESC
            """, user_id)
            
            user_rewards = [dict(row) for row in rows]
            return {"status": "success", "user_rewards": user_rewards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/user-reward/{user_reward_id}/use", response_model=dict)
async def use_reward(user_reward_id: int, pool=Depends(get_db_pool)):
    """Mark a user's claimed reward as used"""
    try:
        async with pool.acquire() as connection:
            updated = await connection.fetchrow("""
                UPDATE user_rewards 
                SET is_used = TRUE, used_at = NOW() 
                WHERE user_reward_id = $1 AND is_used = FALSE
                RETURNING *
            """, user_reward_id)
            
            if not updated:
                raise HTTPException(status_code=404, detail="User reward not found or already used")
            
            return {"status": "success", "message": "Reward marked as used"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/user/{user_id}/points", response_model=dict)
async def get_user_points(user_id: int, pool=Depends(get_db_pool)):
    """Get user's current points"""
    try:
        async with pool.acquire() as connection:
            user = await connection.fetchrow("SELECT poin, rank FROM users WHERE user_id = $1", user_id)
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {"status": "success", "points": user['poin'], "rank": user['rank']}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")