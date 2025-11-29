FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (including dev) for build
COPY package*.json ./
RUN npm install

# Copy source & build
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Expose application and Node inspector ports
EXPOSE 3000 

CMD ["npm", "run", "start"]
