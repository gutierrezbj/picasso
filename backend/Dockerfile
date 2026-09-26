# Backend (§15.1). ffmpeg va DECLARADO aquí: el motor lo necesita para las
# miniaturas, el último fotograma para encadenar y el material del proveedor
# simulado. Sin ffmpeg el motor no arranca bien.
FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        fonts-liberation \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DATA_DIR=/datos
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD curl -fsS http://localhost:8001/api/salud || exit 1

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
