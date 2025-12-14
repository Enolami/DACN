from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, TemplateView
from .forms import CustomUserCreationForm
from .models import User
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .serializers import LoginSerializer, SignUpSerializer, GoogleLoginSerializer, FacebookLoginSerializer
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
import requests

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
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Get or create an auth token for the user
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class GoogleLoginAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if serializer.is_valid():
            access_token = serializer.validated_data['access_token']
            
            # 1. Verify token with Google and get user info
            google_response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                params={'access_token': access_token}
            )
            
            if not google_response.ok:
                return Response(
                    {"error": "Invalid Google token"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_data = google_response.json()
            email = user_data.get('email')
            first_name = user_data.get('given_name', '')
            
            if not email:
                return Response(
                    {"error": "Google account has no email"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Check if user exists, otherwise create them
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create a new user with a random unusable password
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=get_random_string(length=32),
                    first_name=first_name
                )
            
            # 3. Generate Token for your app
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=get_random_string(length=32),
                    first_name=name
                )
            
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email
            })
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class SignUpAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Optional: You can create a token here if you want them to be auto-logged in
            return Response({
                "message": "User created successfully",
                "user_id": user.pk,
                "email": user.email
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
