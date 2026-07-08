### Initialization
For the first time using this app, you need to follow these steps :
- Run `npm install`
- Make sure `backend_head_office` is running on `http://localhost:3001` (see
  `frontend/app_head_office/src/api/axios.config.ts` — the base URL is currently
  hardcoded, no `.env` file needed on the frontend side).

### Useful commands
- `npm run dev` : Starts the development server (Vite).
- `npm run build` : Type-checks (`tsc`) then builds for production.
- `npm run preview` : Serves the production build locally.
- `npx playwright test` : Runs the end-to-end tests (see below).

### Architecture
- Auth/users (`LoginPage`, `AdminDashboard`) call `backend_head_office` directly
  (`/auth/*`, `/users/*`).
- Stocks/Direction/Historique/Alertes (`src/pages/StocksPage.tsx`,
  `DirectionDashboard.tsx`, `HistoriquePage.tsx`, `AlertesPage.tsx`) are backed
  by real data fetched through `backend_head_office`'s `/backend_country/*`
  proxy (no more mock data — `src/data/stocks.data.ts` has been removed).
  The fetching/joining logic lives in `src/api/stocks.api.ts` and
  `src/hooks/useStockOverview.ts`.

**Country/role convention**: a "country" account (role `BRAZIL`/`ECUADOR`/`COLOMBIA`)
is scoped to a `backend_country` `Country` row by exact name — see
`src/constants/countries.constant.ts`. A country must be named exactly
`'Brazil'`, `'Ecuador'` or `'Colombia'` in `backend_country`'s database for that
scoping to work.

### Test data
Without data in `backend_country`, Stocks/Direction/Historique/Alertes will show
empty states. Use `backend_country/seed.sql` to populate a small consistent
dataset (see that repo's README) before testing the app end-to-end.

### End-to-end tests (Playwright)
`e2e/global-setup.ts` creates the 3 test accounts (`admin`, `direction`,
`brazil`, see `e2e/helpers.ts`) via the `backend_head_office` API before the
suite runs — update `EXISTING_ADMIN_EMAIL`/`EXISTING_ADMIN_PASSWORD` in that
file to match an admin account that already exists in your database (e.g. the
one created by `backend_head_office`'s `DEFAULT_ADMIN_EMAIL`/`DEFAULT_ADMIN_PASSWORD`).
The country-isolation and dashboard specs (`e2e/country.spec.ts`,
`e2e/direction.spec.ts`) also expect `backend_country` to contain the
`seed.sql` dataset (or an equivalent: at least one Brazilian batch and one
active alert).
