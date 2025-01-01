#!/bin/bash

# Check if .env file exists in client/ directory
if [ ! -f client/.env ]; then
  echo ".env file not found in the client/ directory."
  exit 1
fi

# Check if .env file exists in server/ directory
if [ ! -f server/.env ]; then
  echo ".env file not found in the server/ directory."
  exit 1
fi

echo "All required .env files are present."

# Load environment variables from server/.env
export $(grep -v '^#' server/.env | xargs)

# build the docker image
docker build --build-arg APP_PORT=$APP_PORT -t quickmeet .

# start the container
docker run -e APP_PORT=$APP_PORT -p $APP_PORT:$APP_PORT quickmeet