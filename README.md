# Library Management System — Backend (Django + DRF)

Backend for the Tika "Round 6 — Modern Software Development Challenge" library
management system. Stack: Django 5, Django REST Framework, JWT auth (SimpleJWT),
MySQL, Docker, GitHub Actions CI/CD.

## Tech

- Django 5 + Django REST Framework
- MySQL 8 (via PyMySQL — no native build deps needed)
- JWT auth (`djangorestframework-simplejwt`) with refresh-token blacklist on logout
- `django-filter` + DRF `SearchFilter` for search/filtering
- Dockerized, with GitHub Actions CI/CD

## Roles

There's no separate role table — a Django `User` is a **librarian** if
`is_staff=True`, otherwise a **member**. Pass `"role": "librarian"` at
register time to create a librarian account. Librarians can manage
books/members/issues; regular authenticated users have read-only access
to the catalog and dashboard.

---

## 1. Run locally (no Docker, quick start with SQLite)

```cmd
python -m venv backend\venv
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt

copy backend\.env.example backend\.env
REM edit backend\.env and comment out / remove DATABASE_URL to fall back to SQLite,
REM or point it at a local MySQL instance.

cd backend
python manage.py migrate
python manage.py createsuperuser   REM optional, for /admin/
python manage.py runserver 8000
```

API is live at `http://localhost:8000/api/`.

## 2. Run with Docker (MySQL included)

```cmd
copy backend\.env.example backend\.env
docker-compose up --build
```

This starts MySQL (`db`) and the Django app (`web`) on `http://localhost:8000`.
Migrations run automatically on container start.

## 3. Run tests

```cmd
cd backend
call venv\Scripts\activate.bat
python manage.py test
```

## Quick setup and start

```cmd
setup.cmd
start.cmd
```

---

## API Reference

Base URL: `/api/`

### Auth

| Method | Endpoint         | Auth | Description                                  |
| ------ | ---------------- | ---- | -------------------------------------------- |
| POST   | `auth/register/` | No   | `{username, email, password, role}`          |
| POST   | `auth/login/`    | No   | `{username, password}` → `{access, refresh}` |
| POST   | `auth/refresh/`  | No   | `{refresh}` → `{access}`                     |
| POST   | `auth/logout/`   | Yes  | `{refresh}` → blacklists the token           |
| GET    | `auth/me/`       | Yes  | Current user + role                          |

Send `Authorization: Bearer <access_token>` on all authenticated requests.

### Books (`books/`) — librarian write, anyone authenticated can read

| Method    | Endpoint      | Description                                                           |
| --------- | ------------- | --------------------------------------------------------------------- |
| GET       | `books/`      | List. `?search=<text>` (title/author/isbn/category), `?category=<id>` |
| POST      | `books/`      | Create (librarian only)                                               |
| GET       | `books/<id>/` | Retrieve                                                              |
| PUT/PATCH | `books/<id>/` | Update (librarian only)                                               |
| DELETE    | `books/<id>/` | Delete (librarian only)                                               |

### Categories (`categories/`) — same permission pattern as books

### Members (`members/`) — librarian write, anyone authenticated can read

| Method               | Endpoint        | Description                               |
| -------------------- | --------------- | ----------------------------------------- |
| GET                  | `members/`      | List. `?search=<text>` (name/email/phone) |
| POST                 | `members/`      | Create (librarian only)                   |
| GET/PUT/PATCH/DELETE | `members/<id>/` | Standard CRUD (write = librarian only)    |

### Book Issue & Return

| Method | Endpoint         | Auth          | Description                                                                                                                                   |
| ------ | ---------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `issues/issue/`  | Librarian     | `{book_id, member_id, due_days?}` (default 14 days). Fails with 400 if no copies available or member inactive. Decrements `available_copies`. |
| POST   | `issues/return/` | Librarian     | `{issue_id}`. Sets `return_date`, increments `available_copies`.                                                                              |
| GET    | `issues/`        | Authenticated | List issue history. `?member=<id>`, `?book=<id>`                                                                                              |

### Dashboard

| Method | Endpoint     | Description                                                                                          |
| ------ | ------------ | ---------------------------------------------------------------------------------------------------- |
| GET    | `dashboard/` | `{total_books, available_books, issued_books, total_members}` (copy counts, not just catalog titles) |

---

## Environment variables (`.env`)

| Variable               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `SECRET_KEY`           | Django secret key                                   |
| `DEBUG`                | `True`/`False`                                      |
| `ALLOWED_HOSTS`        | Comma-separated hosts                               |
| `DATABASE_URL`         | e.g. `mysql://root:rootpassword@db:3306/library_db` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins                    |

## Deployment

Push to `main` → GitHub Actions lints, runs migrations + tests against a
MySQL service container, then builds the Docker image. To auto-deploy, add
a deploy step in `.github/workflows/ci.yml` for Render/Railway/AWS/DigitalOcean
using that platform's deploy hook or CLI, with credentials stored as repo secrets.

## Project layout

- `backend/` — Django REST API, models, authentication, issue/return logic.
- `frontend/` — React app for login, dashboard, books, members, and issue views.
- `setup.ps1` — installs backend Python dependencies and frontend Node dependencies.
- `start.ps1` — launches the backend and frontend locally.

## Incident-response notes

- **CORS issues** → check `CORS_ALLOWED_ORIGINS` in `.env` matches your frontend origin exactly (scheme + host + port).
- **DB connection failure** → confirm `DATABASE_URL` and that the `db` service is healthy (`docker-compose ps`).
- **Missing dependency / build failure** → rebuild with `docker-compose build --no-cache`.
- **Port conflict** → change the `8000:8000` / `3306:3306` mapping in `docker-compose.yml`.
