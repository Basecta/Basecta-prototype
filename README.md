# Basecta Prototype (FastAPI + Next.js)

> **This repository is archived.** It was the original prototype for Basecta, built to validate demand for biodiversity compliance tooling among Irish agri-environmental consultants.
>
> **Active development has moved to → [Basecta/Basecta-hedgerow-grading-tool](https://github.com/Basecta/Basecta-hedgerow-grading-tool)**, where the platform is being rebuilt from the ground up with refined scope informed by the prototype's findings.

## What this was

A SaaS prototype for tracking and monitoring agricultural biodiversity metrics on Irish farmland — hedgerows, waterways, and soil data — targeted at ACRES agri-environmental compliance reporting.

Built between January and [end month] 2026, the prototype attracted paying-party interest from agri-environmental consultants within four months of development. Those conversations clarified the real product requirements and prompted the rebuild in a more appropriate stack.

## Tech stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend:** FastAPI, SQLAlchemy, JWT auth
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker Compose

## Features built

- User registration and JWT-based authentication
- Dashboard with biodiversity credits, income tracking, and reliability scoring
- CSV ingestion for hedgerow, waterway, and soil data
- Computer vision pipeline (OpenCV + HSV segmentation) for hedgerow detection in aerial imagery

## Running locally

```bash
git clone https://github.com/Basecta/Basecta-prototype.git
cd Basecta-prototype
docker-compose up --build
```

Frontend at `http://localhost:3000`, API at `http://localhost:8000/docs`.

## Why the rebuild

The prototype's job was to ship fast, get in front of real consultants, and find out what they'd actually pay for. With that done, the production system is being built in Java / Spring Boot — a better fit for the long-term scope and the stack the team is standardising on.
