FROM node:22-alpine
WORKDIR /app
COPY package*.json ./

# FIX: Use 'install' to generate lockfile if missing/mismatched
RUN npm install --no-audit --no-fund && npm cache clean --force

COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
