# SkyMock Airlines - Industry Ticket Booking Tool

A full-fledged mock airline booking application designed for data simulation and pipeline testing. Features a realistic industry data model, real-time JSON streaming, and a secure admin dashboard for mock data generation.

## 🚀 Features

- **Public Booking Portal**: Realistic reservation form with industry fields (Cabin Class, Flight Numbers, etc.).
- **Admin Control Tower**:
  - **Mock Generator**: Generate 100s or 1000s of unique tickets for a specific day or week.
  - **Real-time JSON Stream**: SSE-based stream compatible with Snowflake/Datalake ingestion.
  - **API Governance**: Toggle API authentication ON/OFF globally.
  - **Auto-Docs**: Dynamic Curl and Python examples that react to auth settings.
- **Industry Data Model**: Includes PNR, PII (Email/Phone), Financials (Price/Currency), and Logistics (Terminal/Gate).

## 🛠 Tech Stack

- **Backend**: FastAPI (Python), SQLModel (ORM), Faker (Unique Data), JWT (Auth).
- **Frontend**: React (TypeScript), Vite, Lucide Icons.
- **Database**: SQLite (Automated migrations via SQLModel).

## 📋 Prerequisites

- Node.js (v18+)
- Python (v3.10+)

## ⚙️ Setup & Management

Use the provided `manage.sh` script for all operations.

### 1. Initial Setup
```bash
# Create virtual environment and install backend dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Build Frontend (Production)
```bash
./manage.sh --build
```

### 3. Run Application (LAN Visible)
Starts both services in the background.
```bash
./manage.sh --start
```
- **Frontend**: `http://<your-ip>:3021`
- **Backend API**: `http://<your-ip>:8000`
- **Default Admin**: `admin` / `admin`

### 4. Custom Ports
```bash
./manage.sh --start --front-end-port 4000 --backend-port 9000
```

### 5. Stop Application
```bash
./manage.sh --stop-server
```

## 🧪 Testing

Run the automated end-to-end test suite to validate all functionalities (Auth, SSE, DB, Mocking).
```bash
source venv/bin/activate
pytest -v tests/test_e2e.py
```

## 📡 API Usage

Visit the **Admin Dashboard -> API Documentation** section within the running app to get your unique **JWT Access Token** and copy-pasteable code examples.
