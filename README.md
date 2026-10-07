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
    App.jsx                    # routes: /  /login  /dashboard (protected)
    context/AuthContext.jsx     # session restore, login/logout, 401 handling
    components/
      ProtectedRoute.jsx        # blocks private pages from anonymous visitors
      Navbar, Hero, Features, HowItWorks, Stats, CTA, Footer
    pages/
      Landing.jsx               # public intro page
      Login.jsx                 # /login
      Dashboard.jsx             # /dashboard (requires a valid token)
    data/fallback.js            # instant-render fallback copy
    services/api.js             # fetch wrapper + JWT header
    styles.css
server/                       # Node.js backend
  .env / .env.example
  src/
    index.js                    # Express app + CORS + routes
    config/db.js                # MongoDB connection
    middleware/auth.js           # requireAuth (JWT) + requireRole (RBAC)
    models/                     # User, Client, Project, Intro
    controllers/                # auth, client, project, intro
    routes/                     # /api/auth, /api/projects, /api/clients, /api/intro
    seed/seed.js                # intro copy + admin/member users + clients + sample projects
```

## Getting started

Requires Node.js 18+ and a running MongoDB (default: `mongodb://127.0.0.1:27017`).

```bash
# 1. install dependencies
npm run install:all

# 2. seed intro content + admin account + sample projects
npm run seed

# 3. start the API (http://localhost:5000)  — terminal 1
npm run dev:server

# 4. start the frontend (http://localhost:5173) — terminal 2
npm run dev:client
```

Open http://localhost:5173 — the landing page fetches `/api/intro` through the Vite proxy.

## Authentication

- **Algorithm:** JWT (HS256), signed with `JWT_SECRET`, valid for `JWT_EXPIRES_IN` (7 days).
- **Passwords:** hashed with bcrypt (10 rounds), stored as `passwordHash`, never returned.
- **Transport:** an **httpOnly cookie** (`cpmp_token`) — set by `POST /api/auth/login`
  or `POST /api/auth/register`, sent
  automatically by the browser with `credentials: "include"`. JavaScript cannot read it,
  so the token never appears in `localStorage`, in the page, or in frontend code.
  `Authorization: Bearer <jwt>` is still accepted for server-to-server tools (curl, Postman, CI).
- **Cookie flags:** `HttpOnly` · `SameSite=Lax` (CSRF protection) · `Path=/` ·
  `Secure` when `NODE_ENV=production` · `Max-Age` matches `JWT_EXPIRES_IN`.
- **Session restore:** on load the app calls `GET /api/auth/me` with the cookie; an
  invalid/expired session clears the user and a global `auth:expired` event signs out
  everywhere. `POST /api/auth/logout` expires the cookie server-side.
- **Sign-up:** `POST /api/auth/register` (public, `/signup`) creates an account and signs
  the user in straight away. The role is **hard-coded to `member` server-side** — the
  request body can never grant admin. Admin accounts are still created by an admin
  through `POST /api/auth/users`.

**Seeded accounts** (admin credentials come from `server/.env`):

| Role   | Email                 | Password    |
| ------ | --------------------- | ----------- |
| admin  | `admin@clientflow.io` | `Admin123!` |
| member | `jane@clientflow.io`  | `Member123!`|

**Protected pages** (React Router + `ProtectedRoute`):

| Route        | Access            | Behaviour when anonymous                       |
| ------------ | ----------------- | ---------------------------------------------- |
| `/`          | public            | —                                              |
| `/login`     | public            | sends signed-in users to their `next` target   |
| `/signup`    | public            | creates a member account, then signs the user in |
| `/dashboard` | authenticated     | redirected to `/login?next=/dashboard`         |

**Protected APIs:**

| Endpoint                | Access                                  |
| ----------------------- | --------------------------------------- |
| `GET /api/health`       | public                                  |
| `GET /api/intro`        | public                                  |
| `POST /api/auth/login`  | public                                  |
| `POST /api/auth/register` | public — creates a **member** account  |
| `GET /api/auth/me`      | any valid token                         |
| `POST /api/auth/logout` | any valid token                         |
| `GET /api/projects`     | any valid token — **owned or assigned** (admin sees all) |
| `POST /api/projects`    | any valid token                         |
| `GET /api/projects/:id` | owner, assigned member or admin         |
| `PUT /api/projects/:id` | **owner or admin** — teammates get 403  |
| `DELETE /api/projects/:id` | **owner or admin** — teammates get 403 |
| `GET /api/clients`      | any valid token — client directory      |
| `POST /api/clients`     | any valid token                         |
| `GET /api/auth/users`   | any valid token — team directory        |
| `PUT /api/intro`        | **admin only** (403 for members)        |
| `POST /api/auth/users`  | **admin only**                          |

