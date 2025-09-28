from fastapi import FastAPI

# Inisialisasi app FastAPI
app = FastAPI()

# Endpoint root
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# Endpoint dengan parameter
@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello, {name}!"}
