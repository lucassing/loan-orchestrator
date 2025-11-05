from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone


STATUS_CHOICES = (
    ('APPROVED', 'Approved'),
    ('REJECTED', 'Rejected'),
    ('NEEDS_REVIEW', 'Needs Review'),
)

class Application(models.Model):
    applicant_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_income = models.DecimalField(max_digits=10, decimal_places=2)
    declared_debts = models.DecimalField(max_digits=10, decimal_places=2)
    country = models.CharField(max_length=5)
    loan_purpose = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='NEEDS_REVIEW'
    )

    def __str__(self):
        return f"Application {self.id} for {self.applicant_name}"


class Pipeline(models.Model):
    """A definition of a sequence of steps (the workflow)."""
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class PipelineStep(models.Model):
    """An ordered step in a pipeline, linked to an executable processor class."""
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.CASCADE,
        related_name='steps'
    )
    step_type = models.CharField(
        max_length=50,
        help_text="store the class name (e.g., 'dti_rule', 'risk_scoring')",
    )
    order = models.IntegerField()
    params = models.JSONField(default=dict)

    class Meta:
        unique_together = ('pipeline', 'order',)
        ordering = ['order']
        verbose_name_plural = "Pipeline Steps"

    def __str__(self):
        return f"{self.pipeline.name} - {self.order}: {self.step_type}"


class TerminalRule(models.Model):
    """Configurable, ordered rule that maps step outcomes to a final status."""

    pipeline = models.ForeignKey(
        Pipeline, on_delete=models.CASCADE, related_name="terminal_rules"
    )
    order = models.IntegerField()

    condition = models.CharField(
        max_length=255,
        help_text="The condition is a string expression to be evaluated, (e.g., dti_rule.outcome == 'FAIL')",
    )
    final_status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    class Meta:
        unique_together = (
            "pipeline",
            "order",
        )
        ordering = ["order"]
        verbose_name_plural = "Terminal Rules"

    def __str__(self):
        return f"{self.pipeline.name} - Rule {self.order}: {self.condition} → {self.final_status}"


class PipelineRun(models.Model):
    """Records one execution of a Pipeline on an Application."""
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='pipeline_runs'
    )
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.SET_NULL,
        null=True
    )
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)

    final_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Run {self.id} for App {self.application_id}"

    class Meta:
        verbose_name_plural = "Pipeline Runs"


class StepLog(models.Model):
    """Records the outcome and details for an individual step's execution."""
    pipeline_run = models.ForeignKey(
        PipelineRun,
        on_delete=models.CASCADE,
        related_name='step_logs'
    )
    step_type = models.CharField(max_length=50)
    outcome = models.CharField(max_length=50)
    detail = models.JSONField(default=dict)
    execution_time = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.step_type}: {self.outcome}"

    class Meta:
        ordering = ['execution_time']
        verbose_name_plural = "Step Logs"
