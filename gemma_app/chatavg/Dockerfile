FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose gateway port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV CHATAVG_PORT=8080

# Start gateway
CMD ["npm", "start"]
