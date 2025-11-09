# Loan Orchestrator

Minimal loan-application orchestrator with a configurable pipeline of steps that produces a final status: **APPROVED | REJECTED | NEEDS_REVIEW**.
Backend: **Django + DRF + Celery + Redis + Postgres**
Frontend: **React (Vite + TS + Bootstrap)**

> The UI is for configuring pipelines and running them; applications are created via API. 

---

## Table of contents

* [Architecture](#architecture)
* [Prerequisites](#prerequisites)
* [Quickstart (Docker)](#quickstart-docker)
* [Local Dev (without Docker)](#local-dev-without-docker)
* [Environment variables](#environment-variables)
* [API endpoints](#api-endpoints)
* [Example cURL / HTTPie](#example-curl--httpie)
* [Run tests](#run-tests)
* [AI use](#ai-use)
* [Troubleshooting](#troubleshooting)
* [Repo structure](#repo-structure)

---

## Architecture

**Backend (Django / DRF)**

* Create loan applications
* Define pipelines (ordered steps + params + terminal rules)
* Run pipelines (asynchronously via Celery), persist step logs, set final status
* Fetch run history (+ step logs)

**Frontend (React)**

* **Pipeline Builder**: add/remove/reorder steps, edit params, edit terminal rules
* **Run Panel**: pick `application_id` + `pipeline_id`, run, view logs & final status

**Step catalog (business rules)**

* `dti_rule`: debt-to-income check (`declared_debts / monthly_income < max_dti`, default 0.40)
* `amount_policy`: per-country caps (defaults ES=30k, FR=25k, DE=35k, OTHER=20k)
* `risk_scoring`: `risk = (dti * 100) + (amount/max_allowed * 20)`; approve if `risk ≤ threshold` (default 45)
* Bonus agent step `sentiment_check` (keyword or LLM mode)

---

## Prerequisites

* **Docker & Docker Compose** (recommended path)

---

## Quickstart (Docker)

1. **Copy env file**

```bash
cp .env.example .env
# Edit .env.local as needed; you can also keep the file name as .env
```

2. **Up all services**

```bash
docker compose --env-file .env up --build
```

Services (default ports):

* Backend (Django): [http://localhost:8000](http://localhost:8000)
* API base: [http://localhost:8000/api](http://localhost:8000/api)
* Health check: [http://localhost:8000/health/](http://localhost:8000/health/)
* Swagger UI: [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)
* Frontend (Vite dev server): [http://localhost:5173](http://localhost:5173)

> The compose file runs migrations, collects static files, starts Redis, Celery worker/beat, and the dev frontend.

---

## Environment variables

See `.env` (already provided). Important ones:

* **Django**

  * `DJANGO_DEBUG=1`
  * `DJANGO_SECRET_KEY=...`
  * `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0`
* **Database**

  * `POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT`
  * `DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`
* **Celery / Redis**

  * `CELERY_BROKER_URL=redis://redis:6379/0`
  * `CELERY_RESULT_BACKEND=redis://redis:6379/0`
* **AI (OpenRouter, optional for LLM mode)**

  * `OPENROUTER_API_KEY=<your-key>` (leave unset to run keyword-only mode)
  * `OPENROUTER_MODEL=deepseek/deepseek-r1:free` (default)

---

## API endpoints

Base URL: `http://localhost:8000/api`

* `POST /applications/` – Create loan application
* `GET /applications/{id}/` – Retrieve application
* `POST /pipelines/` – Create pipeline (with nested `steps` and `terminal_rules`)
* `GET /pipelines/` – List pipelines
* `PUT /pipelines/{id}/` – Update pipeline (replaces steps & rules)
* `DELETE /pipelines/{id}/` – Delete pipeline
* `POST /run/` – Trigger asynchronous pipeline run (`application_id`, `pipeline_id`)
* `GET /runs/` – List pipeline runs (step logs embedded)
* `GET /runs/{id}/` – Retrieve a single run

Docs: `GET /schema/swagger-ui/`

---

## Example cURL

### 1) Health check

```bash
curl -s http://localhost:8000/health/
```

### 2) Create a loan application

```bash
curl -X POST :8000/api/applications/ \
  -H 'Content-Type: application/json' \
  -d '{
    "applicant_name": "Ana",
    "amount": 12000,
    "monthly_income": 4000,
    "declared_debts": 500,
    "country": "ES",
    "loan_purpose": "home renovation"
  }'
```

### 3) Create a pipeline (default rules)

```bash
curl -X POST :8000/api/pipelines/ \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "default-pipeline",
    "is_active": true,
    "description": "Deterministic pipeline",
    "steps": [
      {"step_type": "dti_rule", "order": 1},
      {"step_type": "amount_policy", "order": 2},
      {"step_type": "sentiment_check", "order": 3, "params": {"mode": "keyword"}},
      {"step_type": "risk_scoring", "order": 4}
    ],
    "terminal_rules": [
      {"order": 1, "condition": "dti_rule.outcome == \"FAIL\" or amount_policy.outcome == \"FAIL\"", "final_status": "REJECTED"},
      {"order": 2, "condition": "sentiment_check.outcome == \"RISKY\"", "final_status": "REJECTED"},
      {"order": 3, "condition": "risk_scoring.outcome == \"PASS\"", "final_status": "APPROVED"}
    ]
  }'
```

### 4) Trigger a run

```bash
curl -X POST :8000/api/run/ \
  -H 'Content-Type: application/json' \
  -d '{"application_id": 1, "pipeline_id": 1}'
```

### 5) Inspect runs

```bash
curl :8000/api/runs/
```

---

## Run tests

### With Docker

```bash
# Run tests inside the backend container image 
docker compose run --rm django-service pytest -q
```

Tests include an end-to-end (tests/test_e2e_pipeline.py) flow that:

* creates an application,
* creates a pipeline,
* executes the pipeline (Celery eager),
* asserts the final outcome and verifies step logs.

Test data defined in [Review scenarios](#review-scenarios)
 
---

## AI use

AI assistance (code & scaffolding only)

AI was used to speed up boilerplate and wiring, not lending logic.

Scaffolding: Drafted Django/DRF/Celery/Redis setup, Docker files, and basic routing.

Frontend shell: Vite + React + TS bootstrap, minimal pages/components, axios wrapper.

Docs & DX: Seeded .env.example, lint/test configs, and a small E2E pytest.

Refactors: Suggested smaller functions and consistency cleanups.

Human-owned: data model, pipeline design, security, validations, and all final reviews.
---

## Troubleshooting

* **Ports in use**
  Change `8000`/`5173` in `docker-compose.yml` or stop conflicting processes.

* **CORS / Proxy issues**
  Vite dev server proxies `/api` to `http://localhost:8000`. If calling the API from another origin, set `DJANGO_ALLOWED_HOSTS` and adjust CORS as needed (currently permissive in `DEBUG`).

* **Celery tasks not running**
  Ensure `redis` is up and the `celery_worker` service is running (Compose handles this). For fully synchronous tests, see `pytest` (uses Celery eager override).

* **Database reset**
  Stop containers, remove the `db_data` volume, and `docker compose up --build` to re-create.

---

## Repo structure

```
.
├── config/                 # Django project (settings, urls, asgi/wsgi, celery)
├── loans/                  # App models, serializers, views, tasks, admin, migrations
├── orchestrator/           # Pipeline core, steps, agent integration
├── loan-frontend/          # React app (Vite + TS + Bootstrap)
├── tests/                  # Pytest suite (E2E flow)
├── docker-compose.yml
├── Dockerfile              # Backend image
├── requirements.txt
└── README.md
```

---

## Review scenarios

* Ana, 12000 loan, 4000 income, 500 debts, ES → **APPROVED**
* Luis, 28000 loan, 2000 income, 1200 debts, OTHER → **REJECTED**
* Mia, 20000 loan, 3000 income, 900 debts, FR → **NEEDS_REVIEW**
* Bonus: Eva, 15000 loan, 5000 income, 200 debts, ES, purpose “gambling” → **REJECTED** (via sentiment check) 

---
