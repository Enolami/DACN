from django.shortcuts import render, get_object_or_404
from django.http import StreamingHttpResponse, Http404
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Track
from .serializers import TrackSerializer, TrackDetailSerializer
from .utils import process_track_mfcc
import os
import requests
from django.conf import settings
from django.core.files.base import ContentFile

def dashboard_view(request):
    """
    Serves the HTML dashboard. 
    Authentication is handled by the browser session (cookies).
    """
    return render(request, 'music/dashboard.html')

# --- API Views ---

class TrackListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list tracks or upload a new one.
    """
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)

class TrackAnalysisView(APIView):
    """
    Trigger MFCC calculation for a specific track.
    Note: In production, this should be offloaded to a background task (e.g., Celery).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, format=None):
        track = get_object_or_404(Track, pk=pk)
        
        if not track.audio_file:
            return Response({"error": "No audio file found."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate MFCC
        file_path = track.audio_file.path
        mfcc_matrix = process_track_mfcc(file_path)
        
        if mfcc_matrix:
            track.mfcc_data = mfcc_matrix
            track.is_processed = True
            track.save()
            return Response({"status": "Analysis complete", "mfcc_shape": len(mfcc_matrix)})
        else:
            return Response({"error": "Failed to process audio."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TrackDetailView(generics.RetrieveDestroyAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


# --- Jamendo Integration ---

class JamendoSearchView(APIView):
    """
    Proxy to search tracks on Jamendo.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Query parameter 'q' is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        url = "https://api.jamendo.com/v3.0/tracks/"
        params = {
            'client_id': settings.JAMENDO_CLIENT_ID,
            'format': 'json',
            'limit': 10,
            'namesearch': query,
            'include': 'musicinfo'
        }
        
        try:
            # We proxy the request from backend to Jamendo to keep API keys hidden
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return Response(data)
        except requests.RequestException as e:
            return Response({"error": f"Jamendo API Error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

class JamendoImportView(APIView):
    """
    Import a track from Jamendo into our local DB.
    This enables us to perform MFCC analysis on Jamendo tracks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        jamendo_id = request.data.get('id')
        if not jamendo_id:
            return Response({"error": "Jamendo Track ID required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Fetch Track Details from Jamendo
        url = "https://api.jamendo.com/v3.0/tracks/"
        params = {
            'client_id': settings.JAMENDO_CLIENT_ID,
            'format': 'json',
            'id': jamendo_id
        }
        
        try:
            resp = requests.get(url, params=params)
            resp.raise_for_status()
            results = resp.json().get('results', [])
            if not results:
                return Response({"error": "Track not found on Jamendo"}, status=status.HTTP_404_NOT_FOUND)
            
            track_info = results[0]
            # Jamendo provides a direct MP3 link in the 'audio' field
            audio_url = track_info.get('audio')
            title = track_info.get('name')
            artist = track_info.get('artist_name')

            # 2. Download Audio Content
            audio_response = requests.get(audio_url)
            audio_response.raise_for_status()

            # 3. Save as local Track object
            track = Track(
                uploader=request.user,
                title=f"{title} (Jamendo Import)",
                artist=artist,
            )
            # Save the file content to our media storage
            filename = f"jamendo_{jamendo_id}.mp3"
            track.audio_file.save(filename, ContentFile(audio_response.content))
            track.save()

            # Return the new local track data
            serializer = TrackSerializer(track)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
             return Response({"error": f"Import failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- Streaming View ---

def stream_audio(request, pk):
    """
    Efficiently streams the audio file to the client.
    Using a generator to yield file chunks.
    """
    track = get_object_or_404(Track, pk=pk)
    path = track.audio_file.path

    if not os.path.exists(path):
        raise Http404("Audio file not found")

    def file_iterator(file_name, chunk_size=8192):
        with open(file_name, 'rb') as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    response = StreamingHttpResponse(file_iterator(path), content_type='audio/mpeg')
    response['Content-Disposition'] = f'inline; filename="{os.path.basename(path)}"'
    # Optional: Support seeking (Range headers) requires more complex handling or 
    # using a dedicated server (Nginx) for media files, which is recommended for Prod.
    return response