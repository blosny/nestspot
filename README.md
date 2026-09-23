# NestSpot

[![CI Pipeline](https://github.com/blosny/nestspot/actions/workflows/ci.yml/badge.svg)](https://github.com/blosny/nestspot/actions/workflows/ci.yml)
[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker Ready](https://img.shields.io/badge/docker-ready-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A residential and neighborhood parking spot sharing platform designed for apartment complexes and gated communities. It enables residents to temporarily share their allocated parking spots with neighbors and visitors when away at work or traveling.

---

## Core Pillars & Features

1. **Guest Parking Permits & Security Verification:**  
   Instant digital permits with vehicle plates and verification codes (`NST-XXXX`) for apartment security guards.
2. **Second-Car Relief:**  
   Enables households with multiple vehicles to safely park in idle neighbor spots with mutual consent.
3. **Transparent 2D Parking Deck Layout:**  
   Direct visual status maps (Block A & Block B) and hourly availability schedules.
4. **Live ETA Return Alerts & Smart Buffer:**  
   When a returning spot owner departs from work, they broadcast their ETA, displaying a live countdown timer and suggesting alternative free spots for the current occupant.
5. **Dual Language Support (TR / EN):**  
   Built-in internationalization with 1-click language switching and persistent preferences.

---

## Tech Stack

- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Clean, minimal, responsive layout)
- **Testing & Tooling:** Pytest, Pytest-Asyncio, HTTPX, Ruff linter
- **CI/CD:** GitHub Actions for automated linting, test suites, and Docker build validation
- **Containerization:** Multi-stage Dockerfile and Docker Compose

---

## REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spots` | List all parking spots (filterable by block, status, EV) |
| `GET` | `/api/spots/summary/stats` | Complex-wide parking statistics |
| `GET` | `/api/spots/{spot_id}` | Detailed spot information and away schedule |
| `POST` | `/api/bookings` | Reserve a spot for a second car or visitor |
| `GET` | `/api/bookings` | List active reservations |
| `POST` | `/api/bookings/{id}/complete` | Release a reserved spot |
| `GET` | `/api/security/verify?plate=...` | Guard lookup for active permits by vehicle plate |
| `POST` | `/api/eta/broadcast` | Broadcast resident departure with ETA minutes |
| `GET` | `/api/eta/active` | Retrieve active arrival alerts and countdown buffers |
| `POST` | `/api/eta/{id}/resolve` | Dismiss or resolve an ETA arrival alert |

Interactive Swagger UI documentation is available at `/docs`.

---

## Quickstart Guide

### 1. Local Python Environment
```bash
# Clone the repository
git clone https://github.com/blosny/nestspot.git
cd nestspot

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements-dev.txt

# Run tests and linter
pytest -v
ruff check .

# Start development server
uvicorn app.main:app --reload --port 8000
```
Open `http://localhost:8000` in your browser.

---

### 2. Docker & Docker Compose
```bash
# Build and start container in one command
docker compose up --build

# Run in background (detached)
docker compose up -d

# Stop container
docker compose down
```
Access the application at `http://localhost:8000`.

---

## Project Structure

```
nestspot/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI (Ruff, Pytest, Docker Build)
├── app/
│   ├── main.py                    # FastAPI application entrypoint
│   ├── config.py                  # Pydantic BaseSettings
│   ├── models/                    # Pydantic schemas (Spot, Booking, ETA)
│   ├── routers/                   # API endpoint controllers
│   ├── services/                  # Business logic & time management
│   └── static/                    # Responsive web UI assets (HTML, CSS, JS)
├── tests/                         # Pytest test suite (15 automated tests)
├── Dockerfile                     # Multi-stage container definition
├── docker-compose.yml             # Local orchestration
├── pyproject.toml                 # Ruff and Pytest tooling config
├── requirements.txt               # Production dependencies
└── requirements-dev.txt           # Testing & dev dependencies
```

---

## License
Distributed under the [MIT License](LICENSE).
