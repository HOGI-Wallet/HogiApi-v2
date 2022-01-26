FROM node:16-alpine3.14 as build

WORKDIR /usr/app
COPY package.json yarn.lock ./
ADD . ./

RUN yarn && yarn build

FROM node:14-slim

WORKDIR /cryptokara


COPY --from=build /usr/app/node_modules package.json yarn.lock tsconfig.build.json  dist /cryptokara/

COPY .env  ./

EXPOSE 8080

CMD ["yarn", "start"] 
