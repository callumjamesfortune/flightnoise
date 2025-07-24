#!/bin/bash

# Search for running containers with the name "flightnoise-container"
containers=$(docker ps -q --filter "name=flightnoise-container")

# Stop and remove each container found
if [ -n "$containers" ]; then
    echo "Stopping and removing containers: $containers"
    docker stop $containers
    docker rm $containers
else
    echo "No containers found with the name 'flightnoise-container'."
fi

# Build the Docker image
echo "Building the Docker image..."
docker build -t flightnoise .

# Run the Docker container
echo "Running the Docker container..."
docker run -d -p 7632:7632 -p 7633:7633 --name flightnoise-container flightnoise