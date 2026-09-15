FROM node:20-alpine

WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=5s --timeout=5s --start-period=5s --retries=5 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
