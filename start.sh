#!/bin/sh

# Start the Express server
cd /app/server
PORT=7633 npm start &

# Start the React dev server
cd /app/client
PORT=7632 HOST=0.0.0.0 PUBLIC_URL=/flightnoise npm start
