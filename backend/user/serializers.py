from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

# This function gets whatever user model your project is using
User = get_user_model()

class SignUpSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This email is already in use.")]
    )
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(required=True) # We will map "Full Name" to this

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name')

    def create(self, validated_data):
        # Create the user using the secure create_user method which hashes the password
        user = User.objects.create_user(
            username=validated_data['email'], # We use email as the username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # 1. Find the user by email using the Custom User Model
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password.")
            
            # 2. Authenticate using the username (which might be the email)
            # authenticate() requires the field configured as USERNAME_FIELD
            user = authenticate(username=user_obj.get_username(), password=password)
            
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        data['user'] = user
        return data
    
class GoogleLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)

class FacebookLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)