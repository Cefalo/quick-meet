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
RUN npm install


# Stage 2: Build Shared, Server, and Client

# Define build arguments
ARG SQLITE_DB
ARG APP_PORT
ARG NODE_ENV
ARG OAUTH_CLIENT_SECRET
ARG OAUTH_CLIENT_ID
ARG OAUTH_REDIRECT_URL
ARG JWT_SECRET
ARG REACT_APP_APP_TITLE
ARG REACT_APP_APP_SLOGAN
ARG REACT_APP_CLIENT_ID
ARG REACT_APP_REDIRECT_URI
ARG REACT_APP_BACKEND_ENDPOINT
ARG REACT_APP_ENVIRONMENT
ARG BUILD_PATH
ARG REACT_APP_MOCK_CALENDER
ARG MOCK_CALENDER

COPY shared/ /app/shared/
COPY server/ /app/server/
COPY client/ /app/client/

# Set environment variables for server
RUN touch /app/server/.env
RUN echo "SQLITE_DB=${SQLITE_DB}" >> /app/server/.env && \
    echo "APP_PORT=${APP_PORT}" >> /app/server/.env && \
    echo "NODE_ENV=${NODE_ENV}" >> /app/server/.env && \
    echo "OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}" >> /app/server/.env && \
    echo "OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}" >> /app/server/.env && \
    echo "MOCK_CALENDER=${MOCK_CALENDER}" >> /app/server/.env && \
    echo "JWT_SECRET=${JWT_SECRET}" >> /app/server/.env

# Set environment variables for client
RUN touch /app/client/.env
RUN echo "REACT_APP_APP_TITLE=${REACT_APP_APP_TITLE}" >> /app/client/.env && \
    echo "REACT_APP_APP_SLOGAN=${REACT_APP_APP_SLOGAN}" >> /app/client/.env && \
    echo "REACT_APP_CLIENT_ID=${REACT_APP_CLIENT_ID}" >> /app/client/.env && \
    echo "REACT_APP_REDIRECT_URI=${REACT_APP_REDIRECT_URI}" >> /app/client/.env && \
    echo "REACT_APP_BACKEND_ENDPOINT=${REACT_APP_BACKEND_ENDPOINT}" >> /app/client/.env && \
    echo "REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}" >> /app/client/.env && \
    echo "BUILD_PATH=${BUILD_PATH}" >> /app/client/.env  && \
    echo "REACT_APP_MOCK_CALENDER=${REACT_APP_MOCK_CALENDER}" >> /app/client/.env

# # Build shared libraries
RUN npm run build

RUN npm run migration:run
# # Stage 3: Runtime Stage

# # Set environment variables
ARG APP_PORT
ENV PORT=${APP_PORT}
EXPOSE ${PORT}

CMD ["npm", "run", "start"]