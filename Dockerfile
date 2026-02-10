# Use Node.js LTS version as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy all application files
COPY . .

# Accept API key as build argument
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build the frontend
RUN npm run build

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
