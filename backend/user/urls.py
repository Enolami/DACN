from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SignUpView,
    DashboardView,
    LoginAPIView,
    SignUpAPIView,
    SignUpVerifyOTPAPIView,
    GoogleLoginAPIView,
    FacebookLoginAPIView,
    LinkOAuthAccountAPIView,
    SetUsernameAPIView,
    ForgotPasswordAPIView,
    VerifyResetOTPAPIView,
    ResetPasswordAPIView,
    ProfileView,
    ProfileAvatarView,
)

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),
    path('api/signup/', SignUpAPIView.as_view(), name='api_signup'),
    path('api/signup/verify-otp/', SignUpVerifyOTPAPIView.as_view(), name='api_signup_verify_otp'),
    path('api/google-login/', GoogleLoginAPIView.as_view(), name='api_google_login'),
    path('api/facebook-login/', FacebookLoginAPIView.as_view(), name='api_facebook_login'),
    path('api/link-oauth-account/', LinkOAuthAccountAPIView.as_view(), name='api_link_oauth_account'),
    path('api/set-username/', SetUsernameAPIView.as_view(), name='api_set_username'),
    path('api/forgot-password/', ForgotPasswordAPIView.as_view(), name='api_forgot_password'),
    path('api/verify-reset-otp/', VerifyResetOTPAPIView.as_view(), name='api_verify_reset_otp'),
    path('api/reset-password/', ResetPasswordAPIView.as_view(), name='api_reset_password'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Profile endpoints
    path('api/profile/', ProfileView.as_view(), name='api_profile'),
    path('api/profile/avatar/', ProfileAvatarView.as_view(), name='api_profile_avatar'),
]