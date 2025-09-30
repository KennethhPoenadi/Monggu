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
                        user_id INTEGER NOT NULL,
                        product_name VARCHAR(100) NOT NULL,
                        expiry_date DATE NOT NULL,
                        count INTEGER NOT NULL,
                        type_product VARCHAR(100) NOT NULL,
                        image_url VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_product_owner FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
                    )
                ''')
                
                # Create donations table
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS donations (
                        donation_id SERIAL PRIMARY KEY,
                        donor_user_id INTEGER NOT NULL,
                        receiver_user_id INTEGER,
                        type_of_food TEXT[] NOT NULL,
                        latitude DECIMAL(10, 8) NOT NULL,
                        longitude DECIMAL(11, 8) NOT NULL,
                        status VARCHAR(20) DEFAULT 'Diajukan' CHECK (status IN ('Diajukan', 'Siap Dijemput', 'Diterima')),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
                        CONSTRAINT fk_donor FOREIGN KEY(donor_user_id) REFERENCES accounts(user_id) ON DELETE CASCADE,
                        CONSTRAINT fk_receiver FOREIGN KEY(receiver_user_id) REFERENCES accounts(user_id) ON DELETE SET NULL
                    )
                ''')
                
                # Create notifications table
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS notifications (
                        notification_id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        message TEXT NOT NULL,
                        notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('Product Expiry', 'Donation Received', 'Donation Expired', 'Reward Earned')),
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_notification_user FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
                    )
                ''')
                
                # Create rewards table
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS rewards (
                        reward_id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        description TEXT NOT NULL,
                        points_required INTEGER NOT NULL,
                        reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('Voucher', 'Discount', 'Free Item', 'Badge')),
                        value VARCHAR(100) NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create user_rewards table (junction table for claimed rewards)
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS user_rewards (
                        user_reward_id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        reward_id INTEGER NOT NULL,
                        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_used BOOLEAN DEFAULT FALSE,
                        used_at TIMESTAMP,
                        CONSTRAINT fk_user_reward_user FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE,
                        CONSTRAINT fk_user_reward_reward FOREIGN KEY(reward_id) REFERENCES rewards(reward_id) ON DELETE CASCADE,
                        UNIQUE(user_id, reward_id)
                    )
                ''')
                
                # Create delivery table
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
                
                # Create recipes table
                await connection.execute('''
                    CREATE TABLE IF NOT EXISTS recipes (
                        recipe_id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        description TEXT,
                        ingredients TEXT[] NOT NULL,
                        instructions TEXT[] NOT NULL,
                        category VARCHAR(50) NOT NULL,
                        prep_time INTEGER NOT NULL,
                        servings INTEGER NOT NULL,
                        difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
                        image_url TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP,
                        CONSTRAINT fk_recipe_user FOREIGN KEY(user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
                    )
                ''')
                
                print("✅ Initial tables created successfully!")
        except Exception as e:
            print(f"❌ Failed to create initial tables: {e}")
    
    def get_pool(self) -> Optional[asyncpg.Pool]:
        return self.pool

# Global database manager instance
db_manager = DatabaseManager()
