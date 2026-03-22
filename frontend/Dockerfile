FROM node:18 AS builder

ARG VITE_ZITADEL_URL
ARG VITE_ZITADEL_CLIENT_ID
ARG VITE_SOLVER_API_URL

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.staging.conf /etc/nginx/conf.d/default.conf
