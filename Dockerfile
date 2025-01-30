# Stage 1: Build Stage for Dependencies
FROM node:20-alpine AS builder

# Set working directory to /app
WORKDIR /app

# Copy package files from shared, client, and server
COPY shared/package.json /app/shared/
COPY client/package.json /app/client/
COPY server/package.json /app/server/

# Install dependencies using npm workspaces
COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

# Stage 2: Build Shared, Server, and Client
# Assumes client and server dirs contains the .env file
COPY shared/ /app/shared/
COPY server/ /app/server/
COPY client/ /app/client/

# # Build shared libraries
RUN npm run build

# Stage 3: Runtime Stage
CMD ["npm", "run", "start"]