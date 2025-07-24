FROM node:18-alpine

WORKDIR /app

# Install serve globally to serve the React build later
RUN npm install -g serve

# Copy server package.json and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy client package.json and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy all source files
COPY server ./server
COPY client ./client

# Build React app (outputs to /app/client/build)
RUN cd client && npm run build

# Expose ports: 7633 for backend, 7632 for serve (React)
EXPOSE 7633
EXPOSE 7632

# Run both backend server and serve static React build concurrently
CMD sh -c "cd /app/server && npm run start & serve -s /app/client/build -l 7632"
