# ClientFlow — Client Project Management Platform

Intro (landing) page for a client project management platform, built with:

| Layer     | Tech                                   |
| --------- | -------------------------------------- |
| Frontend  | React 18 + Vite                        |
| Backend   | Node.js + Express                      |
| Database  | MongoDB (Mongoose)                     |

The landing page content (hero, features, steps, stats, CTA) is stored in MongoDB and served
through the API, so you can edit the copy in the database without touching the React code.

## Project structure

```
client/                       # React frontend
  index.html
  src/
    App.jsx                   # loads intro content from the API (with local fallback)
    components/               # Navbar, Hero, Features, HowItWorks, Stats, CTA, Footer
    data/fallback.js          # instant-render fallback copy
    services/api.js           # fetch wrapper
    styles.css
server/                       # Node.js backend
  .env / .env.example
  src/
    index.js                  # Express app + CORS + routes
    config/db.js              # MongoDB connection
    models/Intro.js           # Mongoose schema + default content
    controllers/introController.js
    routes/introRoutes.js
    seed/seed.js              # inserts the default intro document
```

## Getting started

Requires Node.js 18+ and a running MongoDB (default: `mongodb://127.0.0.1:27017`).

```bash
# 1. install dependencies
npm run install:all

# 2. seed the intro content into MongoDB
npm run seed

# 3. start the API (http://localhost:5000)  — terminal 1
npm run dev:server

# 4. start the frontend (http://localhost:5173) — terminal 2
npm run dev:client
```

Open http://localhost:5173 — the page fetches `/api/intro` through the Vite proxy.

## API

| Method | Endpoint      | Description                                     |
| ------ | ------------- | ----------------------------------------------- |
| GET    | `/api/health` | Health check                                    |
| GET    | `/api/intro`  | Intro page content (`source: database|defaults`) |
| PUT    | `/api/intro`  | Update intro content (upsert)                   |

Example — change the hero headline:

```bash
curl -X PUT http://localhost:5000/api/intro \
  -H "Content-Type: application/json" \
  -d '{"hero":{"title":"Run every client project","highlight":"from one dashboard"}}'
```

If MongoDB is unreachable, the API (and the page) fall back to the built-in default copy,
so the landing page never breaks.

## Environment variables (`server/.env`)

| Variable     | Default                                        |
| ------------ | ---------------------------------------------- |
| `PORT`       | `5000`                                         |
| `MONGO_URI`  | `mongodb://127.0.0.1:27017/client_project_management` |
| `CLIENT_URL` | `http://localhost:5173` (CORS origin)          |
