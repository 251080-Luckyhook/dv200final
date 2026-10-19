# Ngwana Huis

Volunteer visit booking platform for Ngwana Huis. React (Vite) frontend, Express backend, and MongoDB Atlas for all application data, deployed on Heroku.

## Folder structure

```
ngwana-huis/
├── package.json        Backend dependencies and Heroku scripts
├── Procfile            Heroku: runs migrations on release, then starts the server
├── .env.example        Backend environment template for local development
├── backend/
│   ├── index.js        Express app (also serves the built React app in production)
│   ├── mongoStore.js   MongoDB Atlas connection and collections
│   ├── migrate.js      Creates indexes and the first admin account
│   ├── middleware/     JWT auth and role checks
│   ├── lib/            Slot capacity logic, mappers, dates
│   └── routes/         auth, slots, bookings, supplies, reports, users, settings, feedback
└── frontend/
    ├── package.json
    ├── vite.config.js  Proxies /api to the server in development
    └── src/
        ├── pages/      Login, Signup, Book a session, My visits, Staff home, Supplies,
        │               Visual calendar, Shift board, Reporting hub, Settings
        ├── components/ Sidebar, calendar, modal, toggle
        └── ...
```

## Run it locally

1. Create a MongoDB Atlas cluster and database user. Add your development IP to Atlas Network Access.
2. Copy the environment templates:
   ```powershell
   Copy-Item .env.example .env
   Copy-Item frontend\.env.example frontend\.env
   ```
3. Fill in the root `.env` (`MONGODB_URI`, `JWT_SECRET`, Google client ID, first admin details) and `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`). Do not commit either `.env` file.
4. Install dependencies and initialize MongoDB:
   ```
   npm install
   npm install --prefix frontend
   npm run migrate
   ```
5. Start both servers: `npm run dev`
   - App: http://localhost:5173
   - API: http://localhost:5000

### Google sign-in setup

1. In Google Cloud Console, create an OAuth client of type **Web application**.
2. Add `http://localhost:5173` and your Heroku URL under **Authorized JavaScript origins**.
3. Put the client ID in `GOOGLE_CLIENT_ID` (root `.env`) and `VITE_GOOGLE_CLIENT_ID` (`frontend/.env`).

## MongoDB Atlas setup

Set `MONGODB_URI` to your Atlas connection string and optionally set `MONGODB_DB` (defaults to `ngwana_huis`). If the database username or password contains reserved URI characters, percent-encode them in the connection string. All users, bookings, slot overrides, care requests, feedback, messages, and application settings are stored in MongoDB collections.

## How logins work

- The welcome page is public. Volunteers can register with their name, email, and password or with Google.
- Volunteers and staff use the same Log in form with the email address or phone number and password on their account. The app sends each account to its volunteer or staff dashboard automatically.
- The first administrator is created by `npm run migrate` from `ADMIN_*` in `.env`.
- An administrator promotes volunteers in **Settings > Account Access** by choosing a role (nursery caregiver, volunteer coordinator or administrator).

## Deploy to Heroku

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and sign in:
   ```
   heroku login
   ```
2. Create an app (or use the name of an existing Heroku app):
   ```
   heroku create your-app-name
   ```
3. Set the app's Config Vars before deploying. Replace each placeholder with your real value:

```
heroku config:set JWT_SECRET=<long-random-secret>
heroku config:set MONGODB_URI="<your Atlas connection string>"
heroku config:set MONGODB_DB=ngwana_huis
heroku config:set GOOGLE_CLIENT_ID=<Google OAuth client ID>
heroku config:set VITE_GOOGLE_CLIENT_ID=<same Google OAuth client ID>
heroku config:set ADMIN_FULL_NAME="Your Name" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=<strong-password>
heroku config:set APP_TIMEZONE=Africa/Johannesburg
```

Generate a strong JWT secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Keep all secrets private. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` if you want the release migration to create the first administrator; it does not overwrite an existing account.

4. Add your Heroku app URL to the Google OAuth client's **Authorized JavaScript origins**. Use the same client ID for `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
5. Push the current branch to Heroku:
   ```
   git push heroku HEAD:main
   ```
6. Check the deployment and open the app:
   ```
   heroku logs --tail
   heroku open
   ```
   The API health check is available at `https://your-app-name.herokuapp.com/api/health`.

Heroku does not use local `.env` files; configure values as Heroku Config Vars instead, and never commit or upload `.env` files. `VITE_GOOGLE_CLIENT_ID` must be set **before** the push because Vite embeds it in the frontend build. Heroku installs the frontend from its lockfile and builds it with `heroku-postbuild`, runs `npm run migrate` during the release phase, then starts the Express server with `npm start`. The Express server serves both the API and built frontend from the same app URL. MongoDB Atlas must be reachable from Heroku and `MONGODB_URI` is required.

## Things to swap in

- **Logo:** drop your logo at `frontend/public/logo.png` (the sidebar shows a text wordmark until then).
- **Illustrations:** the nappy, wipes, toys, formula and care icons are emoji placeholders. Replace them in `frontend/src/utils/constants.js`.

## Business rules in the code

- Slots run 9am-5pm hourly, 8 visitors each. 12:00-1:00pm is a nap-time lockout.
- "Reduced capacity" in Settings takes 1 off every slot.
- Staff can change a slot's capacity or block it from the Visual Calendar.
- Volunteers can only check in on the day of their visit. Checking out logs hours (rounded to 0.5).
