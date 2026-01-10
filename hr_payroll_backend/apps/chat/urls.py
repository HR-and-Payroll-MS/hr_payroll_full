"""
URLs for Chat App.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, ChatUserListView, FileUploadView

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('users/', ChatUserListView.as_view(), name='chat-users'),
    path('upload/', FileUploadView.as_view(), name='chat-upload'),
]
