from rest_framework import serializers
from .models import Song


class SongSerializer(serializers.ModelSerializer):
    """
    Basic serializer for listing/creating songs via the upload API.
    """

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "album",
            "duration",
            "audio_file",
            "audio_file_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["duration", "audio_file_url", "created_at", "updated_at"]


class SongDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer exposing the stored MFCC vector as well.
    """

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "album",
            "duration",
            "audio_file",
            "audio_file_url",
            "mfcc_vector",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["mfcc_vector", "created_at", "updated_at"]