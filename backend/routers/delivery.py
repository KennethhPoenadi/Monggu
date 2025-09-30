"""
Delivery API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import asyncpg
from models.delivery import DeliveryCreate, DeliveryUpdate, DeliveryResponse
from database.connection import db_manager

router = APIRouter(
    prefix="/delivery",
    tags=["delivery"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.post("/", response_model=dict)
async def create_delivery(delivery: DeliveryCreate, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            delivery_id = await connection.fetchval(
                "INSERT INTO delivery (user_id1, user_id2, product_id, status) VALUES ($1, $2, $3, $4) RETURNING delivery_id",
                delivery.user_id1, delivery.user_id2, delivery.product_id, delivery.status
            )
            return {"status": "success", "delivery_id": delivery_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=dict)
async def get_deliveries(pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            rows = await connection.fetch("SELECT * FROM delivery ORDER BY created_at DESC")
            deliveries = [dict(row) for row in rows]
            return {"status": "success", "deliveries": deliveries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{delivery_id}", response_model=dict)
async def get_delivery(delivery_id: int, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            delivery = await connection.fetchrow("SELECT * FROM delivery WHERE delivery_id = $1", delivery_id)
            if not delivery:
                raise HTTPException(status_code=404, detail="Delivery not found")
            return {"status": "success", "delivery": dict(delivery)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{delivery_id}", response_model=dict)
async def update_delivery(delivery_id: int, delivery: DeliveryUpdate, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT * FROM delivery WHERE delivery_id = $1", delivery_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Delivery not found")
            update_fields = []
            update_values = []
            param_count = 1
            if delivery.status is not None:
                update_fields.append(f"status = ${param_count}")
                update_values.append(delivery.status)
                param_count += 1
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            update_values.append(delivery_id)
            query = f"UPDATE delivery SET {', '.join(update_fields)} WHERE delivery_id = ${param_count} RETURNING *"
            updated = await connection.fetchrow(query, *update_values)
            return {"status": "success", "delivery": dict(updated)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{delivery_id}", response_model=dict)
async def delete_delivery(delivery_id: int, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT * FROM delivery WHERE delivery_id = $1", delivery_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Delivery not found")
            await connection.execute("DELETE FROM delivery WHERE delivery_id = $1", delivery_id)
            return {"status": "success", "message": "Delivery deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
