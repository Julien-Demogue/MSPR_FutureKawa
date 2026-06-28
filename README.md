# Project Futurekawa

## structure
```text
├── app_head_office/               # Frontend application
├── backend_country/               # API to manage resources from a country
├── backend_head_office/           # API to manage users and permissions
├── iot/                           # Code for retrieving humidity and temperature data with sensors
├── bdd_country.sql                # Database schema for backend country
├── bdd_head_office.sql            # Database schema for backend head office
├── docker-compose-head-office.yml # Builds required resources for the backend head office
├── docker-compose.yml             # Builds required resources for the backend country
├── Jenkinsfile                    # Test pipeline after each commit, sends Discord notifications
└── run_all_tests.ps1              # Script to run the tests for every service at once
```

## Build the application with docker 

Run the following commands:
- `docker compose -f docker-compose.yml up -d`
- `docker compose -f docker-compose-head-office.yml up -d`
- `docker compose -f docker-compose-monitoring.yml up -d` <-- run others compose files


## Information about APIs

Don't forget to create the .env files as expected in the **backend_country** and **backend_head_office**.

In each API there is a **README.md** file which contains the information to configure them.

## Tests

Tests are automatically run after a commit with Jenkins.

You can run the tests for backends and frontend using the following script : 
- `run_all_api_tests.ps1`

To test a specific service, check in the dedicated **README.md** files.
