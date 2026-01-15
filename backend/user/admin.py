from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, SignupOTP, PasswordResetOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model."""
    list_display = ('username', 'email', 'is_artist', 'is_email_verified', 'oauth_provider', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_artist', 'is_email_verified', 'oauth_provider', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'email')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Custom Fields', {'fields': ('is_artist', 'is_email_verified', 'oauth_provider')}),
        ('Timestamps', {'fields': ('date_joined', 'created_at', 'updated_at', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_artist'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'date_joined', 'last_login')


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Admin interface for Profile model."""
    list_display = ('user', 'name', 'created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(SignupOTP)
class SignupOTPAdmin(admin.ModelAdmin):
    """Admin interface for SignupOTP model."""
    list_display = ('user', 'code', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('user__username', 'user__email', 'code')
    readonly_fields = ('created_at',)


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    """Admin interface for PasswordResetOTP model."""
    list_display = ('user', 'code', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('user__username', 'user__email', 'code')
    readonly_fields = ('created_at',)
