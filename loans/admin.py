from django.contrib import admin

from .models import (
    Application,
    Pipeline,
    PipelineRun,
    PipelineStep,
    StepLog,
    TerminalRule,
)

admin.site.register(Application)
admin.site.register(Pipeline)
admin.site.register(TerminalRule)
admin.site.register(PipelineRun)
admin.site.register(PipelineStep)
admin.site.register(StepLog)
