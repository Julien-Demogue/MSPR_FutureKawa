FROM node:26-alpine3.23
COPY ./src /app/src
RUN chmod -R 777 /app
COPY ./package-lock.json /app
COPY .env* /app/
COPY ./package.json /app
COPY ./tsconfig.json /app
WORKDIR /app
RUN npm install
EXPOSE 3000
RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot
USER nonroot