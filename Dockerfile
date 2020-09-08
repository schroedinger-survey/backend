FROM node:14.8.0-stretch

WORKDIR /app

RUN apt-get update

COPY package.json .

COPY package-lock.json .

RUN npm install --only=prod

COPY . .
