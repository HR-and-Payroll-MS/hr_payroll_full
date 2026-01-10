from django.urls import path
from .views import PolicyListView, PolicyDetailView

urlpatterns = [
    path('<int:org_id>/policies/', PolicyListView.as_view(), name='policy-list'),
    path('<int:org_id>/policies/<str:section>/', PolicyDetailView.as_view(), name='policy-detail'),
]
