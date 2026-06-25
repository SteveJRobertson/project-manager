FROM node:20-alpine

WORKDIR /app

# Copy entire repository codebase first
COPY . .

# Install dependencies (--ignore-scripts suppresses lifecycle hooks including prepare)
RUN npm ci --ignore-scripts

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev"]
