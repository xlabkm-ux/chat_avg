# Use Node.js LTS (Alpine for smaller size)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --omit=dev

# Copy source code
COPY server.js ./

# Expose the port from .env (default 8202)
EXPOSE 8202

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
