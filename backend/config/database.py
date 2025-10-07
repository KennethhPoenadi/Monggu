"""
Database configuration settings
"""
import os
from typing import Dict, Any

# Database configuration
DATABASE_CONFIG: Dict[str, Any] = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "Monggu"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "260605")
}

# Connection pool settings
POOL_CONFIG: Dict[str, Any] = {
    "min_size": int(os.getenv("DB_MIN_CONNECTIONS", "1")),
    "max_size": int(os.getenv("DB_MAX_CONNECTIONS", "10"))
}
