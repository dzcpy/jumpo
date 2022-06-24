FROM node:current-alpine

ENV NODE_ENV development

WORKDIR /srv

COPY . /srv

RUN yarn install --no-lockfile
RUN yarn build --webpack

ENV NODE_ENV production

RUN yarn install --prod

CMD ["node", "dist/main.js"]
