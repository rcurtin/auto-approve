FROM node:20.10-buster-slim

COPY . .
USER node

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
