FROM node:20-alpine

WORKDIR /app

# Copy entire repository codebase first
COPY . .

# Install dependencies
RUN npm ci --ignore-scripts

# Generate Prisma Client
RUN npm run db:generate -w backend

EXPOSE 5001

CMD ["npm", "run", "dev", "-w", "backend"]
