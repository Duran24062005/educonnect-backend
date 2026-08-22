FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:8000/health/ready >/dev/null || exit 1

CMD ["yarn", "start"]
