"""
Product API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import asyncpg
from models.product import ProductCreate, ProductUpdate, ProductResponse
from database.connection import db_manager

router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.post("/", response_model=dict)
async def create_product(product: ProductCreate, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            product_id = await connection.fetchval(
                "INSERT INTO products (product_name, expiry_date, count, type_product) VALUES ($1, $2, $3, $4) RETURNING product_id",
                product.product_name, product.expiry_date, product.count, product.type_product
            )
            return {"status": "success", "product_id": product_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=dict)
async def get_products(pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            rows = await connection.fetch("SELECT * FROM products ORDER BY created_at DESC")
            products = [dict(row) for row in rows]
            return {"status": "success", "products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{product_id}", response_model=dict)
async def get_product(product_id: int, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            product = await connection.fetchrow("SELECT * FROM products WHERE product_id = $1", product_id)
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            return {"status": "success", "product": dict(product)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{product_id}", response_model=dict)
async def update_product(product_id: int, product: ProductUpdate, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT * FROM products WHERE product_id = $1", product_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Product not found")
            update_fields = []
            update_values = []
            param_count = 1
            if product.product_name is not None:
                update_fields.append(f"product_name = ${param_count}")
                update_values.append(product.product_name)
                param_count += 1
            if product.expiry_date is not None:
                update_fields.append(f"expiry_date = ${param_count}")
                update_values.append(product.expiry_date)
                param_count += 1
            if product.count is not None:
                update_fields.append(f"count = ${param_count}")
                update_values.append(product.count)
                param_count += 1
            if product.type_product is not None:
                update_fields.append(f"type_product = ${param_count}")
                update_values.append(product.type_product)
                param_count += 1
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            update_values.append(product_id)
            query = f"UPDATE products SET {', '.join(update_fields)} WHERE product_id = ${param_count} RETURNING *"
            updated = await connection.fetchrow(query, *update_values)
            return {"status": "success", "product": dict(updated)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{product_id}", response_model=dict)
async def delete_product(product_id: int, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT * FROM products WHERE product_id = $1", product_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Product not found")
            await connection.execute("DELETE FROM products WHERE product_id = $1", product_id)
            return {"status": "success", "message": "Product deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
