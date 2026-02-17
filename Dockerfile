FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json yarn.lock ./

# Instalar dependencias (modo producción)
RUN yarn install --production

# Copiar código
COPY src/ ./src/

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', r => { if (r.statusCode !== 200) process.exit(1) })"

# Ejecutar app
CMD ["yarn", "start"]