from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    """Custom user manager for User model."""
    
    def create_user(self, username, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model matching the schema exactly:
    - id: auto-generated primary key
    - username: unique identifier for login
    - email: user's email address
    - password: hashed password (inherited from AbstractBaseUser)
    - is_artist: whether this user can act as an artist
    - created_at: account creation timestamp
    - updated_at: last update timestamp
    """
    
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    is_artist = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    oauth_provider = models.CharField(max_length=50, blank=True, null=True, help_text="OAuth provider(s) linked to this account (e.g., 'google', 'facebook', or 'google,facebook' for multiple)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Required for admin interface (minimal fields)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']
    
    def __str__(self) -> str:
        return self.username


class Profile(models.Model):
    """
    One-to-one extension of User for profile data.

    Schema alignment:
    - user_id: reference to User
    - avatar_url: Cloudinary (or external) image URL
    - avatar_id: public ID / reference in Cloudinary
    - bio: short text about the user
    - name: display name (moved from User.first_name since it's not in User schema)
    - created_at / updated_at: auditing timestamps
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    name = models.CharField(max_length=150, blank=True)  # Display name
    avatar_url = models.URLField(max_length=500, blank=True)
    avatar_id = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    is_private = models.BooleanField(default=False, help_text="If True, only the user can see their activity")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user.username}'s profile"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a Profile object whenever a new User is created.
    Uses get_or_create to avoid duplicates if profile was already created.
    """
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Ensure the related Profile is saved when the User is saved.
    """
    # Profile is created in the signal above, so we guard with hasattr
    if hasattr(instance, "profile"):
        instance.profile.save()


class PasswordResetOTP(models.Model):
    """
    OTP model for password reset flow.
    Similar to SignupOTP but for password reset.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_used', 'expires_at']),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"PasswordResetOTP for {self.user.email} - {self.code}"

    def is_valid(self, code: str) -> bool:
        """Check if the OTP code is valid and not expired."""
        from django.utils import timezone
        return (
            self.code == code
            and not self.is_used
            and timezone.now() < self.expires_at
        )

    @classmethod
    def create_for_user(cls, user: User) -> 'PasswordResetOTP':
        """Create a new OTP for password reset."""
        from django.utils import timezone
        from datetime import timedelta
        import random

        # Generate 6-digit code
        code = str(random.randint(100000, 999999))

        # Create OTP that expires in 10 minutes
        expires_at = timezone.now() + timedelta(minutes=10)

        return cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )


class SignupOTP(models.Model):
    """
    One-time passcode used to verify email during signup.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="signup_otps")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_for_user(cls, user: User, ttl_minutes: int = 10) -> "SignupOTP":
        """
        Create a new OTP for the user, expiring in ttl_minutes.
        """
        import random

        code = f"{random.randint(0, 999999):06d}"
        now = timezone.now()
        return cls.objects.create(
            user=user,
            code=code,
            expires_at=now + timedelta(minutes=ttl_minutes),
        )

    def is_valid(self, code: str) -> bool:
        """
        Check if the provided code matches and is not expired/used.
        """
        now = timezone.now()
        return (
            not self.is_used
            and self.code == code
            and self.expires_at >= now
        )