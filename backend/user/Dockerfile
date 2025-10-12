# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 g++ make

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 4000
ENV PORT=4000
CMD ["node", "dist/index.js"]
