FROM node:alpine

WORKDIR /app

COPY package.json .

COPY package-lock.json .

RUN npm install --silent

COPY . .

CMD npm run migrate-prod && npm run start-prod