### Project management

A project holds a **name**, **description**, **status** (`planning` · `in-progress` ·
`review` · `delivered`), **progress**, **budget** and **due date**, is assigned to
exactly **one client** (`Client` collection) and to **any number of team members**
(`teamMembers` → `User[]`).

| Action                | Admin | Project owner | Assigned teammate | Anyone else |
| --------------------- | ----- | ------------- | ----------------- | ----------- |
| List / view           | ✅ all | ✅            | ✅                | ❌ 404      |
| Create                | ✅     | ✅            | ✅                | ❌ 401      |
| Update                | ✅ all | ✅            | ❌ 403            | ❌ 404      |
| Delete                | ✅ all | ✅            | ❌ 403            | ❌ 404      |
| Create/list clients   | ✅     | ✅            | ✅                | ❌ 401      |

Projects someone cannot see return **404** (existence is never leaked); projects they
can see but not edit return **403**.

## API

| Method | Endpoint           | Auth    | Description                                       |
| ------ | ------------------ | ------- | ------------------------------------------------- |
| GET    | `/api/health`      | —       | Health check                                      |
| GET    | `/api/intro`       | —       | Intro page content (`source: database`/`defaults`) |
| PUT    | `/api/intro`       | admin   | Update intro content (deep merge, upsert)         |
| POST   | `/api/auth/login`  | —       | `{email, password}` → sets session cookie + `{user, expiresAt}` |
| POST   | `/api/auth/register` | —     | `{name, email, password}` → creates a **member** account, sets the session cookie (409 if the email exists, 400 when the password is under 8 characters) |
| GET    | `/api/auth/me`     | token   | Current user                                      |
| POST   | `/api/auth/logout` | token   | Stateless logout                                  |
| POST   | `/api/auth/users`  | admin   | Create an account `{name, email, password, role}` |
| GET    | `/api/auth/users`  | token   | Team directory `{id, name, email, role}` (for assignments) |
| GET    | `/api/clients`     | token   | List clients, sorted by name                      |
| POST   | `/api/clients`     | token   | Create a client `{name, contactName?, email?, …}` (409 on duplicate name) |
| GET    | `/api/projects`    | token   | List projects owned by or assigned to the caller (admin: all) |
| POST   | `/api/projects`    | token   | Create a project `{name, description?, client, status?, teamMembers?, …}` |
| GET    | `/api/projects/:id`| token   | Fetch one project (owner, teammate or admin)      |
| PUT    | `/api/projects/:id`| token   | Update project fields (owner or admin)            |
| DELETE | `/api/projects/:id`| token   | Delete the project (owner or admin)               |

Example — login with a cookie jar, then call a protected endpoint:

```bash
# login sets cpmp_token in the jar; nothing is exposed to JavaScript
curl -i -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clientflow.io","password":"Admin123!"}'

curl -b cookies.txt http://localhost:5000/api/projects
curl -b cookies.txt http://localhost:5000/api/auth/me

# log out — expires the cookie
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/auth/logout
```

The browser does this automatically via `credentials: "include"`; no token handling in JS.

Example — update the hero headline (admin session required):

```bash
curl -X PUT http://localhost:5000/api/intro \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"hero":{"title":"Run every client project","highlight":"from one dashboard"}}'
```

Requests without a valid token return `401`; authenticated non-admins get `403`.
If MongoDB is unreachable, the public landing content still falls back to the built-in
defaults, so the intro page never breaks (login requires the database).

### Generating a token

The browser never sees a token (httpOnly cookie). The CLI below exists only for
**server-to-server** clients (curl, Postman, CI) that cannot hold cookies:

```bash
# from the repo root
npm run token                            # admin from server/.env
npm run token -- jane@clientflow.io      # any user
npm run token -- jane@clientflow.io Member123!   # also verifies the password
npm run token -- secret                  # print a fresh JWT_SECRET to put in .env

# or from server/
npm run token -- user@example.com
```

Output is a raw token you can paste directly:

```bash
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer <paste-token-here>"
```

The token carries `{ sub, email, role }` and expires after `JWT_EXPIRES_IN` (7 days).
Rotating `JWT_SECRET` invalidates every previously issued token.

## Environment variables (`server/.env`)

| Variable         | Default                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `PORT`           | `5000`                                                            |
| `MONGO_URI`      | `mongodb://127.0.0.1:27017/client_project_management`             |
| `CLIENT_URL`     | `http://localhost:5173` (CORS origin)                             |
| `JWT_SECRET`     | required — generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d`                                                              |
| `ADMIN_EMAIL`    | `admin@clientflow.io`                                             |
| `ADMIN_PASSWORD` | `Admin123!`                                                       |
| `ADMIN_NAME`     | `Admin User`                                                      |
