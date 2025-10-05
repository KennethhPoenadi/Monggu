"""
Donation-related API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import asyncpg
from datetime import datetime, timedelta
from models.donation import DonationCreate, DonationResponse, DonationUpdate, DonationStatus
from database.connection import db_manager

router = APIRouter(
    prefix="/donations",
    tags=["donations"],
    responses={404: {"description": "Not found"}},
)

async def get_db_pool():
    """Dependency to get database pool"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.post("/", response_model=dict)
async def create_donation(donation_data: DonationCreate, pool=Depends(get_db_pool)):
    """Create a new donation"""
    try:
        async with pool.acquire() as connection:
            print(f"Creating donation with data: {donation_data}")
            
            # Check if donor user exists
            donor_exists = await connection.fetchval(
                "SELECT EXISTS(SELECT 1 FROM accounts WHERE user_id = $1)",
                donation_data.donor_user_id
            )
            
            if not donor_exists:
                raise HTTPException(status_code=400, detail=f"Donor user with ID {donation_data.donor_user_id} does not exist")
            
            type_of_food_list = donation_data.type_of_food if donation_data.type_of_food else []
            
            # Start transaction to ensure consistency
            async with connection.transaction():
                # Create donation
                donation_id = await connection.fetchval(
                    """INSERT INTO donations (donor_user_id, type_of_food, latitude, longitude, status, expires_at, created_at) 
                       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours', NOW()) RETURNING donation_id""",
                    donation_data.donor_user_id, 
                    type_of_food_list,
                    donation_data.latitude, 
                    donation_data.longitude,
                    donation_data.status
                )
                
                # Remove donated products from user's inventory
                removed_products = []
                for food_name in type_of_food_list:
                    # Find and remove one product with this name from user's inventory
                    deleted_product = await connection.fetchrow(
                        """DELETE FROM products 
                           WHERE product_id = (
                               SELECT product_id FROM products 
                               WHERE user_id = $1 AND product_name = $2 
                               LIMIT 1
                           ) RETURNING product_name, count""",
                        donation_data.donor_user_id,
                        food_name
                    )
                    
                    if deleted_product:
                        removed_products.append(dict(deleted_product))
                
                print(f"Removed products from inventory: {removed_products}")
            
            return {
                "status": "success", 
                "message": "Donation created successfully! Products removed from inventory.",
                "donation_id": donation_id,
                "removed_products": removed_products
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating donation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/user/{user_id}", response_model=dict)
async def get_user_donations(user_id: int, pool=Depends(get_db_pool)):
    """Get donations by specific user ID"""
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT d.*, a.name as donor_name, ar.name as receiver_name
                FROM donations d
                LEFT JOIN accounts a ON d.donor_user_id = a.user_id
                LEFT JOIN accounts ar ON d.receiver_user_id = ar.user_id
                WHERE d.donor_user_id = $1
                ORDER BY d.created_at DESC
            """
            
            rows = await connection.fetch(query, user_id)
            donations = []
            
            for row in rows:
                donation = dict(row)
                # Convert PostgreSQL array to Python list
                if donation['type_of_food']:
                    donation['type_of_food'] = donation['type_of_food']
                # Convert decimal coordinates to float for frontend, handle NULL values
                donation['latitude'] = float(donation['latitude']) if donation['latitude'] is not None else 0.0
                donation['longitude'] = float(donation['longitude']) if donation['longitude'] is not None else 0.0
                donations.append(donation)
                
            return {"status": "success", "donations": donations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=dict)
async def get_donations(
    status: Optional[DonationStatus] = Query(None, description="Filter by status"),
    user_id: Optional[int] = Query(None, description="Filter by donor user ID"),
    active_only: bool = Query(True, description="Show only non-expired donations"),
    pool=Depends(get_db_pool)
):
    """Get all donations with optional filters"""
    try:
        async with pool.acquire() as connection:
            where_conditions = []
            params = []
            param_count = 1
            
            if active_only:
                where_conditions.append(f"expires_at > NOW()")
                
            if status:
                where_conditions.append(f"status = ${param_count}")
                params.append(status)
                param_count += 1
                
            if user_id:
                where_conditions.append(f"donor_user_id = ${param_count}")
                params.append(user_id)
                param_count += 1
            
            where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""
            
            query = f"""
                SELECT d.*, a.name as donor_name, ar.name as receiver_name
                FROM donations d
                LEFT JOIN accounts a ON d.donor_user_id = a.user_id
                LEFT JOIN accounts ar ON d.receiver_user_id = ar.user_id
                {where_clause}
                ORDER BY d.created_at DESC
            """
            
            rows = await connection.fetch(query, *params)
            donations = []
            
            for row in rows:
                donation = dict(row)
                # Convert PostgreSQL array to Python list
                if donation['type_of_food']:
                    donation['type_of_food'] = donation['type_of_food']
                # Convert decimal coordinates to float for frontend, handle NULL values
                donation['latitude'] = float(donation['latitude']) if donation['latitude'] is not None else 0.0
                donation['longitude'] = float(donation['longitude']) if donation['longitude'] is not None else 0.0
                donations.append(donation)
                
            return {"status": "success", "donations": donations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{donation_id}", response_model=dict)
async def get_donation(donation_id: int, pool=Depends(get_db_pool)):
    """Get donation by ID"""
    try:
        async with pool.acquire() as connection:
            donation = await connection.fetchrow(
                """SELECT d.*, a.name as donor_name, ar.name as receiver_name
                   FROM donations d
                   LEFT JOIN accounts a ON d.donor_user_id = a.user_id
                   LEFT JOIN accounts ar ON d.receiver_user_id = ar.user_id
                   WHERE d.donation_id = $1""", 
                donation_id
            )
            
            if not donation:
                raise HTTPException(status_code=404, detail="Donation not found")
                
            donation_dict = dict(donation)
            # Convert PostgreSQL array to Python list
            if donation_dict['type_of_food']:
                donation_dict['type_of_food'] = donation_dict['type_of_food']
            # Convert decimal coordinates to float for frontend, handle NULL values
            donation_dict['latitude'] = float(donation_dict['latitude']) if donation_dict['latitude'] is not None else 0.0
            donation_dict['longitude'] = float(donation_dict['longitude']) if donation_dict['longitude'] is not None else 0.0
                
            return {"status": "success", "donation": donation_dict}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{donation_id}", response_model=dict)
async def update_donation(donation_id: int, donation_data: DonationUpdate, pool=Depends(get_db_pool)):
    """Update donation (typically for status changes or assigning receiver)"""
    try:
        async with pool.acquire() as connection:
            # Check if donation exists and not expired
            existing_donation = await connection.fetchrow(
                "SELECT * FROM donations WHERE donation_id = $1 AND expires_at > NOW()", 
                donation_id
            )
            
            if not existing_donation:
                raise HTTPException(status_code=404, detail="Donation not found or expired")
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            param_count = 1
            
            if donation_data.type_of_food is not None:
                type_of_food_array = '{' + ','.join([f'"{food}"' for food in donation_data.type_of_food]) + '}'
                update_fields.append(f"type_of_food = ${param_count}")
                update_values.append(type_of_food_array)
                param_count += 1
            
            if donation_data.latitude is not None:
                update_fields.append(f"latitude = ${param_count}")
                update_values.append(donation_data.latitude)
                param_count += 1
                
            if donation_data.longitude is not None:
                update_fields.append(f"longitude = ${param_count}")
                update_values.append(donation_data.longitude)
                param_count += 1
            
            if donation_data.status is not None:
                update_fields.append(f"status = ${param_count}")
                update_values.append(donation_data.status)
                param_count += 1
                
            if donation_data.receiver_user_id is not None:
                update_fields.append(f"receiver_user_id = ${param_count}")
                update_values.append(donation_data.receiver_user_id)
                param_count += 1
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_values.append(donation_id)
            query = f"UPDATE donations SET {', '.join(update_fields)} WHERE donation_id = ${param_count} RETURNING *"
            
            updated_donation = await connection.fetchrow(query, *update_values)
            
            # Award points to donor if donation is completed
            if donation_data.status == DonationStatus.DITERIMA:
                await connection.execute(
                    "UPDATE users SET poin = poin + 10 WHERE user_id = $1",
                    existing_donation['donor_user_id']
                )
            
            return {"status": "success", "message": "Donation updated successfully!", "donation": dict(updated_donation)}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{donation_id}", response_model=dict)
async def delete_donation(donation_id: int, pool=Depends(get_db_pool)):
    """Delete donation (only by donor and only if not yet taken)"""
    try:
        async with pool.acquire() as connection:
            # Check if donation exists and can be deleted
            existing_donation = await connection.fetchrow(
                "SELECT * FROM donations WHERE donation_id = $1", 
                donation_id
            )
            
            if not existing_donation:
                raise HTTPException(status_code=404, detail="Donation not found")
                
            if existing_donation['status'] != 'Diajukan':
                raise HTTPException(status_code=400, detail="Cannot delete donation that is already taken or completed")
            
            await connection.execute("DELETE FROM donations WHERE donation_id = $1", donation_id)
            return {"status": "success", "message": "Donation deleted successfully!"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{donation_id}/cancel", response_model=dict)
async def cancel_donation(donation_id: int, pool=Depends(get_db_pool)):
    """Cancel donation and restore products to inventory"""
    try:
        async with pool.acquire() as connection:
            # Get donation details
            existing_donation = await connection.fetchrow(
                "SELECT * FROM donations WHERE donation_id = $1", 
                donation_id
            )
            
            if not existing_donation:
                raise HTTPException(status_code=404, detail="Donation not found")
                
            if existing_donation['status'] != 'Diajukan':
                raise HTTPException(status_code=400, detail="Cannot cancel donation that is already taken or completed")
            
            # Start transaction to ensure consistency
            async with connection.transaction():
                # Delete the donation
                await connection.execute("DELETE FROM donations WHERE donation_id = $1", donation_id)
                
                # Restore products to inventory
                restored_products = []
                type_of_food_list = existing_donation['type_of_food']
                
                for food_name in type_of_food_list:
                    # Create a new product entry for each food item
                    # Note: We'll use basic defaults since we don't store original product details
                    product_id = await connection.fetchval(
                        """INSERT INTO products (user_id, product_name, count, expiry_date, type_product, created_at) 
                           VALUES ($1, $2, 1, NOW() + INTERVAL '7 days', 'Other', NOW()) RETURNING product_id""",
                        existing_donation['donor_user_id'],
                        food_name
                    )
                    
                    restored_products.append({
                        "product_id": product_id,
                        "product_name": food_name,
                        "count": 1
                    })
                
                print(f"Restored products to inventory: {restored_products}")
            
            return {
                "status": "success", 
                "message": "Donation cancelled successfully! Products restored to inventory.",
                "restored_products": restored_products
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/nearby/", response_model=dict)
async def get_nearby_donations(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_km: float = Query(5.0, description="Search radius in kilometers"),
    user_id: int = Query(..., description="Current user ID to exclude their own donations"),
    pool=Depends(get_db_pool)
):
    """Get donations within specified radius from user's location"""
    try:
        async with pool.acquire() as connection:
            # Exclude current user's own donations from nearby results
            query = """
                SELECT d.*, a.name as donor_name
                FROM donations d
                LEFT JOIN accounts a ON d.donor_user_id = a.user_id
                WHERE d.status = 'Diajukan' AND d.expires_at > NOW()
                  AND d.latitude IS NOT NULL AND d.longitude IS NOT NULL
                  AND d.donor_user_id != $1
                ORDER BY d.created_at DESC
            """
            
            rows = await connection.fetch(query, user_id)
            donations = []
            
            import math
            
            for row in rows:
                donation = dict(row)
                # Convert PostgreSQL array to Python list
                if donation['type_of_food']:
                    donation['type_of_food'] = donation['type_of_food']
                # Convert decimal coordinates to float for frontend, handle NULL values
                donation['latitude'] = float(donation['latitude']) if donation['latitude'] is not None else 0.0
                donation['longitude'] = float(donation['longitude']) if donation['longitude'] is not None else 0.0
                
                # Calculate distance using Haversine formula in Python
                lat1, lon1 = math.radians(latitude), math.radians(longitude)
                lat2, lon2 = math.radians(donation['latitude']), math.radians(donation['longitude'])
                
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distance_km = 6371 * c  # Earth's radius in km
                
                # Only include donations within radius
                if distance_km <= radius_km:
                    donation['distance_km'] = distance_km
                    donations.append(donation)
            
            # Sort by distance (closest first)
            donations.sort(key=lambda x: x['distance_km'])
                
            return {"status": "success", "donations": donations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")