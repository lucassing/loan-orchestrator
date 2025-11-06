import json
from decimal import Decimal
from django.test import override_settings
from rest_framework.test import APIClient

# We’ll run the celery task synchronously inside the test:
from loans.tasks import run_pipeline_task


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
def test_e2e_create_application_pipeline_and_run(db):
    client = APIClient()

    # 1) Create application
    app_payload = {
        "applicant_name": "Alice",
        "amount": "12000.00",
        "monthly_income": "4000.00",
        "declared_debts": "1000.00",
        "country": "DE",
        "loan_purpose": "home renovation",  # not risky
    }
    resp = client.post("/api/applications/", data=app_payload, format="json")
    assert resp.status_code == 201, resp.content
    application = resp.json()
    application_id = application["id"]

    # 2) Create pipeline (deterministic rules)
    #    Steps:
    #      - dti_rule (threshold 0.40)  -> with 1000/4000 = 0.25 -> PASS
    #      - sentiment_check (risky_keywords include "gambling") -> purpose is safe -> PASS
    #    Terminal rules (in order):
    #      - if sentiment_check FAIL -> REJECTED
    #      - elif dti_rule PASS -> APPROVED
    pipe_payload = {
        "name": "default-pipeline",
        "is_active": True,
        "description": "Deterministic E2E pipeline",
        "steps": [
            {
                "step_type": "dti_rule",
                "order": 1,
                "params": {"max_dti_threshold": "0.40"},
            },
            {
                "step_type": "sentiment_check",
                "order": 2,
                "params": {"risky_keywords": ["gambling", "crypto", "speculation"]},
            },
        ],
        "terminal_rules": [
            {
                "order": 1,
                "condition": "sentiment_check.outcome == 'FAIL'",
                "final_status": "REJECTED",
            },
            {
                "order": 2,
                "condition": "dti_rule.outcome == 'PASS'",
                "final_status": "APPROVED",
            },
        ],
    }
    resp = client.post("/api/pipelines/", data=pipe_payload, format="json")
    assert resp.status_code == 201, resp.content
    pipeline = resp.json()
    pipeline_id = pipeline["id"]

    # 3) Execute the pipeline synchronously via the Celery task
    #    (your /api/run/ endpoint currently returns 202 but doesn't call the task)
    final_status = run_pipeline_task(application_id, pipeline_id)
    assert final_status == "APPROVED"

    # 4) Verify results through the API

    # 4a) Application should be APPROVED
    resp = client.get(f"/api/applications/{application_id}/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "APPROVED"

    # 4b) We should have at least one PipelineRun with step logs
    #     (GET /api/runs/ lists all; serializer inlines step_logs)
    resp = client.get("/api/runs/")
    assert resp.status_code == 200, resp.content
    runs = resp.json()
    assert isinstance(runs, list) and len(runs) >= 1
    run = runs[0]
    assert run["application"] == application_id
    assert run["pipeline"] == pipeline_id
    assert run["final_status"] == "APPROVED"
    assert len(run["step_logs"]) >= 2

    # quick check that our steps are there
    step_types = {s["step_type"] for s in run["step_logs"]}
    assert "dti_rule" in step_types
    assert "sentiment_check" in step_types
