### Initialization
For the first time using this API, you need to follow these steps : 
- Run `npm install`
- Create a `.env` file in the root folder with these variables : 
  - `FRONT_URL=https://exampleurl.com` : User interface frontend URL
  - `JWT_SECRET` : Secret used to encode JWT tokens
  - `COUNTRY_API_SECRET=example_secret` : Secret access key used to authenticate requests on country API
  - `DB_USER=example_username` : Database login
  - `DB_PASSWORD=example_password` : Database password
  - `DB_HOST=host.docker.internal` : Database environment


### Useful commands
- `npm run start` : Starts the production server.
- `npm run start:dev` : Starts the development server with hot-reload
- `npm run test` : Runs the unit and integration tests.