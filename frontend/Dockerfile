FROM node:20-alpine

WORKDIR /app

# Copy entire repository codebase first
COPY . .

# Install dependencies (will run workspace prepare scripts)
RUN npm ci --ignore-scripts

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev"]
