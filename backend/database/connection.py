"""
Database connection management
"""
import asyncpg
from typing import Optional
from config.database import DATABASE_CONFIG, POOL_CONFIG

class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def create_database_if_not_exists(self) -> bool:
        """Create database if it doesn't exist"""
        try:
            # Connect to default 'postgres' database
            conn = await asyncpg.connect(
                host=DATABASE_CONFIG["host"],
                port=DATABASE_CONFIG["port"],
                database="postgres",
                user=DATABASE_CONFIG["user"],
                password=DATABASE_CONFIG["password"]
            )
            
            # Check if target database exists
            db_exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", 
                DATABASE_CONFIG["database"]
            )
            
            if not db_exists:
                await conn.execute(f'CREATE DATABASE "{DATABASE_CONFIG["database"]}"')
                print(f"✅ Database '{DATABASE_CONFIG['database']}' created successfully!")
            else:
                print(f"ℹ️ Database '{DATABASE_CONFIG['database']}' already exists.")
                
            await conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Failed to create database: {e}")
            return False
    
    async def create_connection_pool(self) -> bool:
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                host=DATABASE_CONFIG["host"],
                port=DATABASE_CONFIG["port"],
                database=DATABASE_CONFIG["database"],
                user=DATABASE_CONFIG["user"],
                password=DATABASE_CONFIG["password"],
                min_size=POOL_CONFIG["min_size"],
                max_size=POOL_CONFIG["max_size"]
            )
            print("✅ Database connection pool created successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to create connection pool: {e}")
            return False
    
    async def close_connection_pool(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("🔌 Database connection pool closed")
    
    async def create_initial_tables(self):
        """Create initial database tables"""
        if not self.pool:
            print("❌ No database connection available")
            return
        
        try:
            async with self.pool.acquire() as connection:
                # Create users table
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                print("✅ Initial tables created successfully!")
        except Exception as e:
            print(f"❌ Failed to create initial tables: {e}")
    
    def get_pool(self) -> Optional[asyncpg.Pool]:
        """Get the database connection pool"""
        return self.pool

# Global database manager instance
db_manager = DatabaseManager()
