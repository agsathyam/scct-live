# --- STAGE 1: Frontend Build ---
FROM node:22-alpine AS frontend_builder

WORKDIR /app/ui

COPY ui/package*.json ./
# COPY ui/.env ./.env  <-- REMOVED: We use build args now for best practice
COPY ui/vite.config.ts ./

# Receive Build Args (passed from deploy script)
ARG VITE_VERTEX_AGENT_ENDPOINT
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Persist them as ENV vars for the build process
ENV VITE_VERTEX_AGENT_ENDPOINT=$VITE_VERTEX_AGENT_ENDPOINT \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

COPY ui/tsconfig*.json ./
COPY ui/index.html ./
COPY ui/public/ ./public/
COPY ui/src/ ./src/

# Build
# Lockfile has private registry URLs that fail in Cloud Build.
# We remove it and install fresh from public npm.
RUN rm -f package-lock.json && npm install
# We set the Endpoint to empty/relative because it's served by the same host
ENV VITE_VERTEX_AGENT_ENDPOINT=/stream
RUN npm run build -- --emptyOutDir

# --- STAGE 2: Backend Runtime ---
FROM python:3.11-slim

WORKDIR /app

# Install System Dependencies (if any reqs need build tools)
# RUN apt-get update && apt-get install -y gcc

# Copy Backend Requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/app.py .

# Copy Built Assets from Frontend Stage
# Vite config output was: ../backend/static -> /app/ui/../backend/static -> /app/backend/static
# Wait, inside the container build context:
# WORKDIR /app/ui used ../backend/static relative to itself.
# So artifacts are in /app/backend/static inside the 'frontend_builder' image.
COPY --from=frontend_builder /app/backend/static ./static
# Create templates directory and move index.html there (Flask expects it in templates)
RUN mkdir templates && mv static/index.html templates/index.html

# Environment Variables (Defaults)
ENV PORT=8080
ENV PYTHONUNBUFFERED=True

# Run Gunicorn
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 120 app:app
