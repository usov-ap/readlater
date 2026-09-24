# Stage 1: Build Vite React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package files
COPY package*.json ./
RUN npm ci || npm install

# Copy source and build
COPY . .

# Build argument for API base URL (default /api for same-origin via reverse proxy)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Static file server with Nginx and SPA fallback
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
