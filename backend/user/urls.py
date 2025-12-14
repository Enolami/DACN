from django.urls import path
from .views import SignUpView, DashboardView, LoginAPIView, SignUpAPIView, GoogleLoginAPIView, FacebookLoginAPIView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),
    path('api/signup/', SignUpAPIView.as_view(), name='api_signup'),
    path('api/google-login/', GoogleLoginAPIView.as_view(), name='api_google_login'),
    path('api/facebook-login/', FacebookLoginAPIView.as_view(), name='api_facebook_login'),
]