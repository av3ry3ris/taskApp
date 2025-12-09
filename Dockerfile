# Use a slim Python image
FROM python:3.11-slim

# Set working directory in the container
WORKDIR /app

# Install system deps (optional if you need any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Copy requirement definitions
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose Flask port
EXPOSE 5000

# Environment so Flask/Gunicorn uses 0.0.0.0
ENV PYTHONUNBUFFERED=1

# Run with gunicorn for nicer serving
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
