import asyncpg
from typing import Optional
from config.database import DATABASE_CONFIG, POOL_CONFIG

class DatabaseManager:
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def create_database_if_not_exists(self) -> bool:
        try:
            conn = await asyncpg.connect(
                host=DATABASE_CONFIG["host"],
                port=DATABASE_CONFIG["port"],
                database="postgres",
                user=DATABASE_CONFIG["user"],
                password=DATABASE_CONFIG["password"]
            )
            
            db_exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", 
                DATABASE_CONFIG["database"]
            )
            
            if not db_exists:
                await conn.execute(f'CREATE DATABASE "{DATABASE_CONFIG["database"]}"')
                print(f"Database '{DATABASE_CONFIG['database']}' created successfully!")
            else:
                print(f"ℹDatabase '{DATABASE_CONFIG['database']}' already exists.")
                
            await conn.close()
            return True
            
        except Exception as e:
            print(f"Failed to create database: {e}")
            return False
    
    async def create_connection_pool(self) -> bool:
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
            print("Database connection pool created successfully!")
            return True
        except Exception as e:
            print(f"Failed to create connection pool: {e}")
            return False
    
    async def close_connection_pool(self):
        if self.pool:
            await self.pool.close()
            print("Database connection pool closed")
    
    async def create_initial_tables(self):
        if not self.pool:
            print("No database connection available")
            return
        try:
            async with self.pool.acquire() as connection:
                # Create accounts table first (main table with user_id)
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS accounts (
                        user_id SERIAL PRIMARY KEY,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create users table (game data extension)
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL UNIQUE,
                        poin INTEGER DEFAULT 0,
                        rank VARCHAR(100) DEFAULT 'beginner',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_account FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
                    )
                ''')
                
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS products (
                        product_id SERIAL PRIMARY KEY,
                        product_name VARCHAR(100) NOT NULL,
                        expiry_date DATE NOT NULL,
                        count INTEGER NOT NULL,
                        type_product VARCHAR(100) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS delivery (
                        delivery_id SERIAL PRIMARY KEY,
                        user_id1 INTEGER NOT NULL,
                        user_id2 INTEGER NOT NULL,
                        product_id INTEGER NOT NULL,
                        status VARCHAR(100) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_sender FOREIGN KEY(user_id1) REFERENCES accounts(user_id) ON DELETE CASCADE,
                        CONSTRAINT fk_receiver FOREIGN KEY(user_id2) REFERENCES accounts(user_id) ON DELETE CASCADE,
                        CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
                    )
                ''')
                print("✅ Initial tables created successfully!")
        except Exception as e:
            print(f"❌ Failed to create initial tables: {e}")
    
    def get_pool(self) -> Optional[asyncpg.Pool]:
        return self.pool

# Global database manager instance
db_manager = DatabaseManager()
