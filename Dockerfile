FROM node:14.8.0-alpine3.10

WORKDIR /app

COPY package.json .

COPY package-lock.json .

RUN npm install --silent --only=prod

COPY . .

CMD npm run migrate-prod && npm run start-prod
