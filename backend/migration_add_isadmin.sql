-- Migration: Add isadmin column to users table
-- Run this SQL in your PostgreSQL database

-- 1. Add isadmin column with default value FALSE
ALTER TABLE users ADD COLUMN IF NOT EXISTS isadmin BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'isadmin';

-- 3. Set specific user as admin (replace user_id with your admin user)
-- UPDATE users SET isadmin = TRUE WHERE user_id = 1;

-- 4. Check current users and their admin status
SELECT user_id, isadmin FROM users ORDER BY user_id;