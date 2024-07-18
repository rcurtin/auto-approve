FROM node:20.10-buster-slim

WORKDIR /
COPY . .
USER node

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1
