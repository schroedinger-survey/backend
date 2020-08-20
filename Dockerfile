FROM node:alpine

WORKDIR /app

COPY package.json .

COPY package-lock.json .

RUN npm install

COPY . .

RUN npm run migrate-prod

CMD ["npm", "run", "start-prod"]