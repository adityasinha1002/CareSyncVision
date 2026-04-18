# Multi-stage build for CareSyncVision Backend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
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

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production
ENV PORT=5000

# Expose Flask port
EXPOSE 5000

# Health check - test the API health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run with gunicorn (entry point controlled by Procfile on Railway)
# Use PORT environment variable if set, otherwise default to 5000
# Using 1 worker to avoid SQLAlchemy multiprocessing binding issues
# Flask-SQLAlchemy isn't designed for process forking
CMD exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --worker-class sync --timeout 120 --access-logfile - --error-logfile - main:app
