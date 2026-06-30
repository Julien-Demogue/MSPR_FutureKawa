FROM node:26-alpine3.23
COPY ./src /app/src
COPY ./package-lock.json /app
COPY .env* /app/
COPY ./package.json /app
COPY ./tsconfig.json /app
COPY ./tailwind.config.js /app
COPY ./postcss.config.js /app
COPY ./index.html /app
WORKDIR /app
RUN npm install
RUN chmod -R 777 /app
EXPOSE 5173
RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot
USER nonroot