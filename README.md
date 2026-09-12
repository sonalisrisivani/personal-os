# Personal OS 🚀

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql)](https://www.postgresql.org/)

**Personal OS** is an open-source, private, self-hostable operating system for managing career trajectories, personal goals, technical projects, and job applications. It features an approval-based AI Assistant (Local/Claude/OpenAI) for task breakdown and milestone planning, an interactive calendar, activity auditing, and automated workflow triggers.

---

## ⚡ 1-Click Deployment

Deploy your own private instance of Personal OS for free on **Render** and **Vercel**:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/sonalisrisivani/personal-os)

| Service | Component | Platform |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 + React 19 + TypeScript | [Vercel](https://vercel.com) |
| **Backend API** | FastAPI + SQLAlchemy 2.0 Async + Alembic | [Render](https://render.com) |
| **Database** | PostgreSQL | [Render](https://render.com) |
| **Automation** | n8n Workflow Automation | Self-hosted / Docker |

---

## ✨ Features

- 🎯 **Goals & Life Direction**: Set and track long-term aspirations, milestones, and daily habits.
- 💻 **Technical Projects Portfolio**: Manage software side projects with repository links, live demos, and tech stack tags.
- 🤖 **AI Agent (Approval-Based)**: Provider-agnostic AI assistant that generates milestone suggestions and task breakdowns. Operates out-of-the-box with an offline heuristic engine or connects to any LLM (Claude Opus 5, Sonnet 5, Haiku 4.5).
- 📅 **Interactive Task Calendar**: Monthly and daily agenda views with priority badges, deadline dots, and deterministic color coding linked to parent goals and projects.
- 💼 **Job Application Tracker**: Track interviews, salary targets, status stages, and automated reminder alerts.
- 📊 **Metrics & Audit Trail**: Real-time activity feeds and progress statistics.
- 🔒 **100% Privacy & Data Ownership**: Zero tracking, self-hostable with Docker or managed cloud free tiers.

---

## 🤖 AI Agent & LLM Configuration

Personal OS includes a provider-agnostic AI Agent module.

### How it Works:
1. **Zero-Cost Offline Mode (Default)**: If no API key is provided, the agent uses a built-in deterministic heuristic engine that analyzes your goals/projects and provides actionable milestones and tasks at 0 cost.
2. **Claude Integration**: If you configure an Anthropic API key, the agent calls Claude to provide deep, contextual, personalized breakdowns.

### Customizing the Model:
You can use **any Claude model** (Opus, Sonnet, or Haiku) by setting environment variables in your `.env` or cloud dashboard:

```bash
# Optional: Set your Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api-your-key-here

# Optional: Choose your preferred model (defaults to claude-opus-5)
ANTHROPIC_MODEL=claude-opus-5            # Maximum reasoning & depth
# ANTHROPIC_MODEL=claude-sonnet-5         # Balanced speed & intelligence
# ANTHROPIC_MODEL=claude-haiku-4-5-20251001  # Ultra-fast & lightweight
```

---

## 🏗️ Architecture

```
personal-os/
├── api/                  # FastAPI Backend
│   ├── alembic/          # Database migrations
│   ├── app/
│   │   ├── routers/      # REST API endpoints (goals, tasks, projects, applications, agent-runs)
│   │   ├── services/     # AI Agent & Business logic
│   │   ├── models.py     # SQLAlchemy ORM definitions
│   │   └── database.py   # Async database engine & session
│   └── tests/            # Pytest test suite
├── web/                  # Next.js 16 App Router Frontend
│   ├── app/              # React Server/Client Components & Pages
│   ├── components/       # Modals, Calendar, Project Cards, Badges
│   └── lib/              # Typed API client
└── docker-compose.yml    # Local multi-container development environment
```

---

## 🛠️ Quick Start (Local Development)

### Option 1: Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/sonalisrisivani/personal-os.git
cd personal-os

# Create environment configuration
cp .env.example .env

# Start all containers
docker-compose up --build
```

Access the services:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Automation (n8n)**: [http://localhost:5678](http://localhost:5678)

---

### Option 2: Running Locally (Without Docker)

#### 1. Backend (FastAPI)
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (Next.js)
```bash
cd web
npm install
npm run dev
```

---

## 🤝 Contributing

We love contributions! Whether you're fixing a bug, adding new modules (e.g. Finance, Health, Book tracking), improving documentation, or styling the UI:

1. Check our open [Issues](https://github.com/sonalisrisivani/personal-os/issues) and [Good First Issues](https://github.com/sonalisrisivani/personal-os/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
2. Join discussions in [GitHub Discussions](https://github.com/sonalisrisivani/personal-os/discussions).
3. Read our [Contributing Guide](CONTRIBUTING.md) for branch naming, PR conventions, and code standards.

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
