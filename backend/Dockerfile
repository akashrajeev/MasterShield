FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY backend /app/backend
COPY data /app/data
COPY scripts /app/scripts
COPY ml /app/ml
CMD ["uvicorn","backend.app.main_v3:app","--host","0.0.0.0","--port","8000"]
