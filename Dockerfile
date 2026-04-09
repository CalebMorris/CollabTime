FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Install deps (layer-cached; only re-runs when package*.json changes)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV CI=true
CMD ["npm", "run", "test:e2e"]
