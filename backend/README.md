# Monggu Backend API

A clean, organized FastAPI application with PostgreSQL database integration, following best practices with proper separation of concerns.

## 📁 Project Structure

```
backend/
│
├── config/                 # Configuration files
│   ├── __init__.py
│   └── database.py        # Database configuration
│
├── database/              # Database management
│   ├── __init__.py
│   └── connection.py      # Connection pool & database operations
│
├── models/                # Pydantic models & schemas
│   ├── __init__.py
│   └── user.py           # User model & validation schemas
│
├── routers/               # API route definitions
│   ├── __init__.py
│   └── user.py           # User-related endpoints
│
├── venv/                  # Virtual environment
├── .env                   # Environment variables
├── main.py               # FastAPI app entry point
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## 🚀 Setup Instructions

### 1. Create & Activate Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Or for Command Prompt
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Database Configuration

Make sure your PostgreSQL server is running with the following settings:

- **Host:** localhost
- **Port:** 5432
- **Database:** Monggu (will be created automatically)
- **Username:** postgres
- **Password:** root

Update `.env` file if you need different settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Monggu
DB_USER=postgres
DB_PASSWORD=root
```

### 4. Run the Application

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The application will automatically:
- ✅ Create the database if it doesn't exist
- ✅ Set up connection pool
- ✅ Create initial tables
- ✅ Start the server

## 📚 API Documentation

Once the server is running, access:

- **Interactive Docs (Swagger UI):** `http://localhost:8000/docs`
- **Alternative Docs (ReDoc):** `http://localhost:8000/redoc`
- **OpenAPI Schema:** `http://localhost:8000/openapi.json`

## 🛠 API Endpoints

### General Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message & API info |
| `GET` | `/health` | Health check with database status |
| `GET` | `/db-test` | Detailed database connection test |
| `GET` | `/hello/{name}` | Personalized greeting |

### User Management

| Method | Endpoint | Description | Body Schema |
|--------|----------|-------------|-------------|
| `POST` | `/users/` | Create a new user | `UserCreate` |
| `GET` | `/users/` | Get all users | - |
| `GET` | `/users/{id}` | Get user by ID | - |
| `PUT` | `/users/{id}` | Update user by ID | `UserUpdate` |
| `DELETE` | `/users/{id}` | Delete user by ID | - |

### Request/Response Examples

**Create User:**
```json
POST /users/
{
    "name": "John Doe",
    "email": "john@example.com"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "User created successfully!",
    "user_id": 1
}
```

## 🏗 Architecture Overview

### **Config Layer** (`config/`)
- Centralized configuration management
- Environment variable handling
- Database connection settings

### **Database Layer** (`database/`)
- Connection pool management
- Database operations
- Auto-creation of database and tables

### **Models Layer** (`models/`)
- Pydantic schemas for request/response validation
- Data models with type checking
- Email validation with `EmailStr`

### **Routers Layer** (`routers/`)
- API endpoint definitions
- Request handling and validation
- Response formatting
- Error handling

### **Main Application** (`main.py`)
- FastAPI app initialization
- Router registration
- Startup/shutdown event handlers
- Global exception handling

## 🧪 Testing the API

### Using curl:

```bash
# Test connection
curl http://localhost:8000/health

# Create user
curl -X POST http://localhost:8000/users/ \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get all users
curl http://localhost:8000/users/

# Get specific user
curl http://localhost:8000/users/1
```

### Using Python requests:

```python
import requests

# Create user
response = requests.post("http://localhost:8000/users/", 
                        json={"name": "Jane Doe", "email": "jane@example.com"})
print(response.json())

# Get all users
response = requests.get("http://localhost:8000/users/")
print(response.json())
```

## 🗄 DBeaver Connection Settings

To connect DBeaver to the same database:

- **Host:** localhost
- **Port:** 5432
- **Database:** Monggu
- **Username:** postgres
- **Password:** root
- **URL:** `postgresql://postgres:root@localhost:5432/Monggu`

## 🔧 Development

### Adding New Models

1. Create model in `models/` folder
2. Define Pydantic schemas (Create, Update, Response)
3. Add validation rules

### Adding New Endpoints

1. Create router in `routers/` folder
2. Define endpoints with proper HTTP methods
3. Add router to `main.py`

### Database Operations

Use the `db_manager` from `database.connection`:

```python
from database.connection import db_manager

pool = db_manager.get_pool()
async with pool.acquire() as connection:
    result = await connection.fetchval("SELECT * FROM users")
```

## 🛡 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request:** Invalid input data
- **404 Not Found:** Resource doesn't exist
- **500 Internal Server Error:** Database/server errors
- **422 Unprocessable Entity:** Validation errors

## 📦 Dependencies

- **FastAPI:** Modern web framework for APIs
- **Uvicorn:** ASGI server
- **AsyncPG:** PostgreSQL database driver
- **Pydantic:** Data validation using Python type hints
- **Python-dotenv:** Environment variable management

## 🚦 Status

✅ **Production Ready**

- Proper error handling
- Input validation
- Database connection pooling
- Organized code structure
- Comprehensive documentation
