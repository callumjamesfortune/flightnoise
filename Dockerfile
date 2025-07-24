# Use Node base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# ---- SERVER ----
COPY server /app/server
RUN cd /app/server && npm install

# ---- CLIENT ----
COPY client /app/client
RUN cd /app/client && npm install && npm run build

# Copy client build to a shared volume folder (bind-mounted by the host)
RUN mkdir -p /static && cp -r /app/client/build/* /static/

# Start server
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 7633  # Server only

CMD ["/app/start.sh"]
