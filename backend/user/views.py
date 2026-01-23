from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, TemplateView
from .forms import CustomUserCreationForm
from .models import User, SignupOTP, PasswordResetOTP, Profile
from rest_framework import status, views, permissions, generics
from rest_framework.response import Response
from .serializers import (
    LoginSerializer,
    SignUpSerializer,
    GoogleLoginSerializer,
    FacebookLoginSerializer,
    SignupOTPVerifySerializer,
)
from .profile_serializers import ProfileSerializer, ProfileUpdateSerializer
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import requests
import base64
import cloudinary.uploader
from io import BytesIO
from typing import Tuple

# Create your views here.
class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'

class DashboardView(TemplateView):
    template_name = 'registration/dashboard.html'

def home_view(request):
    """Redirect to dashboard if logged in, otherwise to login"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    else:
        return redirect('account_login')
    
class LoginAPIView(views.APIView):
    """
    Login endpoint (username OR email + password → JWT).
    User must have verified their email during signup.
    Accepts either username or email in the 'username_or_email' field.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Check if email is verified
            if not user.is_email_verified:
                return Response(
                    {"detail": "Please verify your email before logging in. Check your inbox for the verification code."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create JWT refresh & access tokens for the user
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.pk,
                'email': user.email,
                'username': user.username
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class GoogleLoginAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            serializer = GoogleLoginSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            access_token = serializer.validated_data['access_token']
            
            # 1. Verify token with Google and get user info
            try:
                google_response = requests.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    params={'access_token': access_token},
                    timeout=10
                )
            except requests.RequestException as e:
                return Response(
                    {"error": f"Failed to verify Google token: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if not google_response.ok:
                return Response(
                    {"error": "Invalid Google token"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user_data = google_response.json()
            except ValueError:
                return Response(
                    {"error": "Invalid response from Google"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            email = user_data.get('email')
            # Get full name from Google (prefer 'name', fallback to 'given_name')
            oauth_name = user_data.get('name', '') or user_data.get('given_name', '')
            
            if not email:
                return Response(
                    {"error": "Google account has no email"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Check if user exists, otherwise create them
            try:
                user = User.objects.get(email=email)
                is_new_user = False
                
                # Check if this is a manual account (user has set a username different from email)
                # Manual accounts have username != email (they went through username setup)
                # OAuth accounts initially have username == email
                is_manual_account = user.username != user.email
                
                # Check if THIS SPECIFIC OAuth provider is already linked to this account
                # Allow linking multiple OAuth providers to the same account
                is_this_provider_linked = user.oauth_provider == 'google' or (user.oauth_provider and 'google' in user.oauth_provider.split(','))
                is_any_oauth_linked = user.oauth_provider in ['google', 'facebook'] or (user.oauth_provider and ',' in user.oauth_provider)
                
                # For manual accounts, show linking dialog if THIS SPECIFIC provider hasn't been linked yet
                if is_manual_account and not is_this_provider_linked:
                    # User exists with manual signup - offer to link accounts (first time for this provider)
                    return Response({
                        'needs_account_linking': True,
                        'email': user.email,
                        'provider': 'google',
                        'oauth_access_token': access_token,  # Store token for linking
                        'message': 'We found an existing account with this email. Would you like to link your Google account to it?'
                    }, status=status.HTTP_200_OK)
                
                # If manual account and THIS provider is already linked, log them in directly
                if is_manual_account and is_this_provider_linked:
                    # Account was already linked, just ensure it's active and proceed to login
                    if not user.is_active:
                        user.is_active = True
                        user.save(update_fields=['is_active', 'updated_at'])
                    # Continue to normal login flow (skip username check, go straight to JWT generation)
                    try:
                        refresh = RefreshToken.for_user(user)
                    except Exception as e:
                        return Response(
                            {"error": f"Failed to generate token: {str(e)}"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    return Response({
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user_id': user.pk,
                        'email': user.email,
                        'username': user.username,
                        'needs_username': False
                    })
                    
            except User.DoesNotExist:
                # Create a new user with email as temporary username
                # User will need to set a proper username
                user = User.objects.create_user(
                    username=email,  # Temporary, will be changed
                    email=email,
                    password=get_random_string(length=32),
                    is_active=True,
                    is_email_verified=True,
                    oauth_provider='google'  # Mark as OAuth account
                )
                # Create profile with name from OAuth (use get_or_create to avoid duplicate if signal already created it)
                profile, created = Profile.objects.get_or_create(
                    user=user,
                    defaults={'name': oauth_name}
                )
                # Update name if profile already existed or if name is empty
                if not created and (not profile.name or oauth_name):
                    profile.name = oauth_name
                    profile.save(update_fields=['name', 'updated_at'])
                is_new_user = True
            else:
                # User exists but is OAuth account (username == email) - just update verification
                # If user exists, ensure they're active and verified (Google already verified)
                if not user.is_email_verified:
                    user.is_email_verified = True
                    user.is_active = True
                    user.save(update_fields=["is_email_verified", "is_active"])
                # Also ensure oauth_provider is set if it's not already
                if not user.oauth_provider:
                    user.oauth_provider = 'google'
                    user.save(update_fields=['oauth_provider', 'updated_at'])
                
                # Update profile name from OAuth if it's empty or if OAuth name is different
                profile, created = Profile.objects.get_or_create(user=user)
                if oauth_name and (not profile.name or profile.name != oauth_name):
                    profile.name = oauth_name
                    profile.save(update_fields=['name', 'updated_at'])
            
            # 3. Check if user needs to set a username (username is same as email)
            needs_username = user.username == user.email
            
            if needs_username:
                # Return a flag indicating username is needed
                try:
                    temp_token = RefreshToken.for_user(user).access_token
                except Exception as e:
                    return Response(
                        {"error": f"Failed to generate token: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                return Response({
                    'needs_username': True,
                    'email': user.email,
                    'temp_token': str(temp_token),  # Temporary token for username setup
                    'message': 'Please choose a username to continue'
                }, status=status.HTTP_200_OK)
            
            # 4. Generate JWT for your app
            try:
                refresh = RefreshToken.for_user(user)
            except Exception as e:
                return Response(
                    {"error": f"Failed to generate token: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.pk,
                'email': user.email,
                'username': user.username,
                'needs_username': False
            })
        except Exception as e:
            # Log the full error for debugging
            import traceback
            error_trace = traceback.format_exc()
            # Return error details - in production, you might want to log this instead
            from django.conf import settings
            return Response(
                {"error": "An unexpected error occurred", "detail": str(e) if getattr(settings, 'DEBUG', False) else "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FacebookLoginAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = FacebookLoginSerializer(data=request.data)
        if serializer.is_valid():
            access_token = serializer.validated_data['access_token']
            
            # 1. Verify token with Facebook Graph API
            facebook_response = requests.get(
                'https://graph.facebook.com/me',
                params={
                    'access_token': access_token,
                    'fields': 'id,name,email,picture'
                }
            )
            
            if not facebook_response.ok:
                return Response(
                    {"error": "Invalid Facebook token"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_data = facebook_response.json()
            email = user_data.get('email')
            name = user_data.get('name', '')
            facebook_id = user_data.get('id')
            
            # Facebook might not return an email (e.g. phone signups)
            if not email:
                # Fallback: create a dummy email using their unique FB ID
                email = f"{facebook_id}@facebook.graph.com"

            # 2. Check if user exists or create
            try:
                user = User.objects.get(email=email)
                
                # Check if this is a manual account (user has set a username different from email)
                # Manual accounts have username != email (they went through username setup)
                # OAuth accounts initially have username == email
                is_manual_account = user.username != user.email
                
                # Check if THIS SPECIFIC OAuth provider is already linked to this account
                # Allow linking multiple OAuth providers to the same account
                is_this_provider_linked = user.oauth_provider == 'facebook' or (user.oauth_provider and 'facebook' in user.oauth_provider.split(','))
                is_any_oauth_linked = user.oauth_provider in ['google', 'facebook'] or (user.oauth_provider and ',' in user.oauth_provider)
                
                # For manual accounts, show linking dialog if THIS SPECIFIC provider hasn't been linked yet
                if is_manual_account and not is_this_provider_linked:
                    # User exists with manual signup - offer to link accounts (first time for this provider)
                    return Response({
                        'needs_account_linking': True,
                        'email': user.email,
                        'provider': 'facebook',
                        'oauth_access_token': access_token,  # Store token for linking
                        'message': 'We found an existing account with this email. Would you like to link your Facebook account to it?'
                    }, status=status.HTTP_200_OK)
                
                # If manual account and THIS provider is already linked, log them in directly
                if is_manual_account and is_this_provider_linked:
                    # Account was already linked, just ensure it's active and proceed to login
                    if not user.is_active:
                        user.is_active = True
                        user.save(update_fields=['is_active', 'updated_at'])
                    # Continue to normal login flow (skip username check, go straight to JWT generation)
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user_id': user.pk,
                        'email': user.email,
                        'username': user.username,
                        'needs_username': False
                    })
                    
            except User.DoesNotExist:
                # Facebook already verified the email, so mark as verified
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=get_random_string(length=32),
                    is_active=True,
                    is_email_verified=True,
                    oauth_provider='facebook'  # Mark as OAuth account
                )
                # Create profile with name from OAuth (use get_or_create to avoid duplicate if signal already created it)
                profile, created = Profile.objects.get_or_create(
                    user=user,
                    defaults={'name': oauth_name}
                )
                # Update name if profile already existed or if name is empty
                if not created and (not profile.name or oauth_name):
                    profile.name = oauth_name
                    profile.save(update_fields=['name', 'updated_at'])
            else:
                # User exists but is OAuth account (username == email) - just update verification
                # If user exists, ensure they're active and verified (Facebook already verified)
                if not user.is_email_verified:
                    user.is_email_verified = True
                    user.is_active = True
                    user.save(update_fields=["is_email_verified", "is_active"])
                # Also ensure oauth_provider is set if it's not already
                if not user.oauth_provider:
                    user.oauth_provider = 'facebook'
                    user.save(update_fields=['oauth_provider', 'updated_at'])
                
                # Update profile name from OAuth if it's empty or if OAuth name is different
                profile, created = Profile.objects.get_or_create(user=user)
                if oauth_name and (not profile.name or profile.name != oauth_name):
                    profile.name = oauth_name
                    profile.save(update_fields=['name', 'updated_at'])
            
            # 3. Check if user needs to set a username (username is same as email)
            needs_username = user.username == user.email
            
            if needs_username:
                # Return a flag indicating username is needed
                return Response({
                    'needs_username': True,
                    'email': user.email,
                    'temp_token': str(RefreshToken.for_user(user).access_token),  # Temporary token for username setup
                    'message': 'Please choose a username to continue'
                }, status=status.HTTP_200_OK)
            
            # 4. Generate JWT for your app
            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.pk,
                'email': user.email,
                'username': user.username,
                'needs_username': False
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LinkOAuthAccountAPIView(views.APIView):
    """
    Link an OAuth account (Google/Facebook) to an existing manual account.
    Requires the user to authenticate with their manual account password first.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        provider = request.data.get('provider', '').strip().lower()  # 'google' or 'facebook'
        oauth_access_token = request.data.get('oauth_access_token', '').strip()
        
        if not all([email, password, provider, oauth_access_token]):
            return Response(
                {'error': 'Missing required fields: email, password, provider, oauth_access_token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if provider not in ['google', 'facebook']:
            return Response(
                {'error': 'Invalid provider. Must be "google" or "facebook"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Verify the user exists and authenticate with manual account password
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Account not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify password for manual account
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid password. Please enter the password for your existing account.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # 2. Verify OAuth token is still valid
        if provider == 'google':
            oauth_response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                params={'access_token': oauth_access_token}
            )
            if not oauth_response.ok:
                return Response(
                    {'error': 'Invalid Google token. Please try logging in with Google again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            oauth_email = oauth_response.json().get('email')
        elif provider == 'facebook':
            oauth_response = requests.get(
                'https://graph.facebook.com/me',
                params={
                    'access_token': oauth_access_token,
                    'fields': 'id,name,email'
                }
            )
            if not oauth_response.ok:
                return Response(
                    {'error': 'Invalid Facebook token. Please try logging in with Facebook again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            oauth_email = oauth_response.json().get('email')
        
        # 3. Verify OAuth email matches the account email
        if oauth_email != email:
            return Response(
                {'error': 'OAuth account email does not match the account email.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 4. Link accounts - mark email as verified (OAuth already verified it)
        # Note: is_email_verified might already be True from OTP verification,
        # but we're linking OAuth, so we ensure it's True
        # Also store the OAuth provider so we know this account is linked
        # Support multiple OAuth providers by storing them as comma-separated values
        user.is_email_verified = True
        user.is_active = True
        
        # Update oauth_provider to include this provider (support multiple providers)
        if not user.oauth_provider:
            # No OAuth provider linked yet, just set this one
            user.oauth_provider = provider
        elif provider not in user.oauth_provider.split(','):
            # This provider not linked yet, add it to the list
            user.oauth_provider = f"{user.oauth_provider},{provider}"
        
        user.save(update_fields=['is_email_verified', 'is_active', 'oauth_provider', 'updated_at'])
        
        # Store a flag in the user's profile or use a different method to track OAuth linking
        # For now, we'll use a simple approach: after linking, if user tries OAuth again,
        # we check if the account was already linked by verifying the OAuth token matches
        # But actually, the simplest is to just always show the dialog for manual accounts
        # and let the linking endpoint handle duplicate linking attempts gracefully
        
        # 5. Generate JWT tokens for the linked account
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user.pk,
            'email': user.email,
            'username': user.username,
            'message': f'Your {provider.capitalize()} account has been successfully linked!'
        }, status=status.HTTP_200_OK)


class SetUsernameAPIView(views.APIView):
    """
    POST: Set username for OAuth users who logged in without a username.
    Requires temporary token from OAuth login response.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        username = request.data.get('username', '').strip().lower()
        
        if not username:
            return Response(
                {"error": "Username is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate username format
        if len(username) < 3 or len(username) > 150:
            return Response(
                {"error": "Username must be between 3 and 150 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not (username.replace('_', '').replace('-', '').isalnum()):
            return Response(
                {"error": "Username can only contain letters, numbers, underscores, and hyphens"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if username is already taken
        if User.objects.filter(username=username).exclude(pk=request.user.pk).exists():
            return Response(
                {"error": "This username is already taken. Please choose another one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user's current username is their email (meaning they need to set one)
        if request.user.username != request.user.email:
            return Response(
                {"error": "You already have a username set"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update username
        request.user.username = username
        request.user.save(update_fields=['username', 'updated_at'])
        
        # Generate new JWT tokens with updated username
        refresh = RefreshToken.for_user(request.user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': request.user.pk,
            'email': request.user.email,
            'username': request.user.username,
            'message': 'Username set successfully'
        }, status=status.HTTP_200_OK)
    
    
class SignUpAPIView(views.APIView):
    """
    Step 1 of signup: create user account and send OTP via email.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            serializer = SignUpSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.save()
            
            # Create OTP and send via email
            try:
                otp = SignupOTP.create_for_user(user)
            except Exception as e:
                # If OTP creation fails, delete the user and return error
                user.delete()
                return Response(
                    {"error": f"Failed to create verification code: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Send email with OTP
            try:
                subject = "Verify your email address"
                message = f"Welcome! Your email verification code is: {otp.code}\n\nIt will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email."
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
            except Exception as e:
                # If email sending fails, log but don't fail the signup
                # User can request a new OTP later
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send signup email to {user.email}: {str(e)}")
                # Still return success, but note email might not have been sent
                return Response({
                    "message": "Account created, but email verification code could not be sent. Please contact support.",
                    "user_id": user.pk,
                    "email": user.email,
                    "warning": "Email delivery failed"
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                "message": "Account created. Please check your email for the verification code.",
                "user_id": user.pk,
                "email": user.email
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Log the full error for debugging
            import traceback
            error_trace = traceback.format_exc()
            # Return error details - in production, you might want to log this instead
            from django.conf import settings
            return Response(
                {"error": "An unexpected error occurred during signup", "detail": str(e) if getattr(settings, 'DEBUG', False) else "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SignUpVerifyOTPAPIView(views.APIView):
    """
    Step 2 of signup: verify OTP code → activate account and return JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = SignupOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find the latest unused OTP for this user
        otp = (
            SignupOTP.objects.filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )
        
        if not otp or not otp.is_valid(code):
            return Response(
                {"detail": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark OTP as used
        otp.is_used = True
        otp.save(update_fields=["is_used"])

        # Activate the user account and mark email as verified
        user.is_active = True
        user.is_email_verified = True
        user.save(update_fields=["is_active", "is_email_verified", "updated_at"])

        # Check if user needs to set a username (username is same as email)
        needs_username = user.username == user.email

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        if needs_username:
            # Return temp token and flag indicating username is needed
            return Response(
                {
                    "needs_username": True,
                    "email": user.email,
                    "temp_token": str(refresh.access_token),  # Temporary token for username setup
                    "message": "Email verified. Please choose a username to continue.",
                },
                status=status.HTTP_200_OK,
            )
        else:
            # User already has a username set (shouldn't happen in normal flow, but handle it)
            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user_id": user.pk,
                    "email": user.email,
                    "username": user.username,
                    "needs_username": False,
                    "message": "Email verified successfully. You are now logged in.",
                },
                status=status.HTTP_200_OK,
            )


# --- Password Reset Flow ---

class ForgotPasswordAPIView(views.APIView):
    """
    Step 1 of password reset: send OTP code to user's email.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response(
                {'message': 'If an account exists with this email, a password reset code has been sent.'},
                status=status.HTTP_200_OK
            )
        
        # Check if this is a pure OAuth account
        # Pure OAuth accounts have username == email (they never set a custom username)
        # Manual accounts that linked OAuth have username != email (they set a username during signup)
        # Pure OAuth accounts should not be able to reset password since they don't have a real password
        is_pure_oauth = user.oauth_provider and user.username == user.email
        
        if is_pure_oauth:
            # Pure OAuth account - cannot reset password
            providers = user.oauth_provider.split(',')
            provider_names = [p.capitalize() for p in providers]
            provider_text = ' or '.join(provider_names) if len(providers) == 1 else ', '.join(provider_names[:-1]) + ', or ' + provider_names[-1]
            return Response(
                {
                    'error': f'This email is registered with {provider_text}. Please login via {provider_text} or contact support.',
                    'oauth_provider': user.oauth_provider
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create OTP and send via email
        otp = PasswordResetOTP.create_for_user(user)
        
        subject = "Password Reset Code"
        message = f"Your password reset code is: {otp.code}\n\nIt will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email."
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        
        return Response(
            {'message': 'If an account exists with this email, a password reset code has been sent.'},
            status=status.HTTP_200_OK
        )


class VerifyResetOTPAPIView(views.APIView):
    """
    Step 2 of password reset: verify OTP code.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        
        if not email or not code:
            return Response(
                {'error': 'Email and code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the latest unused OTP for this user
        otp = (
            PasswordResetOTP.objects.filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )
        
        if not otp or not otp.is_valid(code):
            return Response(
                {'error': 'Invalid or expired verification code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark OTP as used
        otp.is_used = True
        otp.save(update_fields=['is_used'])
        
        # Generate a temporary token for password reset (valid for 15 minutes)
        from datetime import timedelta
        reset_token = RefreshToken.for_user(user)
        reset_token.set_exp(lifetime=timedelta(minutes=15))
        
        return Response(
            {
                'message': 'Code verified successfully. You can now reset your password.',
                'reset_token': str(reset_token.access_token),
                'email': user.email
            },
            status=status.HTTP_200_OK
        )


class ResetPasswordAPIView(views.APIView):
    """
    Step 3 of password reset: update password with new one.
    Requires the reset token from VerifyResetOTPAPIView.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()
        
        if not new_password or not confirm_password:
            return Response(
                {'error': 'New password and confirm password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user's password
        user = request.user
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        
        # Generate new JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                'message': 'Password reset successfully. You are now logged in.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.pk,
                'email': user.email,
                'username': user.username
            },
            status=status.HTTP_200_OK
        )


# --- Profile Management ---


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET: Retrieve current user's profile
    PUT/PATCH: Update profile (first_name, bio)
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Get or create profile for the current user
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return ProfileSerializer

    def update(self, request, *args, **kwargs):
        # Use ProfileUpdateSerializer for update
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = ProfileUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        # Return the updated profile using ProfileSerializer
        response_serializer = ProfileSerializer(updated_instance)
        return Response(response_serializer.data)


class ChangePasswordView(views.APIView):
    """
    Change user password.
    Requires old_password if user has a password set.
    If user logged in via OAuth and hasn't linked with manual account, sends OTP.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password', '').strip()
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()
        
        user = request.user
        
        # Check if user has OAuth and no password set (pure OAuth account)
        # Pure OAuth accounts have username == email (they never set a custom username)
        is_pure_oauth = user.oauth_provider and user.username == user.email
        
        # Check if user has a password set
        # Django's check_password will return False for unusable passwords
        has_password = user.has_usable_password()
        
        if not new_password or not confirm_password:
            return Response(
                {'error': 'New password and confirm password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If user has a password, require old_password
        if has_password:
            if not old_password:
                return Response(
                    {'error': 'Old password is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify old password
            if not user.check_password(old_password):
                return Response(
                    {'error': 'Invalid old password'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # If pure OAuth account (no password), send OTP instead
        elif is_pure_oauth:
            # Send OTP for password setup
            from .models import PasswordResetOTP
            otp = PasswordResetOTP.create_for_user(user)
            
            # Send email with OTP
            from django.core.mail import send_mail
            from django.conf import settings
            send_mail(
                subject="Password Setup Code",
                message=f"Your password setup code is: {otp.code}\n\nIt will expire in 10 minutes.\n\nIf you didn't request to set a password, please ignore this email.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response(
                {
                    'message': 'OTP code has been sent to your email. Please verify the code to set your password.',
                    'requires_otp': True,
                    'email': user.email
                },
                status=status.HTTP_200_OK
            )
        
        # Update password
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        
        # Generate new JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                'message': 'Password changed successfully',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_200_OK
        )


class VerifyPasswordOTPView(views.APIView):
    """
    Verify OTP for password change (for OAuth users setting password for the first time).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()
        
        if not code or not new_password or not confirm_password:
            return Response(
                {'error': 'Code, new password, and confirm password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Find the latest unused OTP for this user
        from .models import PasswordResetOTP
        otp = (
            PasswordResetOTP.objects.filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )
        
        if not otp or not otp.is_valid(code):
            return Response(
                {'error': 'Invalid or expired verification code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark OTP as used
        otp.is_used = True
        otp.save(update_fields=['is_used'])
        
        # Update password
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        
        # Generate new JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                'message': 'Password set successfully',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_200_OK
        )


class ProfileAvatarView(views.APIView):
    """
    POST: Upload avatar image to Cloudinary.
    Accepts base64 encoded image (data URL) as JSON or multipart form data.
    Uploads to Cloudinary and stores the returned URL in the database.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def _extract_image_from_data_url(self, data_url: str) -> Tuple[BytesIO, str]:
        """
        Extract image bytes and format from a data URL.
        Returns (BytesIO object, file_extension).
        """
        # Parse data URL: data:image/png;base64,iVBORw0KGgo...
        header, encoded = data_url.split(',', 1)
        
        # Extract content type
        if 'image/png' in header:
            ext = 'png'
        elif 'image/jpeg' in header or 'image/jpg' in header:
            ext = 'jpg'
        elif 'image/gif' in header:
            ext = 'gif'
        elif 'image/webp' in header:
            ext = 'webp'
        else:
            ext = 'jpg'  # default
        
        # Decode base64
        image_bytes = base64.b64decode(encoded)
        return BytesIO(image_bytes), ext

    def _delete_from_cloudinary(self, public_id: str) -> bool:
        """
        Delete an image from Cloudinary by public_id.
        Returns True if successful, False otherwise.
        """
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type='image')
            return result.get('result') == 'ok'
        except Exception as e:
            print(f"Error deleting avatar from Cloudinary: {e}")
            return False

    def _upload_to_cloudinary(self, image_file: BytesIO, public_id: str, format: str) -> dict:
        """
        Upload image to Cloudinary.
        Returns the upload result dictionary.
        """
        image_file.seek(0)
        
        # Upload to Cloudinary with transformations for avatar optimization
        upload_result = cloudinary.uploader.upload(
            image_file,
            public_id=public_id,
            folder='avatars',  # Organize avatars in a folder
            overwrite=True,  # Overwrite if same public_id exists
            resource_type='image',
            format=format,
            transformation=[
                {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                {'quality': 'auto', 'fetch_format': 'auto'},
            ],
        )
        
        return upload_result

    def post(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)

        # Handle base64 image (from frontend ImagePickerDialog)
        image_data = request.data.get('image')
        
        if not image_data:
            return Response(
                {"error": "No image provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            image_file = None
            file_format = 'jpg'
            # Use consistent public_id for each user (will overwrite previous uploads)
            public_id = f'avatars/user_{request.user.id}'
            
            # Store old avatar_id before uploading new one
            old_avatar_id = profile.avatar_id

            # Handle data URL (base64)
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                image_file, file_format = self._extract_image_from_data_url(image_data)
            
            # Handle file upload (multipart)
            elif hasattr(image_data, 'read'):
                image_file = BytesIO(image_data.read())
                # Determine format from content type or filename
                content_type = getattr(image_data, 'content_type', '')
                if 'png' in content_type:
                    file_format = 'png'
                elif 'gif' in content_type:
                    file_format = 'gif'
                elif 'webp' in content_type:
                    file_format = 'webp'
                else:
                    file_format = 'jpg'

            if not image_file:
                return Response(
                    {"error": "Invalid image format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete old avatar from Cloudinary if it exists and is different from new public_id
            if old_avatar_id and old_avatar_id != public_id:
                self._delete_from_cloudinary(old_avatar_id)
                print(f"Deleted old avatar from Cloudinary: {old_avatar_id}")

            # Upload new avatar to Cloudinary
            upload_result = self._upload_to_cloudinary(image_file, public_id, file_format)
            
            # Store Cloudinary URL and public ID in database
            profile.avatar_url = upload_result['secure_url']
            profile.avatar_id = upload_result['public_id']
            profile.save(update_fields=['avatar_url', 'avatar_id', 'updated_at'])

            return Response(
                ProfileSerializer(profile).data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # Log the error for debugging
            import traceback
            print(f"Error uploading avatar to Cloudinary: {e}")
            print(traceback.format_exc())
            
            return Response(
                {"error": f"Failed to upload image: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        """
        DELETE: Remove avatar and set to default.
        Deletes the avatar from Cloudinary and clears avatar_url/avatar_id in database.
        """
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        try:
            # Delete from Cloudinary if avatar_id exists
            if profile.avatar_id:
                deleted = self._delete_from_cloudinary(profile.avatar_id)
                if deleted:
                    print(f"Deleted avatar from Cloudinary: {profile.avatar_id}")
            
            # Clear avatar fields in database (will use default avatar based on username)
            profile.avatar_url = ''
            profile.avatar_id = ''
            profile.save(update_fields=['avatar_url', 'avatar_id', 'updated_at'])
            
            # Return profile with empty avatar (frontend will use default)
            return Response(
                ProfileSerializer(profile).data,
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            import traceback
            print(f"Error removing avatar: {e}")
            print(traceback.format_exc())
            
            return Response(
                {"error": f"Failed to remove avatar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
