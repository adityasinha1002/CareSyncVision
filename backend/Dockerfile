# Multi-stage build for CareSyncVision AI Server
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and other packages
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Set environment variables (override with --env or .env file)
ENV FLASK_APP=wsgi.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV HOST=0.0.0.0

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run the application with Python Flask dev server (for testing)
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
