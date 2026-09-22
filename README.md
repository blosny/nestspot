# 🚗 NestSpot

[![CI Pipeline](https://github.com/blosny/nestspot/actions/workflows/ci.yml/badge.svg)](https://github.com/blosny/nestspot/actions/workflows/ci.yml)
[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Peer-to-Peer Neighborhood & Residential Parking Sharing Platform**  
> Solves residential parking friction by allowing apartment and gated community residents to share their allocated parking spots when they are away at work or traveling.

---

## 🌟 The 4 Core Pillars

1. **🎟️ Guest Parking Passes & Security Gate Permit:**  
   Instant digital permits (Plate + Authorization code) for security guards to prevent gate disputes.
2. **🚙 Second-Car Relief:**  
   Enables households with a second vehicle to safely and legally park in neighbors' idle spots.
3. **📅 Conflict-Free Scheduling (No More WhatsApp Spam):**  
   Hourly transparent availability calendars and 1-click spot reservations instead of chaotic neighborhood chat messages.
4. **⏱️ Live ETA & Smart Return Buffer:**  
   When the spot owner leaves work early, they tap *"Headed Home (ETA: 20m)"*, instantly notifying the guest with a live countdown timer.

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Python 3.13+, [FastAPI](https://fastapi.tiangolo.com/), Pydantic v2, Uvicorn
- **Testing & Quality:** Pytest, Pytest-Asyncio, HTTPX, Ruff linter
- **Frontend:** Glassmorphism UI with 2D interactive parking grid, real-time live timers, and digital pass renderer
- **CI/CD:** GitHub Actions for automated linting, test suites, and Docker validation
- **Containerization:** Multi-stage Dockerfile and Docker Compose

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.13+
- Git

### 1. Clone & Setup Virtual Environment
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

### 2. Run Tests & Linter
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
Open **`http://localhost:8000`** in your browser.  
Interactive OpenAPI / Swagger documentation is available at **`http://localhost:8000/docs`**.

---

## 🐳 Running with Docker

```bash
docker compose up --build
```
The application will be accessible at `http://localhost:8000`.

---

## 📂 Project Structure

```
nestspot/
├── .github/workflows/ci.yml       # Automated GitHub Actions CI workflow
├── app/
│   ├── main.py                    # FastAPI application entrypoint & routing
│   ├── config.py                  # Pydantic BaseSettings configuration
│   ├── models/                    # Pydantic schemas (Spots, Bookings, ETA)
│   ├── routers/                   # API endpoint controllers
│   ├── services/                  # Business logic & time conflict resolution
│   └── static/                    # Modern responsive frontend assets
├── tests/                         # Pytest test suite
├── Dockerfile                     # Multi-stage container definition
├── docker-compose.yml             # Local container orchestration
├── pyproject.toml                 # Ruff and Pytest tooling config
├── requirements.txt               # Production Python dependencies
└── requirements-dev.txt           # Testing & development dependencies
```

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
