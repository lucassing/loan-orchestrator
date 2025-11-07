from django.test import override_settings
from rest_framework.test import APIClient
from loans.tasks import run_pipeline_task


import pytest

testdata = [
    ["Ana", 12000, 4000, 500, "ES", "home renovation","APPROVED"],
    ["Luis", 28000, 2000, 1200, "OTHER", "home renovation","REJECTED"],
    ["Mia", 20000, 3000, 900, "FR", "home renovation","NEEDS_REVIEW"],
    ["Eva", 15000, 5000, 200, "ES", "gambling", "REJECTED"]
]


@pytest.mark.parametrize(
    "applicant_name,amount,monthly_income,declared_debts,country,loan_purpose,outcome",
    testdata,
)
@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
def test_e2e_create_application_pipeline_and_run(
    db,
    applicant_name,
    amount,
    monthly_income,
    declared_debts,
    country,
    loan_purpose,
    outcome,
):
    client = APIClient()

    # 1) Create application
    app_payload = {
        "applicant_name": applicant_name,
        "amount": amount,
        "monthly_income": monthly_income,
        "declared_debts": declared_debts,
        "country": country,
        "loan_purpose": loan_purpose,  # not risky
    }
    resp = client.post("/api/applications/", data=app_payload, format="json")
    assert resp.status_code == 201, resp.content
    application = resp.json()
    application_id = application["id"]

    # 2) Create pipeline (deterministic rules)
    pipe_payload = {
        "name": "default-pipeline",
        "is_active": True,
        "description": "Deterministic E2E pipeline",
        "steps": [
            {
                "step_type": "dti_rule",
                "order": 1,
            },
            {
                "step_type": "amount_policy",
                "order": 2,
            },
            {
                "step_type": "sentiment_check",
                "order": 3,
                "params": {
                    "mode": "llm"
                },
            },
            {
                "step_type": "risk_scoring",
                "order": 4,
            },
        ],
        "terminal_rules": [
            {
                "order": 1,
                "condition": "dti_rule.outcome == 'FAIL' or amount_policy.outcome == 'FAIL'",
                "final_status": "REJECTED",
            },
            {
                "order": 2,
                "condition": "sentiment_check.outcome == 'RISKY'",
                "final_status": "REJECTED",
            },
            {
                "order": 3,
                "condition": "risk_scoring.outcome == 'PASS'",
                "final_status": "APPROVED",
            },
        ],
    }
    resp = client.post("/api/pipelines/", data=pipe_payload, format="json")
    assert resp.status_code == 201, resp.content
    pipeline = resp.json()
    pipeline_id = pipeline["id"]

    # 3) Execute the pipeline synchronously via the Celery task
    final_status = run_pipeline_task(application_id, pipeline_id)
    assert final_status == outcome

    # 4) Verify results through the API

    # 4a) Application should be APPROVED
    resp = client.get(f"/api/applications/{application_id}/")
    assert resp.status_code == 200
    assert resp.json()["status"] == outcome

    # 4b) We should have at least one PipelineRun with step logs
    resp = client.get("/api/runs/")
    assert resp.status_code == 200, resp.content
    runs = resp.json()
    assert isinstance(runs, list) and len(runs) >= 1
    run = runs[0]
    assert run["application"] == application_id
    assert run["pipeline"] == pipeline_id
    assert run["final_status"] == outcome
    assert len(run["step_logs"]) >= 2

    # quick check that our steps are there
    step_types = {s["step_type"] for s in run["step_logs"]}
    assert "dti_rule" in step_types
    assert "amount_policy" in step_types
    assert "risk_scoring" in step_types
