import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone
from simpleeval import simple_eval

from loans.models import Application, Pipeline, PipelineRun, StepLog
from orchestrator.core import StepResult
from orchestrator.steps import STEP_PROCESSORS

logger = logging.getLogger(__name__)


def evaluate_terminal_rule(rule_condition: str, step_outcomes: dict) -> bool:
    """
    Evaluates a condition string against the collected step outcomes.

    step_outcomes structure:
    {'dti_rule': {'outcome': 'PASS', 'detail': {...}},
     'risk_scoring': {'outcome': 'SCORE', 'detail': {...}}}

    Condition example: "dti_rule.outcome == 'FAIL'"
    """
    eval_context = {}
    for step_name, result in step_outcomes.items():
        eval_context[step_name] = StepResult(result["outcome"], result["detail"])

    try:
        return simple_eval(rule_condition, names=eval_context)
    except Exception as e:
        logger.error(f"Failed to evaluate rule condition '{rule_condition}': {e}")
        return False


@shared_task
def run_pipeline_task(application_id, pipeline_id):
    """
    The main asynchronous task to execute the loan application pipeline.
    """
    try:
        with transaction.atomic():
            application = Application.objects.select_for_update().get(pk=application_id)
            pipeline = Pipeline.objects.get(pk=pipeline_id)
            steps = pipeline.steps.select_related("pipeline").order_by("order")

            run_record = PipelineRun.objects.create(
                application=application, pipeline=pipeline, final_status="NEEDS_REVIEW"
            )
            step_outcomes = {}

            for step_config in steps:
                step_type = step_config.step_type
                processor_class = STEP_PROCESSORS.get(step_type)

                if not processor_class:
                    logger.warning(f"Unknown step_type: {step_type}. Skipping.")
                    continue

                processor = processor_class(application)
                outcome, detail = processor.execute(step_config.params)

                StepLog.objects.create(
                    pipeline_run=run_record,
                    step_type=step_type,
                    outcome=outcome,
                    detail=detail,
                )

                step_outcomes[step_type] = {
                    "outcome": outcome,
                    "detail": detail,
                }

            terminal_rules = pipeline.terminal_rules.order_by("order")
            final_status = "NEEDS_REVIEW"

            for rule in terminal_rules:
                if evaluate_terminal_rule(rule.condition, step_outcomes):
                    final_status = rule.final_status
                    break

            application.status = final_status
            application.save()

            run_record.final_status = final_status
            run_record.end_time = timezone.now()
            run_record.save()

            logger.info(
                f"Application {application_id} processed with final status: {final_status}"
            )
            return final_status

    except (Application.DoesNotExist, Pipeline.DoesNotExist) as e:
        logger.error(f"Task failed: Application or Pipeline not found. Error: {e}")
        return "ERROR"
    except Exception as e:
        logger.critical(
            f"Critical error during pipeline execution for App {application_id}: {e}"
        )
        return "ERROR"
