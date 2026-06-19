FROM node:26-alpine3.23
COPY ./src /app
RUN chmod -R 777 /app
COPY ./package-lock.json /app
COPY ./package.json /app
COPY ./tsconfig.json /app
WORKDIR /app
RUN npm install
EXPOSE 3001
RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot
USER nonroot