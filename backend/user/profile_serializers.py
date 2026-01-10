from rest_framework import serializers
from .models import Profile, User


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Profile model.
    Includes user's email and username for convenience.
    """
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='name', read_only=True)  # Alias for frontend compatibility
    join_date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id',
            'name',
            'first_name',  # Alias for frontend compatibility
            'email',
            'username',
            'avatar_url',
            'bio',
            'join_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProfileUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating profile fields.
    """
    first_name = serializers.CharField(max_length=150, required=False)  # Maps to profile.name
    name = serializers.CharField(max_length=150, required=False)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def update(self, instance, validated_data):
        """
        Update Profile.name and Profile.bio.
        Returns the Profile instance.
        """
        # Update profile name (accept both 'name' and 'first_name' for compatibility)
        if 'name' in validated_data:
            instance.name = validated_data['name']
        elif 'first_name' in validated_data:
            instance.name = validated_data['first_name']

        # Update profile bio if provided
        if 'bio' in validated_data:
            instance.bio = validated_data['bio']
        
        # Save changes
        update_fields = []
        if 'name' in validated_data or 'first_name' in validated_data:
            update_fields.append('name')
        if 'bio' in validated_data:
            update_fields.append('bio')
        update_fields.append('updated_at')
        
        instance.save(update_fields=update_fields)

        # Refresh from DB to get updated timestamps
        instance.refresh_from_db()
        return instance

