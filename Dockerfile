FROM node:20-alpine AS development-dependencies-env
RUN apk add --no-cache openssl
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
RUN apk add --no-cache openssl
COPY ./package.json package-lock.json /app/
COPY ./prisma /app/prisma
WORKDIR /app
RUN npm ci --omit=dev && npx prisma generate

FROM node:20-alpine AS build-env
RUN apk add --no-cache openssl
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npx prisma generate && npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/prisma /app/prisma
COPY --from=build-env /app/public /app/public
WORKDIR /app
CMD ["npm", "run", "start"]