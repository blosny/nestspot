# NestSpot

[![CI Pipeline](https://github.com/blosny/nestspot/actions/workflows/ci.yml/badge.svg)](https://github.com/blosny/nestspot/actions/workflows/ci.yml)
[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Residential and neighborhood parking sharing platform designed for apartment complexes and gated communities. It allows residents to temporarily share their allocated private parking spaces with neighbors and guests when away at work or traveling.

---

## Key Problems and Solutions

1. **Guest Parking Permits & Security Verification:**  
   Instant digital parking passes with vehicle plates and verification codes for apartment security guards.
2. **Second-Car Support:**  
   Enables households with multiple vehicles to utilize vacant neighbor spots with mutual consent.
3. **Transparent Scheduling:**  
   Direct hourly spot availability schedules and 1-click booking, eliminating uncoordinated parking disputes.
4. **Live ETA Return Alerts:**  
   Real-time notifications and countdown buffers when the spot owner is returning home from work.

---

## Tech Stack

- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn
- **Testing & Tooling:** Pytest, Pytest-Asyncio, HTTPX, Ruff
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Clean UI with interactive 2D parking grid)
- **CI/CD:** GitHub Actions for automated linting, test suites, and Docker validation
- **Containerization:** Multi-stage Dockerfile and Docker Compose

---

## Quickstart

### Prerequisites
- Python 3.13+
- Git

### 1. Setup Environment
```bash
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
```

### 2. Run Tests and Linter
```bash
# Run pytest test suite
pytest -v

# Run code linter
ruff check .
```

### 3. Start Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open `http://localhost:8000` in your browser.  
OpenAPI / Swagger documentation is available at `http://localhost:8000/docs`.

---

## Docker Setup

```bash
docker compose up --build
```
Access the application at `http://localhost:8000`.

---

## Project Layout

```
nestspot/
├── .github/workflows/ci.yml       # Automated GitHub Actions CI workflow
├── app/
│   ├── main.py                    # FastAPI application entrypoint & routing
│   ├── config.py                  # Pydantic BaseSettings configuration
│   ├── models/                    # Pydantic schemas (Spots, Bookings, ETA)
│   ├── routers/                   # API endpoint controllers
│   ├── services/                  # Business logic & seed data
│   └── static/                    # Frontend assets (HTML, CSS, JS)
├── tests/                         # Pytest test suite
├── Dockerfile                     # Container definition
├── docker-compose.yml             # Container orchestration
├── pyproject.toml                 # Tooling configuration
├── requirements.txt               # Production dependencies
└── requirements-dev.txt           # Development dependencies
```

---

## License
Distributed under the [MIT License](LICENSE).
