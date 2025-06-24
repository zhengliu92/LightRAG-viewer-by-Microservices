FROM node:22.13-alpine AS builder
RUN npm config set registry https://registry.npmmirror.com
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22.13-alpine AS production
RUN npm config set registry https://registry.npmmirror.com
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev  --legacy-peer-deps
COPY --from=builder /app/.next ./.next
# COPY .env.local ./.env.local
COPY --from=builder /app/public ./public
EXPOSE 3200
CMD ["npm", "start"]
