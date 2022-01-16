FROM node:14 as build

WORKDIR /usr/app
COPY package.json yarn.lock ./
ADD . ./

RUN yarn && yarn build

FROM node:14

WORKDIR /Cryptokara


COPY --from=build /usr/app/node_modules /Cryptokara/node_modules

COPY --from=build /usr/app/package.json  /Cryptokara/package.json
COPY --from=build /usr/app/yarn.lock /Cryptokara/yarn.lock
COPY --from=build /usr/app/tsconfig.build.json  /Cryptokara/tsconfig.build.json

COPY --from=build /usr/app/dist /weicrypto-legal/dist

COPY .env  ./

EXPOSE 8080

CMD ["yarn", "start"] 
