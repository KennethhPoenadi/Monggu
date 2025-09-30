"""
Notification-related API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import asyncpg
from models.notification import NotificationCreate, NotificationResponse, NotificationUpdate, NotificationType
from database.connection import db_manager

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    """Dependency to get database pool"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.post("/", response_model=dict)
async def create_notification(notification_data: NotificationCreate, pool=Depends(get_db_pool)):
    """Create a new notification"""
    try:
        async with pool.acquire() as connection:
            notification_id = await connection.fetchval(
                """INSERT INTO notifications (user_id, title, message, notification_type, is_read) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING notification_id""",
                notification_data.user_id,
                notification_data.title,
                notification_data.message,
                notification_data.notification_type,
                notification_data.is_read
            )
            
            return {
                "status": "success", 
                "message": "Notification created successfully!",
                "notification_id": notification_id
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/user/{user_id}", response_model=dict)
async def get_user_notifications(
    user_id: int,
    unread_only: bool = Query(False, description="Show only unread notifications"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    pool=Depends(get_db_pool)
):
    """Get notifications for a specific user"""
    try:
        async with pool.acquire() as connection:
            where_clause = "WHERE user_id = $1"
            params = [user_id]
            
            if unread_only:
                where_clause += " AND is_read = FALSE"
            
            query = f"""
                SELECT * FROM notifications 
                {where_clause}
                ORDER BY created_at DESC 
                LIMIT $2
            """
            
            rows = await connection.fetch(query, user_id, limit)
            notifications = [dict(row) for row in rows]
            
            return {"status": "success", "notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_read(notification_id: int, pool=Depends(get_db_pool)):
    """Mark a notification as read"""
    try:
        async with pool.acquire() as connection:
            updated = await connection.fetchrow(
                "UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *",
                notification_id
            )
            
            if not updated:
                raise HTTPException(status_code=404, detail="Notification not found")
            
            return {"status": "success", "message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/user/{user_id}/read-all", response_model=dict)
async def mark_all_notifications_read(user_id: int, pool=Depends(get_db_pool)):
    """Mark all notifications as read for a user"""
    try:
        async with pool.acquire() as connection:
            result = await connection.execute(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
                user_id
            )
            
            return {"status": "success", "message": f"All notifications marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(notification_id: int, pool=Depends(get_db_pool)):
    """Delete a notification"""
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow(
                "SELECT notification_id FROM notifications WHERE notification_id = $1",
                notification_id
            )
            
            if not existing:
                raise HTTPException(status_code=404, detail="Notification not found")
            
            await connection.execute("DELETE FROM notifications WHERE notification_id = $1", notification_id)
            return {"status": "success", "message": "Notification deleted successfully!"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/user/{user_id}/count", response_model=dict)
async def get_notification_count(user_id: int, pool=Depends(get_db_pool)):
    """Get unread notification count for a user"""
    try:
        async with pool.acquire() as connection:
            count = await connection.fetchval(
                "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE",
                user_id
            )
            
            return {"status": "success", "unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Utility function to check expiring products and send notifications
@router.post("/check-expiring-products", response_model=dict)
async def check_expiring_products(pool=Depends(get_db_pool)):
    """Check for products expiring within 24 hours and send notifications"""
    try:
        async with pool.acquire() as connection:
            # Find products expiring within 24 hours
            expiring_products = await connection.fetch("""
                SELECT p.*, a.user_id 
                FROM products p
                JOIN accounts a ON p.user_id = a.user_id
                WHERE p.expiry_date <= CURRENT_DATE + INTERVAL '1 day'
                AND p.expiry_date >= CURRENT_DATE
            """)
            
            notifications_created = 0
            
            for product in expiring_products:
                # Check if notification already sent for this product
                existing_notification = await connection.fetchrow("""
                    SELECT notification_id FROM notifications 
                    WHERE user_id = $1 
                    AND notification_type = 'Product Expiry'
                    AND message LIKE $2
                    AND created_at >= CURRENT_DATE
                """, product['user_id'], f"%{product['product_name']}%")
                
                if not existing_notification:
                    # Create notification
                    await connection.execute("""
                        INSERT INTO notifications (user_id, title, message, notification_type)
                        VALUES ($1, $2, $3, $4)
                    """, 
                    product['user_id'],
                    "Product Expiring Soon!",
                    f"Your {product['product_name']} will expire on {product['expiry_date']}. Consider donating it!",
                    "Product Expiry"
                    )
                    notifications_created += 1
            
            return {
                "status": "success", 
                "message": f"Checked expiring products and created {notifications_created} notifications"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")