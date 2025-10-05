"""
Script to set a user as admin
"""
import asyncio
import asyncpg
from database.connection import db_manager

async def set_user_as_admin(user_id: int):
    """Set specific user as admin"""
    try:
        pool = db_manager.get_pool()
        if not pool:
            print("Error: Database connection not available")
            return
            
        async with pool.acquire() as connection:
            # Check if user exists
            user_exists = await connection.fetchval(
                "SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1)",
                user_id
            )
            
            if not user_exists:
                print(f"User with ID {user_id} does not exist")
                return
            
            # Set user as admin
            await connection.execute(
                "UPDATE users SET isadmin = TRUE WHERE user_id = $1", 
                user_id
            )
            
            # Get user info
            user_info = await connection.fetchrow(
                "SELECT user_id, isadmin FROM users WHERE user_id = $1",
                user_id
            )
            
            print(f"Successfully set user_id {user_id} as admin")
            print(f"User info: {dict(user_info)}")
            
    except Exception as e:
        print(f"Error setting user as admin: {str(e)}")

async def list_all_users():
    """List all users with their admin status"""
    try:
        pool = db_manager.get_pool()
        if not pool:
            print("Error: Database connection not available")
            return
            
        async with pool.acquire() as connection:
            users = await connection.fetch(
                "SELECT user_id, isadmin FROM users ORDER BY user_id"
            )
            
            print("\nAll users:")
            print("user_id | isadmin")
            print("-" * 20)
            for user in users:
                print(f"{user['user_id']:7} | {user['isadmin']}")
            
    except Exception as e:
        print(f"Error listing users: {str(e)}")

async def main():
    """Main function"""
    await db_manager.initialize()
    
    # List all users first
    await list_all_users()
    
    # Set user with ID 1 as admin (change this to your desired user ID)
    print(f"\nSetting user_id 1 as admin...")
    await set_user_as_admin(1)
    
    # List users again to confirm
    await list_all_users()
    
    await db_manager.close()

if __name__ == "__main__":
    asyncio.run(main())