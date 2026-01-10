"""
Views for User endpoints.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.conf import settings
from .serializers import CurrentUserSerializer
from .models import User, PasswordResetOTP
import random
from django.utils import timezone
from datetime import timedelta

class CurrentUserView(generics.RetrieveAPIView):
    """
    GET /api/v1/users/me/
    Returns the currently authenticated user's information.
    """
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                # Return success even if not found to prevent enumeration
                return Response({"message": "If an account exists, an OTP has been sent."}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        # Generate 4-digit OTP
        otp = f"{random.randint(1000, 9999)}"
        PasswordResetOTP.objects.create(user=user, otp=otp)
        
        # ALWAYS print OTP for Dev/Debug convenience
        print(f"DEV OTP for {email}: {otp}")

        # Send Email
        try:
            send_mail(
                'Password Reset OTP',
                f'Your OTP for password reset is: {otp}',
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email send failed: {e}")
            # For DEV/DEMO purposes: print OTP to console so user can see it without email setup
            print(f"DEV OTP for {email}: {otp}")
        
        return Response({"message": "OTP sent successfully"}, status=200)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "Invalid OTP or Email"}, status=400)
            record = PasswordResetOTP.objects.filter(user=user, otp=otp, is_used=False).latest('created_at')
            
            # Check expiry (e.g. 15 mins)
            if timezone.now() - record.created_at > timedelta(minutes=15):
                return Response({"error": "OTP Expired"}, status=400)
                
            return Response({"message": "OTP Verified"}, status=200)
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response({"error": "Invalid OTP or Email"}, status=400)

class SetNewPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        password = request.data.get('password')
        
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "Invalid Request"}, status=400)
            record = PasswordResetOTP.objects.filter(user=user, otp=otp, is_used=False).latest('created_at')
            
            if timezone.now() - record.created_at > timedelta(minutes=15):
                return Response({"error": "OTP Expired"}, status=400)
            
            user.set_password(password)
            user.save()
            
            record.is_used = True
            record.save()
            
            return Response({"message": "Password reset successfully"}, status=200)
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response({"error": "Invalid Request"}, status=400)
