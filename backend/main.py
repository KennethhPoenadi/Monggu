from dotenv import load_dotenv
load_dotenv() 

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database.connection import db_manager
from routers import user, account, product, delivery, google_oauth, donation, notification, reward, recipe, food_ai
from config.database import DATABASE_CONFIG

app = FastAPI(
    title="Monggu API", 
    description="A clean and organized API with PostgreSQL connection",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router)
app.include_router(account.router)
app.include_router(product.router)
app.include_router(delivery.router)
app.include_router(google_oauth.router)
app.include_router(donation.router)
app.include_router(notification.router)
app.include_router(reward.router)
app.include_router(recipe.router, prefix="/recipes", tags=["recipes"])
app.include_router(food_ai.router, prefix="/ai", tags=["food-ai"])

@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Monggu API...")
    
    db_created = await db_manager.create_database_if_not_exists()
    if not db_created:
        print("❌ Could not ensure database exists, continuing anyway...")
    
    pool_created = await db_manager.create_connection_pool()
    if not pool_created:
        print("❌ Failed to create connection pool!")
        return
    
    await db_manager.create_initial_tables()
    
    print("✅ Monggu API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Shutting down Monggu API...")
    await db_manager.close_connection_pool()
    print("✅ Monggu API shutdown complete!")

@app.get("/")
async def read_root():
    return {
        "message": "Welcome to Monggu API!", 
        "database": DATABASE_CONFIG["database"],
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        async with pool.acquire() as connection:
            result = await connection.fetchval("SELECT 1")
            db_name = await connection.fetchval("SELECT current_database()")
            return {
                "status": "healthy",
                "database": db_name,
                "connection": "active"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/db-test")
async def test_database():
    """Test database connection - detailed info"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        async with pool.acquire() as connection:
            version = await connection.fetchval("SELECT version()")
            db_name = await connection.fetchval("SELECT current_database()")
            return {
                "status": "success",
                "message": "Database connection successful!",
                "current_database": db_name,
                "postgresql_version": version
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/hello/{name}")
async def say_hello(name: str):
    """Say hello to someone"""
    return {"message": f"Hello, {name}! Welcome to Monggu API!"}