from rest_framework import serializers
from .models import Track

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'title', 'artist', 'audio_file', 'uploaded_at', 'is_processed']
        read_only_fields = ['uploader', 'is_processed', 'mfcc_data']

class TrackDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'title', 'audio_file', 'mfcc_data', 'is_processed']