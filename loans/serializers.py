from rest_framework import serializers

from .models import (
    Application,
    Pipeline,
    PipelineRun,
    PipelineStep,
    StepLog,
    TerminalRule,
)


class PipelineStepSerializer(serializers.ModelSerializer):
    """Serializer for individual pipeline steps."""

    class Meta:
        model = PipelineStep
        fields = ["id", "step_type", "order", "params"]
        extra_kwargs = {"id": {"read_only": False, "required": False}}


class TerminalRuleSerializer(serializers.ModelSerializer):
    """Serializer for terminal rules."""

    class Meta:
        model = TerminalRule
        fields = ["id", "order", "condition", "final_status"]
        extra_kwargs = {"id": {"read_only": False, "required": False}}


class PipelineSerializer(serializers.ModelSerializer):
    """
    Serializer for the Pipeline model, allowing nested creation/updates
    of steps and terminal rules. This is the API for the 'Pipeline Builder'.
    """

    steps = PipelineStepSerializer(many=True)
    terminal_rules = TerminalRuleSerializer(many=True)

    class Meta:
        model = Pipeline
        fields = ["id", "name", "is_active", "description", "steps", "terminal_rules"]

    def create(self, validated_data):
        steps_data = validated_data.pop("steps")
        rules_data = validated_data.pop("terminal_rules")
        pipeline = Pipeline.objects.create(**validated_data)

        for step_data in steps_data:
            PipelineStep.objects.create(pipeline=pipeline, **step_data)
        for rule_data in rules_data:
            TerminalRule.objects.create(pipeline=pipeline, **rule_data)

        return pipeline

    def update(self, instance, validated_data):
        steps_data = validated_data.pop("steps", [])
        rules_data = validated_data.pop("terminal_rules", [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        instance.steps.all().delete()
        for step_data in steps_data:
            PipelineStep.objects.create(pipeline=instance, **step_data)

        instance.terminal_rules.all().delete()
        for rule_data in rules_data:
            TerminalRule.objects.create(pipeline=instance, **rule_data)

        return instance


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for creating and viewing loan applications."""

    class Meta:
        model = Application
        # 'status' not included on creation, the orchestrator sets it.
        fields = [
            "id",
            "applicant_name",
            "amount",
            "monthly_income",
            "declared_debts",
            "country",
            "loan_purpose",
            "status",
            "created_at",
        ]
        read_only_fields = ["status", "created_at"]


class StepLogSerializer(serializers.ModelSerializer):
    """Serializer for a single step's execution log."""

    class Meta:
        model = StepLog
        fields = ["step_type", "outcome", "detail", "execution_time"]


class PipelineRunSerializer(serializers.ModelSerializer):
    """Serializer for fetching the run history, including step logs."""

    step_logs = StepLogSerializer(many=True, read_only=True)

    class Meta:
        model = PipelineRun
        fields = [
            "id",
            "application",
            "pipeline",
            "start_time",
            "end_time",
            "final_status",
            "step_logs",
        ]
        read_only_fields = ["final_status", "start_time", "end_time"]


class RunPipelineRequestSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(
        help_text="The ID of the loan application to process."
    )
    pipeline_id = serializers.IntegerField(
        help_text="The ID of the pipeline configuration to execute."
    )
