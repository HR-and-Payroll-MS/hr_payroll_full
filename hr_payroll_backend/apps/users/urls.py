"""
URL patterns for Users app.
"""
from django.urls import path
from .views import CurrentUserView, RequestPasswordResetView, VerifyOTPView, SetNewPasswordView

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('request-reset/', RequestPasswordResetView.as_view(), name='request-reset'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('reset-password/', SetNewPasswordView.as_view(), name='reset-password'),
]
