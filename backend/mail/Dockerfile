# ---------- BUILD STAGE ----------
FROM node:18-alpine AS builder
WORKDIR /app

# Install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy the rest of the files
COPY . .

# Build TypeScript code
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:18-alpine
WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Expose port (change if needed)
EXPOSE 4001
ENV PORT=4001

# Start the app
CMD ["node", "dist/index.js"]
