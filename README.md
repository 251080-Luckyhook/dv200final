# Ngwana Huis

##### Volunteer Visit Booking Platform

###### Design and Development — DV200

### Ngwana Huis

A volunteer visit booking platform that helps Ngwana Huis coordinate visits, activities, and support for the children in its care.

[Explore the project](#about-the-project) · [View the landing page](#visual-preview) · [Open the local app](http://localhost:5173) · [Report a bug](https://github.com/251080-Luckyhook/dv200final/issues)

> The requested address [http://localhost/Dv200-bucketlist/](http://localhost/Dv200-bucketlist/) is not the default URL for this project. The app uses Vite and Express, not Apache/XAMPP; with the local setup below, open it at **http://localhost:5173**.

## Table of Contents

- [About the Project](#about-the-project)
- [Project Description](#project-description)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [How to Install](#how-to-install)
- [Start the Application](#start-the-application)
- [Features and Functionality](#features-and-functionality)
- [Concept Process](#concept-process)
- [Development Process](#development-process)
- [Reviews and Testing](#reviews-and-testing)
- [Future Implementation](#future-implementation)
- [Final Outcome](#final-outcome)
- [Visual Preview](#visual-preview)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About the Project

### Project Description

Ngwana Huis is a volunteer coordination web application for booking and managing visits. Volunteers can create an account, choose an available time, select an activity, and optionally indicate items they plan to donate. Staff can oversee the daily schedule, manage capacity, coordinate volunteers, and review reports.

The project has a public welcome page and authenticated workspaces for volunteers and staff. It is built as a React frontend with an Express API and MongoDB storage.

## Built With

- [React](https://react.dev/) and [Vite](https://vite.dev/)
- [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [JSON Web Tokens](https://jwt.io/) and bcryptjs for authentication
- [Google Identity Services](https://developers.google.com/identity/gsi/web) for optional Google sign-in
- CSS and [Lucide](https://lucide.dev/) icons
- [Docker](https://www.docker.com/) and Heroku deployment support

## Getting Started

These instructions run the frontend and API locally. The API connects to MongoDB, and the Vite development server proxies `/api` requests to it.

### Prerequisites

- Node.js 20 or later and npm
- A MongoDB Atlas cluster, database user, and connection string
- A Google OAuth web client ID if you want to enable Google sign-in

### How to Install

1. Clone the repository and open its project directory.
2. Create local environment files from the examples:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item frontend\.env.example frontend\.env
   ```

3. Edit `.env` and replace the example values with your own MongoDB connection string, a strong `JWT_SECRET`, and administrator credentials. Set `MONGODB_DB` to `ngwana_huis` unless you want to use another database.
4. To enable Google sign-in, configure a Google OAuth **Web application** client for `http://localhost:5173`. Put the same client ID in `GOOGLE_CLIENT_ID` in the root `.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend\.env`. Google sign-in stays disabled until the frontend client ID is configured.
5. Install the dependencies and initialize the database:

   ```powershell
   npm ci
   npm ci --prefix frontend
   npm run migrate
   ```

The migration prepares MongoDB indexes and creates the first administrator when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are configured. It does not replace an administrator account that already exists.

> Treat all environment files as private. Replace example credentials before use, and never commit `.env` files or real secrets.

### Start the Application

Run both development servers from the project root:

```powershell
npm run dev
```

- Web app: [http://localhost:5173](http://localhost:5173)
- API health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

Create a volunteer account from the welcome page, or sign in with the administrator account configured for the migration. Staff roles include nursery caregiver, volunteer coordinator, and administrator.

## Features and Functionality

### Volunteer Visits

- Browse hourly availability and book a visit with an activity.
- Choose from cuddle therapy, tummy time, play and learn, or feeding support.
- Optionally indicate donations such as nappies, wet wipes, toys, or formula.
- View visit history and logged volunteer hours.
- Reschedule or cancel upcoming visits, and mark when running late.
- Check in on the day of a visit.

### Staff Coordination

- View the daily schedule and manage bookings through the visual calendar.
- See volunteer details and coordinate shift assignments.
- Adjust a time slot's capacity or block and unblock it.
- Manage staff and volunteer account roles.
- Review reporting dashboards, supplies, messages, and application settings.

### Capacity and Visit Rules

- Hourly slots run from 9:00 to 17:00, with a default capacity of eight visits.
- The 12:00 slot is reserved for nap time unless staff explicitly unblock it.
- Staff can override capacity for individual dates and times.
- The reduced-capacity setting lowers each slot's default capacity by one.
- Volunteers can only check in on the date of their booking.

## Concept Process

The product is centered on making volunteer visits easy to arrange while giving staff a clear view of daily capacity and attendance. The public welcome page introduces the service, while separate volunteer and staff views expose only the workflows relevant to each role.

### User Flow

1. A visitor creates an account or signs in.
2. A volunteer selects an available date and time, chooses an activity, and optionally lists donations.
3. The volunteer manages the booking from their visits area and checks in on the visit date.
4. Staff review the schedule, coordinate volunteers, and update slot availability as needed.
5. Staff use reports and supplies tools to support ongoing operations.

## Development Process

The frontend is a React single-page application. During development, Vite serves it on port 5173 and proxies API requests to the Express server on port 5000. Express provides authenticated JSON endpoints and serves the built frontend in production. MongoDB stores accounts, bookings, settings, and related application data.

### Implementation Highlights

- Password-based authentication with hashed passwords and signed JWTs.
- Optional Google sign-in using a backend-verified Google credential.
- Role-protected staff routes and API operations.
- MongoDB indexes and an optional first-administrator seed in the migration script.
- Server-side checks for booking availability, duplicate bookings, and visit dates.
- Configurable booking capacity and staff-managed slot overrides.
- Production frontend build served by the Express application.

## Reviews and Testing

There is no automated test script configured in the project yet. The frontend production build can be checked with:

```powershell
npm run build --prefix frontend
```

Core flows to verify manually when developing include:

- Volunteer registration, login, logout, and Google sign-in when configured.
- Booking an available visit, preventing duplicate or past bookings, rescheduling, and cancellation.
- Day-of check-in and staff updates to visit status.
- Staff calendar access, capacity changes, and blocked or nap-time slots.
- Role-based access to volunteer and staff pages.
- Reports, messages, supplies, and account settings.

## Future Implementation

- Add automated tests for booking rules, authentication, and staff workflows.
- Expand reporting and volunteer-hour export options.
- Improve notifications for booking changes and upcoming visits.
- Continue refining responsive layouts and accessibility across volunteer and staff tools.

## Final Outcome

Ngwana Huis brings volunteer scheduling and staff coordination into one application. Volunteers can arrange and manage visits, while staff have tools for capacity planning, attendance, volunteer coordination, and operational reporting.

## Visual Preview

The following landing-page design is included with the project:

![Ngwana Huis public landing page](exstra/Public%20Landing%20Page%20Desktop.png)

## Deployment

### Heroku

The repository includes a `Procfile` and a Heroku build script. Configure the required environment variables in the Heroku app settings before deploying:

- `MONGODB_URI`
- `MONGODB_DB` (optional; defaults to `ngwana_huis`)
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` if using Google sign-in
- `ADMIN_FULL_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` if the release migration should seed the first administrator
- `APP_TIMEZONE` (defaults to the configured value in your environment)

The frontend OAuth client ID must be available during the build. The release phase runs `npm run migrate`; the web process runs `npm start`. After deployment, check the app's `/api/health` endpoint.

### Docker

Build the image from the repository root, providing the frontend build-time OAuth ID only if Google sign-in is enabled:

```powershell
docker build --build-arg VITE_GOOGLE_CLIENT_ID=your-google-client-id -t ngwana-huis .
docker run --env-file .env -p 5000:5000 ngwana-huis
```

The container needs a reachable MongoDB instance and a valid `JWT_SECRET`.

## Contributing

Contributions are welcome:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make and verify your changes.
4. Commit and push the branch.
5. Open a pull request.

## License

This project is distributed under the [MIT License](LICENSE).

## Contact

- **Project repository:** [251080-Luckyhook/dv200final](https://github.com/251080-Luckyhook/dv200final)
- **Issues and feature requests:** [GitHub Issues](https://github.com/251080-Luckyhook/dv200final/issues)

## Acknowledgements

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Lucide](https://lucide.dev/)
- [Heroku](https://www.heroku.com/)
