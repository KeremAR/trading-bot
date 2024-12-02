FROM python:3.8-slim

WORKDIR /app

# Gerekli sistem paketlerini yükle
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Python paketlerini yüklemek için requirements.txt kopyala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Flask'ı debug modunda çalıştır
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1

EXPOSE 5000

# Python'ı interaktif modda çalıştır
CMD ["python", "-u", "backend.py"] 