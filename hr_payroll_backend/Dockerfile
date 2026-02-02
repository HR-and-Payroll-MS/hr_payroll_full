# Backend Dockerfile (supports dev/prod via REQUIREMENTS_FILE)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
ARG REQUIREMENTS_FILE=requirements/local.txt
COPY requirements/ /app/requirements/
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/${REQUIREMENTS_FILE}

# Copy project
COPY . /app/

EXPOSE 8001
