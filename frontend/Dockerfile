FROM node:20-alpine AS build

WORKDIR /app

# Recebe a URL do backend em build time (injetada pelo Dokku via --build-arg)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Estágio de produção com nginx ─────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
