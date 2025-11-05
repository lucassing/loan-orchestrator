from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ApplicationViewSet,
    PipelineConfigurationViewSet,
    PipelineRunHistoryViewSet,
    RunPipelineAPIView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

router = DefaultRouter()
router.register(r"applications", ApplicationViewSet)
router.register(r"pipelines", PipelineConfigurationViewSet)
router.register(r"runs", PipelineRunHistoryViewSet, basename="pipelinerun")


urlpatterns = [
    # CRUD Applications, Pipelines and Runs
    path("", include(router.urls)),

    # Custom endpoint for running the pipeline
    path("run/", RunPipelineAPIView.as_view(), name="run-pipeline"),
    
    # DOCS
    path("schema/", SpectacularAPIView.as_view(api_version="v1"), name="schema"),
    path(
        "schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
