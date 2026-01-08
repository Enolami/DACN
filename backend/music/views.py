from django.shortcuts import render, get_object_or_404
from django.http import StreamingHttpResponse, Http404
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.core.files.base import ContentFile
import os
import requests

from .models import Song
from .serializers import SongSerializer, SongDetailSerializer
from .utils import process_track_mfcc


def dashboard_view(request):
    """
    Serves the HTML dashboard.
    Authentication is handled by the browser session (cookies).
    """
    return render(request, "music/dashboard.html")


# --- API Views (Song upload + MFCC analysis) ---


class SongListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list songs or upload a new one.
    """
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        # For now we just save; duration / mfcc_vector can be filled later.
        serializer.save()


class SongAnalysisView(APIView):
    """
    Trigger MFCC calculation for a specific song.
    Note: In production, this should be offloaded to a background task (e.g., Celery).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, format=None):
        song = get_object_or_404(Song, pk=pk)

        if not song.audio_file:
            return Response({"error": "No audio file found."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate MFCC
        file_path = song.audio_file.path
        mfcc_matrix = process_track_mfcc(file_path)

        if mfcc_matrix:
            song.mfcc_vector = mfcc_matrix
            song.save()
            return Response({"status": "Analysis complete", "mfcc_length": len(mfcc_matrix)})
        else:
            return Response({"error": "Failed to process audio."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SongDetailView(generics.RetrieveDestroyAPIView):
    """
    Retrieve or delete a single song.
    """
    queryset = Song.objects.all()
    serializer_class = SongDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


# --- Jamendo Integration ---


class JamendoSearchView(APIView):
    """
    Proxy to search tracks on Jamendo.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "")
        if not query:
            return Response(
                {"error": "Query parameter 'q' is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        url = "https://api.jamendo.com/v3.0/tracks/"
        params = {
            "client_id": settings.JAMENDO_CLIENT_ID,
            "format": "json",
            "limit": 10,
            "namesearch": query,
            "include": "musicinfo",
        }

        try:
            # Proxy to keep API keys hidden from frontend
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return Response(data)
        except requests.RequestException as e:
            return Response(
                {"error": f"Jamendo API Error: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class JamendoImportView(APIView):
    """
    Import a track from Jamendo into our local DB as a Song.
    This enables us to perform MFCC analysis on Jamendo tracks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        jamendo_id = request.data.get("id")
        if not jamendo_id:
            return Response(
                {"error": "Jamendo Track ID required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Fetch track details from Jamendo
        url = "https://api.jamendo.com/v3.0/tracks/"
        params = {
            "client_id": settings.JAMENDO_CLIENT_ID,
            "format": "json",
            "id": jamendo_id,
        }

        try:
            resp = requests.get(url, params=params)
            resp.raise_for_status()
            results = resp.json().get("results", [])
            if not results:
                return Response(
                    {"error": "Track not found on Jamendo"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            track_info = results[0]
            # Direct MP3 link in the 'audio' field
            audio_url = track_info.get("audio")
            title = track_info.get("name")

            # 2. Download audio content
            audio_response = requests.get(audio_url)
            audio_response.raise_for_status()

            # 3. Save as local Song object
            song = Song(title=f"{title} (Jamendo Import)")
            filename = f"jamendo_{jamendo_id}.mp3"
            song.audio_file.save(filename, ContentFile(audio_response.content))
            # Store URL for convenience (served via Django MEDIA_URL)
            song.audio_file_url = song.audio_file.url
            song.save()

            serializer = SongSerializer(song)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Import failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# --- Streaming View ---


def stream_audio(request, pk):
    """
    Efficiently streams the audio file to the client.
    Using a generator to yield file chunks.
    """
    song = get_object_or_404(Song, pk=pk)

    if not song.audio_file:
        raise Http404("Audio file not found")

    path = song.audio_file.path

    if not os.path.exists(path):
        raise Http404("Audio file not found")

    def file_iterator(file_name, chunk_size=8192):
        with open(file_name, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    response = StreamingHttpResponse(file_iterator(path), content_type="audio/mpeg")
    response["Content-Disposition"] = f'inline; filename="{os.path.basename(path)}"'
    return response