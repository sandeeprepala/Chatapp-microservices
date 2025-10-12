# -----------------------
# Build stage
# -----------------------
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Install TypeScript globally for build
RUN npm install -g typescript

# Build TypeScript
RUN npm run build

# -----------------------
# Production stage
# -----------------------
FROM node:18-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built output from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4002
ENV PORT=4002

# Start the app
CMD ["node", "dist/index.js"]
