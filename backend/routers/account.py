"""
Account API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import asyncpg
from models.account import AccountCreate, AccountUpdate, AccountResponse
from database.connection import db_manager

router = APIRouter(
    prefix="/accounts",
    tags=["accounts"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.post("/", response_model=dict)
async def create_account(account: AccountCreate, pool=Depends(get_db_pool)):
    name = account.email.split("@")[0]
    try:
        async with pool.acquire() as connection:
            account_id = await connection.fetchval(
                "INSERT INTO accounts (user_id, email, name) VALUES ($1, $2, $3) RETURNING account_id",
                account.user_id, account.email, name
            )
            return {"status": "success", "account_id": account_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=dict)
async def get_accounts(pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            rows = await connection.fetch("SELECT * FROM accounts ORDER BY created_at DESC")
            accounts = [dict(row) for row in rows]
            return {"status": "success", "accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{account_id}", response_model=dict)
async def get_account(account_id: int, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            account = await connection.fetchrow("SELECT * FROM accounts WHERE account_id = $1", account_id)
            if not account:
                raise HTTPException(status_code=404, detail="Account not found")
            return {"status": "success", "account": dict(account)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{account_id}", response_model=dict)
async def update_account(account_id: int, account: AccountUpdate, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT * FROM accounts WHERE account_id = $1", account_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Account not found")
            update_fields = []
            update_values = []
            param_count = 1
            if account.email is not None:
                update_fields.append(f"email = ${param_count}")
                update_values.append(account.email)
                param_count += 1
            if account.name is not None:
                update_fields.append(f"name = ${param_count}")
                update_values.append(account.name)
                param_count += 1
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            update_values.append(account_id)
            query = f"UPDATE accounts SET {', '.join(update_fields)} WHERE account_id = ${param_count} RETURNING *"
            updated = await connection.fetchrow(query, *update_values)
            return {"status": "success", "account": dict(updated)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{account_id}", response_model=dict)
async def delete_account(account_id: int, pool=Depends(get_db_pool)):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT * FROM accounts WHERE account_id = $1", account_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Account not found")
            await connection.execute("DELETE FROM accounts WHERE account_id = $1", account_id)
            return {"status": "success", "message": "Account deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
