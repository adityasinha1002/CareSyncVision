# Multi-stage build for CareSyncVision Backend

# Build stage: install build tools and compile Python dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage: lean image without build tools
FROM python:3.11-slim

WORKDIR /app

# Only install lightweight runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled Python packages from builder
COPY --from=builder /install /usr/local

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
