# Lightweight Python 3.10 container for pure algorithmic generation
FROM python:3.10-slim

WORKDIR /usr/src/app

# System dependencies (necessary for OR-tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# PIP cache installation structure
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Port Configuration
ENV PORT=5000
EXPOSE 5000

# Copy application code
COPY . .

# Run uvicorn on all external IP addresses pointing to structural application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
