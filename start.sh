#!/bin/sh

# Start the Express server
cd /app/server
PORT=3001 npm start &

# Start the React dev server
cd /app/client
PORT=3000 PUBLIC_URL=/flightnoise npm start
