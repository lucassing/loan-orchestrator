from .models import PipelineRun, PipelineStep, Pipeline, StepLog, TerminalRule, Application
from django.contrib import admin


admin.site.register(Application)
admin.site.register(Pipeline)
admin.site.register(TerminalRule)
admin.site.register(PipelineRun)
admin.site.register(PipelineStep)
admin.site.register(StepLog)

