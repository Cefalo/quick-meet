#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo ".env file not found in the root directory."
  exit 1
fi

# Load environment variables from the .env file
export $(grep -v '^#' .env | xargs)

# build the Docker image
docker build --build-arg APP_PORT=$APP_PORT -t quickmeet .

# start the container
docker run -e APP_PORT=$APP_PORT -p $APP_PORT:$APP_PORT quickmeet