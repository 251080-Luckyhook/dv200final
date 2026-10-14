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

- **Volunteers** can register with their name, email, and password or with Google. They can log in with either method and land on the volunteer dashboard.
- **Staff** log in on the Log in page with full name, phone or email, and password. The first administrator is created by `npm run migrate` from `ADMIN_*` in `.env`.
- An administrator promotes volunteers in **Settings > Account Access** by choosing a role (nursery caregiver, volunteer coordinator or administrator).

## Deploy to Heroku

```
heroku create your-app-name
heroku config:set JWT_SECRET=<long random string>
heroku config:set MONGODB_URI="<your Atlas connection string>"
heroku config:set MONGODB_DB=ngwana_huis
heroku config:set GOOGLE_CLIENT_ID=<id>
heroku config:set VITE_GOOGLE_CLIENT_ID=<id>
heroku config:set ADMIN_FULL_NAME="Your Name" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=<strong password>
heroku config:set APP_TIMEZONE=Africa/Johannesburg
git push heroku HEAD:main
```

`VITE_GOOGLE_CLIENT_ID` must be set **before** the push, because Vite bakes it into the build. Heroku builds the React app (`heroku-postbuild`), runs `node backend/migrate.js` on release, and the Express server serves everything from one URL.

Heroku does not use the local `.env` files. Set these values as Heroku Config Vars instead (the example commands above do this); never commit secrets or upload `.env` files. Set `VITE_GOOGLE_CLIENT_ID` before deploying so it is available during the frontend build. The server requires `MONGODB_URI` and no SQL database.

## Things to swap in

- **Logo:** drop your logo at `frontend/public/logo.png` (the sidebar shows a text wordmark until then).
- **Illustrations:** the nappy, wipes, toys, formula and care icons are emoji placeholders. Replace them in `frontend/src/utils/constants.js`.

## Business rules in the code

- Slots run 9am-5pm hourly, 8 visitors each. 12:00-1:00pm is a nap-time lockout.
- "Reduced capacity" in Settings takes 1 off every slot.
- Staff can change a slot's capacity or block it from the Visual Calendar.
- Volunteers can only check in on the day of their visit. Checking out logs hours (rounded to 0.5).
