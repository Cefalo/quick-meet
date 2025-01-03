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

# Check if APP_PORT is passed as an argument, otherwise use the value from .env
if [ -z "$1" ]; then
  if [ -z "$APP_PORT" ]; then
    echo "APP_PORT is not set in the environment or passed as an argument."
    exit 1
  else
    CONTAINER_PORT=$APP_PORT
    echo "Using CONTAINER_PORT from environment: $CONTAINER_PORT"
  fi
else
  CONTAINER_PORT=$1
  echo "Using provided CONTAINER_PORT: $CONTAINER_PORT"
fi

# build the docker image
docker build -t quickmeet .

# start the container
docker run -d -p $CONTAINER_PORT:$APP_PORT quickmeet
