# Use Node base image
FROM node:18-alpine

# Create working directories
WORKDIR /app

# Copy server files and install dependencies
COPY server /app/server
RUN cd /app/server && npm install

# Copy client files and install dependencies
COPY client /app/client
RUN cd /app/client && npm install

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose both ports
EXPOSE 3000
EXPOSE 3001

# Run both servers
CMD ["/app/start.sh"]
