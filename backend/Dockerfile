FROM python:3.8-slim

WORKDIR /app

# Gerekli sistem paketlerini yükle
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Python paketlerini yüklemek için requirements.txt oluşturacağız
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY backend.py .

EXPOSE 5000

CMD ["python", "backend.py"] 