FROM node:20-alpine

WORKDIR /app

# Copy package lock and config files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --ignore-scripts

# Copy codebases
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma Client
RUN npm run db:generate -w backend

EXPOSE 5001

CMD ["npm", "run", "dev", "-w", "backend"]
