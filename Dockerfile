FROM node:14.8.0-stretch

WORKDIR /app

RUN apt-get update

RUN apt-get install musl-dev -y

RUN ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1

COPY package.json .

COPY package-lock.json .

RUN npm install --only=prod

COPY . .

CMD npm run migrate-prod && npm run start-prod
