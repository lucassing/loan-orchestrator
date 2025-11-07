from rest_framework import viewsets, mixins, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from loans.tasks import run_pipeline_task

from .models import Application, Pipeline, PipelineRun
from .serializers import (
    ApplicationSerializer, PipelineSerializer, PipelineRunSerializer, RunPipelineRequestSerializer
)


class ApplicationViewSet(viewsets.ModelViewSet):
    """API for creating and managing loan applications (Requirement 1)."""
    queryset = Application.objects.all().order_by('-created_at')
    serializer_class = ApplicationSerializer

class PipelineConfigurationViewSet(viewsets.ModelViewSet):
    """API for defining and managing pipelines (steps/rules) (Requirement 2)."""
    queryset = Pipeline.objects.all()
    serializer_class = PipelineSerializer

class PipelineRunHistoryViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """API for fetching pipeline run history (Requirement 4)."""
    queryset = PipelineRun.objects.all().order_by('-start_time')
    serializer_class = PipelineRunSerializer
    filter_fields = ('application',) 

class RunPipelineAPIView(APIView):
    """API to trigger the asynchronous pipeline execution (Requirement 3)."""
    serializer_class = RunPipelineRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)


        application_id = serializer.validated_data["application_id"]
        pipeline_id = serializer.validated_data["pipeline_id"]

        if not all([application_id, pipeline_id]):
            return Response(
                {"detail": "Both application_id and pipeline_id are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            get_object_or_404(Application, pk=application_id)
            get_object_or_404(Pipeline, pk=pipeline_id)
        except:
            return Response(
                {"detail": "Application or Pipeline not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        task = run_pipeline_task.delay(application_id, pipeline_id) 

        return Response({
            "message": "Pipeline execution successfully initiated.",
            "application_id": application_id,
            "pipeline_id": pipeline_id,
            "task_id": task.id,
            "poll_status_url": f"/api/runs/by_task_id/{task.id}"
        }, status=status.HTTP_202_ACCEPTED)
