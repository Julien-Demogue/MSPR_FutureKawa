### Initialization
For the first time using this API, you need to follow these steps : 
- Run `npm install`
- Create a `.env` file in the root folder with these variables : 
  - `JWT_SECRET=example_secret` : Secret key used to sign and verify JWT
  - `COUNTRY_API_SECRET=example_secret` : Secret access key used to authenticate API requests
  - `DB_USER=example_username` : Database login
  - `DB_PASSWORD=example_password` : Database password
  - `DB_HOST=host.docker.internal` : Database environment
  - `EMAIL_ADDRESS=email.example.com` : Email address to send alert messages
  - `EMAIL_APP_PASSWORD=password1234` : Email application password used to send alert messages


### Useful commands
- `npm run start` : Starts the production server.
- `npm run start:dev` : Starts the development server with hot-reload
- `npm run test` : Runs the unit and integration tests.
- `npm run test:e2e` :Runs the end-to-end (E2E) tests.