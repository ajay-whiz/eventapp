# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

# .npmrc must be present before npm ci (react-quill peer conflict with React 19)
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_IMAGE_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_IMAGE_BASE_URL=$VITE_IMAGE_BASE_URL

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# server.js only uses Node built-ins; no runtime npm dependencies needed
COPY server.js ./
COPY --from=builder /app/dist ./dist

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||5173;http.get('http://127.0.0.1:'+port+'/health',(res)=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1));"

CMD ["node", "server.js"]
