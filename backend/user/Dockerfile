# ---------- BUILD STAGE ----------
FROM node:18 AS builder
WORKDIR /app

# Ensure devDependencies (like TypeScript) are installed
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# Copy dependency files first (for caching)
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:18
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 4000
ENV PORT=4000

# Start the app
CMD ["node", "dist/index.js"]
