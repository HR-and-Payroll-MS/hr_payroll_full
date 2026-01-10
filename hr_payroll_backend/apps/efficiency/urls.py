from django.urls import path
from .views import TemplateSchemaView, TemplateSchemaSetView, EvaluationSubmitView, EfficiencyEvaluationViewSet

urlpatterns = [
    path('templates/schema/', TemplateSchemaView.as_view(), name='template-schema'),
    path('templates/schema-set/', TemplateSchemaSetView.as_view(), name='template-schema-set'),
    path('evaluations/submit/', EvaluationSubmitView.as_view(), name='evaluation-submit'),
    path('evaluations/', EfficiencyEvaluationViewSet.as_view({'get': 'list'}), name='evaluation-list'),
    path('evaluations/my_evaluations/', EfficiencyEvaluationViewSet.as_view({'get': 'my_evaluations'}), name='my-evaluations'),
]
