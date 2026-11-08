FROM python:3.12-slim

# System-Abhängigkeiten & FFmpeg installieren
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend-Code kopieren
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PORT=8000
ENV HOST=0.0.0.0
ENV ALLOWED_ORIGINS=*

EXPOSE 8000

CMD ["python", "server.py"]
