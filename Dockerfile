FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
COPY server ./server
COPY scripts ./scripts
COPY migrations ./migrations

CMD ["npm", "start"]
