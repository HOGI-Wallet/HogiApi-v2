FROM node:12.14.1-alpine as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn build

FROM node:12-slim

WORKDIR /app

ENV NODE_ENV=production
COPY --from=build-deps /usr/src/app/package.json /app/package.json

COPY --from=build-deps /usr/src/app/yarn.lock /app/yarn.lock
COPY --from=build-deps /usr/src/app/tsconfig.build.json /app/tsconfig.build.json

COPY --from=build-deps /usr/src/app/dist /app/dist

COPY --from=build-deps usr/src/app/node_modules /app/node_modules
COPY .env /app/.env

EXPOSE 8080

CMD ["yarn", "start"]