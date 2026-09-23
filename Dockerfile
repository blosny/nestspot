# Multi-stage lightweight Python 3.13 image
FROM python:3.13-slim AS builder

WORKDIR /app

# Install build dependencies
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime stage
FROM python:3.13-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH

# Copy installed dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application source code
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Start FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
