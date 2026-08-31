import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend.app.main_v3:app",host="0.0.0.0",port=8000,reload=True)
