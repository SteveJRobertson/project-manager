FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies (ignoring postinstall script bun build error)
RUN npm ci --ignore-scripts

# Copy code
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/frontend

# Run Panda CSS codegen
RUN npm run prepare

EXPOSE 5173

CMD ["npm", "run", "dev"]
