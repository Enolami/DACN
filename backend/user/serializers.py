from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

# This function gets whatever user model your project is using
User = get_user_model()

class SignUpSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(required=True, write_only=True)  # Will be stored in Profile.name

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name')

    def validate_email(self, value):
        """Check if email is already in use and if it's an OAuth account."""
        email = value.lower().strip()
        
        try:
            existing_user = User.objects.get(email=email)
            # Check if this is an OAuth account (has oauth_provider set)
            if existing_user.oauth_provider:
                providers = existing_user.oauth_provider.split(',')
                provider_names = [p.capitalize() for p in providers]
                provider_text = ' or '.join(provider_names) if len(providers) == 1 else ', '.join(provider_names[:-1]) + ', or ' + provider_names[-1]
                raise serializers.ValidationError(
                    f"This email is already registered with {provider_text}. "
                    f"Please login via {provider_text} or use the 'Forgot Password' option to reset your password."
                )
            else:
                # Manual account exists
                raise serializers.ValidationError("This email is already in use. Please login or use 'Forgot Password' to reset your password.")
        except User.DoesNotExist:
            # Email is available, proceed with signup
            pass
        
        return email

    def create(self, validated_data):
        # Extract first_name before creating user (it's not a User field)
        first_name = validated_data.pop('first_name', '')
        
        # Create the user as inactive (email not verified yet)
        # Use email as temporary username - user will set proper username after email verification
        user = User.objects.create_user(
            username=validated_data['email'],  # Temporary username
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False  # User will be activated after email verification
        )
        
        # Create or update profile with name (use get_or_create to avoid duplicate if signal already created it)
        from .models import Profile
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={'name': first_name}
        )
        # If profile already existed, update the name
        if not created and first_name:
            profile.name = first_name
            profile.save(update_fields=['name', 'updated_at'])
        
        return user

class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField(required=True, help_text="Enter your username or email")
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        username_or_email = data.get("username_or_email", "").strip()
        password = data.get("password")

        if not username_or_email or not password:
            raise serializers.ValidationError("Must include 'username_or_email' and 'password'.")

        # Try to find user by username or email
        user_obj = None
        try:
            # First try as email
            if '@' in username_or_email:
                user_obj = User.objects.get(email=username_or_email.lower())
            else:
                # Try as username
                user_obj = User.objects.get(username=username_or_email.lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid username/email or password.")
        except User.MultipleObjectsReturned:
            # Shouldn't happen, but handle it
            raise serializers.ValidationError("Multiple accounts found. Please contact support.")

        # Authenticate using the username (USERNAME_FIELD)
        user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username/email or password.")

        data["user"] = user
        return data
    
class GoogleLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)

class FacebookLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)


class SignupOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)