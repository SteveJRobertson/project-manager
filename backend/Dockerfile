FROM node:20-alpine

# Install native dependencies required by Prisma engine (openssl3 for Alpine)
RUN apk add --no-cache openssl3 libc6-compat

WORKDIR /app

# Copy entire repository codebase first
COPY . .

# Install dependencies
RUN npm ci --ignore-scripts

# Generate Prisma Client inside the container so it picks up the correct binary target
RUN cd backend && npx prisma generate

EXPOSE 5001

CMD ["npm", "run", "dev", "-w", "backend"]
