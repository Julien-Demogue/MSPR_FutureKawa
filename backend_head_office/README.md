### Initialization
For the first time using this API, you need to follow these steps : 
- Run `npm install`
- Create a `.env` file in the root folder with these variables : 
  - `FRONT_URL=https://exampleurl.com` : User interface frontend URL
  - `JWT_SECRET` : Secret used to encode JWT tokens
  - `COUNTRY_API_SECRET=example_secret` : Secret access key used to authenticate requests on country API — **must match** the `COUNTRY_API_SECRET` configured on `backend_country`
  - `DB_USER=example_username` : Database login
  - `DB_PASSWORD=example_password` : Database password
  - `DB_HOST=host.docker.internal` : Database environment
  - `DEFAULT_ADMIN_EMAIL=admin@example.com` : Email of the admin account auto-created on startup
  - `DEFAULT_ADMIN_PASSWORD=example_password` : Password of that admin account (required — the app crashes on startup if this is missing, see `src/seeds/admin.seeder.ts`)


### Useful commands
- `npm run start` : Starts the production server.
- `npm run start:dev` : Starts the development server with hot-reload
- `npm run test` : Runs the unit and integration tests.


### Documentation
A documentation of the backend is provided with Swagger. 
Use the endpoint `/doc` to see it.