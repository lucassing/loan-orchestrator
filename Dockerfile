ARG PYTHON_VERSION=3.12-slim
FROM python:${PYTHON_VERSION}

# System deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential curl libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Safer defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install Python deps 
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# App code
COPY . /app

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose Gunicorn port
EXPOSE 8000

# Default command (you can override in docker-compose)
# Uses env var DJANGO_WSGI_MODULE like "core.wsgi"
CMD sh -c "\
        python manage.py migrate --noinput && \
        gunicorn ${DJANGO_WSGI_MODULE}:application --workers ${GUNICORN_WORKERS:-3} --bind 0.0.0.0:8000 \
    "
