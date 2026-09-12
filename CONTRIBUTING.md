# Contributing to Personal OS

Thank you for your interest in contributing to Personal OS! Whether it's reporting a bug, proposing a feature, or writing code, your help is greatly appreciated.

## Getting Started

1. **Fork the Repository**: Start by forking the `main` branch.
2. **Clone Locally**: Clone your fork to your local machine.
3. **Install Dependencies**:
   - Backend: Navigate to `api/`, create a virtual environment (`python -m venv api_venv`), activate it, and run `pip install -r requirements.txt`. (Note: this project uses Python 3.12+).
   - Frontend: Navigate to `web/` and run `npm install`.

## Local Development (Without Docker)

### Backend (FastAPI)
```bash
cd api
# Activate your venv
source ../api_venv/bin/activate
# Start the server (runs on port 8000)
uvicorn app.main:app --reload
```

### Frontend (Next.js)
```bash
cd web
# Start the development server (runs on port 3000)
npm run dev
```
Open `http://localhost:3000` in your browser. The frontend will proxy/connect to `http://localhost:8000` automatically.

## Using Docker Compose

If you want to spin everything up at once:
```bash
# Make a copy of the .env file
cp .env.example .env

# Build and start services (db, api, web, n8n)
docker-compose up --build
```
- Frontend: http://localhost:3000
- API Backend: http://localhost:8000
- n8n (Automation): http://localhost:5678

## Testing

Ensure your code passes tests before submitting a Pull Request:
```bash
cd api
pytest
```

## Pull Request Process

1. Provide a clear and descriptive PR title.
2. Link the PR to the relevant issue if one exists.
3. Ensure any new features include appropriate tests in `api/tests`.
4. Ensure the UI code doesn't introduce TypeScript compilation errors (`npm run build`).

## Commit Guidelines

- Use conventional commits (e.g., `feat: added tasks sorting`, `fix: calendar spacing issue`).
- Keep commits small and focused on a single change.
