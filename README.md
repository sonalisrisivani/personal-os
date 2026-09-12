# Personal OS

Private, self-hostable Personal Operating System built for career and goal management. Powered by Next.js, FastAPI, PostgreSQL, and n8n.

Personal OS provides a unified dashboard to manage your professional trajectory: tracking goals, technical projects, and job applications, with AI-powered assistance for task orchestration—all while maintaining full data ownership.

## Features

- **Personal Goals & Technical Projects**: Dedicated modules for habits, life goals, and engineering projects.
- **AI Agent Suggestions**: Approval-based AI assistant for both goals (Personal Growth Coach) and projects (Technical Architect) to suggest next milestones and breakdown actionable tasks.
- **Task Calendar & Deadlines**: Interactive monthly calendar with daily agenda view, deadline dots, and status toggles.
- **Deterministic Color Coding**: Unique, consistent color assignment for every goal and project, inherited by child tasks and calendar events.
- **Job Applications Pipeline**: Application tracking with interview reminder alerts and automated email ingestion webhooks.
- **Interactive Artifacts**: Export your project or goal task lists as standalone, interactive HTML files for local offline tracking.
- **Filterable Workspace**: Context-aware task filtering by assigned goal or project.

## ☁️ 1-Click Cloud Hosting (Free)

You don't need to touch a terminal or install Docker to use Personal OS! You can deploy it to the cloud for free with one click using Render.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Clicking this button automatically provisions and connects:
1. **Free PostgreSQL Database** (Tables are created automatically on startup).
2. **FastAPI Backend**.
3. **Next.js Frontend**.

Within 3 minutes, you will have your own private, live cloud URL running your Personal OS dashboard!

## 💻 Local Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Running Locally
1. Clone the repository and navigate to the root directory.
2. Create a copy of the environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
3. Build and run the services:
   \`\`\`bash
   docker-compose up --build
   \`\`\`
   The application will be available at:
   - Frontend: `http://localhost:3000`
   - API Backend: `http://localhost:8000`
   - Automation (n8n): `http://localhost:5678`

## Contributing

We welcome contributions! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to report bugs, suggest features, or submit pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
