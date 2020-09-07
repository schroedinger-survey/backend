FROM node:14.8.0-stretch

WORKDIR /app

RUN apt-get update

COPY package.json .

COPY package-lock.json .

RUN npm install --only=prod

COPY . .

CMD npm run index-prod && npm run migrate-prod && npm run start-prod
