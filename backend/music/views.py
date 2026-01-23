from django.shortcuts import render, get_object_or_404
from django.http import StreamingHttpResponse, Http404, HttpResponse
from django.db import models
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.core.files.base import ContentFile
import os
import requests
import re

from .models import Song, Artist, Album, LikedSong, Follower, Playlist, PlaylistSong
from .serializers import (
    SongSerializer, SongDetailSerializer, LikedSongSerializer, FollowerSerializer,
    PlaylistSerializer, PlaylistDetailSerializer, PlaylistSongSerializer
)
from .utils import process_track_mfcc, upload_album_cover, get_or_create_jamendo_artist, calculate_similarity, extract_duration
from datetime import datetime


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
    Automatically triggers MFCC analysis after upload.
    """
    queryset = Song.objects.select_related('album', 'album__artist').all()
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        # Save the song first
        song = serializer.save()
        
        # Automatically trigger MFCC analysis if audio file is present
        # Note: Signal handler will also process, but we do it here for immediate feedback
        if song.audio_file:
            try:
                file_path = song.audio_file.path
                result = process_track_mfcc(file_path, return_duration=True)
                if result:
                    mfcc_vector, duration = result
                    # Use update() to avoid triggering signal again
                    Song.objects.filter(id=song.id).update(
                        mfcc_vector=mfcc_vector,
                        duration=duration
                    )
                    # Refresh instance to get updated values
                    song.refresh_from_db()
            except Exception as e:
                # Log error but don't fail the upload
                # Signal handler will try as fallback
                print(f"Warning: MFCC analysis failed for song {song.id}: {e}")
                import traceback
                traceback.print_exc()
                
                # At least try to extract duration as fallback
                try:
                    duration = extract_duration(song.audio_file.path)
                    if duration:
                        Song.objects.filter(id=song.id).update(duration=duration)
                        song.refresh_from_db()
                except Exception:
                    pass  # Duration extraction also failed, signal will try later


class SongAnalysisView(APIView):
    """
    Trigger MFCC calculation for a specific song.
    Note: In production, this should be offloaded to a background task (e.g., Celery).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, format=None):
        song = get_object_or_404(Song, pk=pk)

        # Check if we have an audio file (local or URL)
        if song.audio_file:
            file_path = song.audio_file.path
        elif song.audio_file_url:
            # For Jamendo imports, we might have URL but no local file
            # In that case, we'd need to download it first, but for now we'll require local file
            return Response(
                {"error": "Local audio file required for analysis. Please ensure the file is downloaded."},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            return Response({"error": "No audio file found."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate MFCC and extract duration
        result = process_track_mfcc(file_path, return_duration=True)

        if result:
            mfcc_vector, duration = result
            song.mfcc_vector = mfcc_vector
            song.duration = duration
            song.save()
            return Response({
                "status": "Analysis complete",
                "mfcc_vector_length": len(mfcc_vector),
                "duration_seconds": duration
            })
        else:
            return Response({"error": "Failed to process audio."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SongDetailView(generics.RetrieveDestroyAPIView):
    """
    Retrieve or delete a single song.
    """
    queryset = Song.objects.select_related('album', 'album__artist').all()
    serializer_class = SongDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class RecommendationView(APIView):
    """
    Get music recommendations based on MFCC similarity.
    Returns top N songs similar to the given song using cosine similarity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, format=None):
        song = get_object_or_404(Song.objects.select_related('album', 'album__artist'), pk=pk)
        
        # Check if song has MFCC vector
        if not song.mfcc_vector:
            return Response(
                {"error": "Song has not been analyzed yet. Please analyze the song first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get top_n from query params (default: 5)
        top_n = int(request.query_params.get("top_n", 5))
        min_similarity = float(request.query_params.get("min_similarity", 0.0))
        
        # Calculate similarities
        similar_songs = calculate_similarity(song.id, top_n=top_n, min_similarity=min_similarity)
        
        if not similar_songs:
            return Response({
                "song_id": str(song.id),
                "song_title": song.title,
                "recommendations": [],
                "message": "No similar songs found. Make sure other songs have been analyzed."
            })
        
        # Format response with full song data using serializer
        recommendations = []
        for similar_song, similarity_score in similar_songs:
            # Use serializer to get full nested data
            song_data = SongSerializer(similar_song).data
            recommendations.append({
                **song_data,  # Include all song fields (album, artist, etc.)
                "song_id": str(similar_song.id),  # Keep for compatibility
                "similarity_score": round(float(similarity_score), 4),  # Round to 4 decimal places
            })
        
        return Response({
            "song_id": str(song.id),
            "song_title": song.title,
            "recommendations": recommendations,
            "count": len(recommendations)
        })


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
    Import a track from Jamendo into our local DB with full hierarchy:
    Artist → Album → Song
    
    This creates Artist and Album records, uploads cover art to Cloudinary,
    downloads the audio file, and automatically triggers MFCC analysis.
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
            
            # Extract track information
            title = track_info.get("name", "Unknown Track")
            audio_url = track_info.get("audio")
            artist_name = track_info.get("artist_name") or track_info.get("artist_nameformat", "Unknown Artist")
            album_name = track_info.get("album_name") or title  # Use track name as album if no album
            cover_url = track_info.get("image")  # Album cover URL
            duration = track_info.get("duration", 0)  # Duration in seconds from Jamendo
            jamendo_artist_id = track_info.get("artist_id")
            release_date_str = track_info.get("releasedate")  # Format: "YYYY-MM-DD"
            
            if not audio_url:
                return Response(
                    {"error": "No audio URL found in Jamendo track"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 2. Fetch artist image from Jamendo if artist_id is available
            artist_image_url = None
            if jamendo_artist_id:
                try:
                    # Fetch artist details to get image URL
                    artist_url = "https://api.jamendo.com/v3.0/artists/"
                    artist_params = {
                        "client_id": settings.JAMENDO_CLIENT_ID,
                        "format": "json",
                        "id": jamendo_artist_id,
                    }
                    artist_resp = requests.get(artist_url, params=artist_params, timeout=10)
                    if artist_resp.status_code == 200:
                        artist_results = artist_resp.json().get("results", [])
                        if artist_results:
                            # Jamendo API returns artist image in various fields, try common ones
                            artist_image_url = (
                                artist_results[0].get("image") or 
                                artist_results[0].get("artistimage") or
                                artist_results[0].get("image_url") or
                                None
                            )
                except Exception as e:
                    # If artist fetch fails, continue without image
                    print(f"Warning: Could not fetch artist image for {jamendo_artist_id}: {e}")

            # 3. Create or get Artist (no longer requires User)
            artist = get_or_create_jamendo_artist(artist_name, jamendo_artist_id, artist_image_url)

            # 4. Create or get Album
            # Parse release date if available
            release_date = None
            if release_date_str:
                try:
                    from django.utils import timezone
                    naive_date = datetime.strptime(release_date_str, "%Y-%m-%d")
                    release_date = timezone.make_aware(naive_date)
                except (ValueError, TypeError):
                    # If date format is unexpected, just skip it
                    print(f"Warning: Could not parse release date '{release_date_str}'")
            
            album, album_created = Album.objects.get_or_create(
                artist=artist,
                title=album_name,
                defaults={"release_date": release_date}
            )

            # 5. Upload cover art to Cloudinary if available
            # Upload if album was just created OR if existing album doesn't have a cover
            if cover_url and (album_created or not album.cover_pic_url):
                cover_result = upload_album_cover(cover_url, str(album.id))
                if cover_result:
                    album.cover_pic_url = cover_result['secure_url']
                    album.cover_pic_id = cover_result['public_id']
                    album.save(update_fields=['cover_pic_url', 'cover_pic_id'])

            # 6. Download audio content
            audio_response = requests.get(audio_url, timeout=30)
            audio_response.raise_for_status()

            # 7. Check if song already exists (prevent duplicates by jamendo_id)
            existing_song = Song.objects.filter(jamendo_id=jamendo_id).first()
            
            if existing_song:
                # Song already exists, return existing song
                serializer = SongSerializer(existing_song)
                return Response(
                    {
                        "message": "Song already imported",
                        "song": serializer.data
                    },
                    status=status.HTTP_200_OK
                )

            # 8. Create Song object
            filename = f"jamendo_{jamendo_id}.mp3"
            song = Song(
                title=title,
                album=album,
                duration=duration,  # Use Jamendo duration, will be updated if MFCC analysis succeeds
                jamendo_id=jamendo_id,  # Store Jamendo ID to prevent duplicates
            )
            song.audio_file.save(filename, ContentFile(audio_response.content))
            # Store both local URL and original Jamendo URL
            song.audio_file_url = song.audio_file.url
            song.save()

            # 9. Automatically trigger MFCC analysis
            # Note: Signal handler will also process, but we do it here for immediate feedback
            try:
                file_path = song.audio_file.path
                result = process_track_mfcc(file_path, return_duration=True)
                if result:
                    mfcc_vector, extracted_duration = result
                    # Use update() to avoid triggering signal again
                    Song.objects.filter(id=song.id).update(
                        mfcc_vector=mfcc_vector,
                        duration=extracted_duration  # Use extracted duration (more accurate)
                    )
                    song.refresh_from_db()
            except Exception as mfcc_error:
                # Log error but don't fail the import
                # Signal handler will try as fallback
                print(f"Warning: MFCC analysis failed for song {song.id}: {mfcc_error}")
                import traceback
                traceback.print_exc()
                
                # At least try to extract duration as fallback
                try:
                    duration = extract_duration(song.audio_file.path)
                    if duration:
                        Song.objects.filter(id=song.id).update(duration=duration)
                        song.refresh_from_db()
                except Exception:
                    pass  # Duration extraction also failed, signal will try later

            serializer = SongSerializer(song)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Jamendo import error: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Import failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# --- Streaming View ---


def stream_audio(request, pk):
    """
    Efficiently streams the audio file to the client with HTTP Range support.
    Supports seeking and partial content requests for better performance.
    Falls back to audio_file_url if local file doesn't exist.
    """
    song = get_object_or_404(Song, pk=pk)

    # Check if we have a local file
    has_local_file = False
    path = None
    
    if song.audio_file:
        try:
            path = song.audio_file.path
            if os.path.exists(path):
                has_local_file = True
        except (ValueError, AttributeError):
            # File field exists but path is not accessible
            pass

    # If no local file, proxy the external URL to avoid CORS issues
    if not has_local_file:
        if song.audio_file_url:
            # Proxy the external audio URL (Jamendo or other CDN)
            # This avoids CORS issues and allows range requests
            try:
                range_header = request.META.get('HTTP_RANGE', '').strip()
                headers = {}
                if range_header:
                    headers['Range'] = range_header
                
                audio_response = requests.get(song.audio_file_url, headers=headers, stream=True, timeout=30)
                audio_response.raise_for_status()
                
                # Determine content type from response or URL
                content_type = audio_response.headers.get('Content-Type', 'audio/mpeg')
                
                # Create streaming response
                def stream_proxy():
                    for chunk in audio_response.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                
                response = StreamingHttpResponse(stream_proxy(), content_type=content_type)
                
                # Copy relevant headers from the proxied response
                if 'Content-Length' in audio_response.headers:
                    response['Content-Length'] = audio_response.headers['Content-Length']
                if 'Content-Range' in audio_response.headers:
                    response['Content-Range'] = audio_response.headers['Content-Range']
                    response.status_code = 206  # Partial Content
                if 'Accept-Ranges' in audio_response.headers:
                    response['Accept-Ranges'] = audio_response.headers['Accept-Ranges']
                else:
                    response['Accept-Ranges'] = 'bytes'
                
                return response
            except requests.RequestException as e:
                raise Http404(f"Could not fetch audio: {str(e)}")
        else:
            raise Http404("Audio file not found")

    file_size = os.path.getsize(path)
    
    # Determine content type from file extension
    content_type = "audio/mpeg"  # Default
    ext = os.path.splitext(path)[1].lower()
    content_type_map = {
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
    }
    content_type = content_type_map.get(ext, content_type)
    
    # Check if Range header is present
    range_header = request.META.get('HTTP_RANGE', '').strip()
    
    if range_header:
        # Parse Range header (e.g., "bytes=0-1023" or "bytes=1024-" or "bytes=-500")
        range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
        if range_match:
            start_str = range_match.group(1)
            end_str = range_match.group(2)
            
            # Handle different range formats
            if start_str:
                start = int(start_str)
            else:
                # "bytes=-500" means last 500 bytes
                start = max(0, file_size - int(end_str)) if end_str else 0
            
            if end_str:
                end = int(end_str)
            else:
                # "bytes=1024-" means from 1024 to end
                end = file_size - 1
            
            # Ensure end doesn't exceed file size
            end = min(end, file_size - 1)
            
            # Validate range
            if start < 0 or start >= file_size or end < start:
                response = HttpResponse(status=416)  # Range Not Satisfiable
                response['Content-Range'] = f'bytes */{file_size}'
                response['Accept-Ranges'] = 'bytes'
                return response
            
            # Calculate content length
            content_length = end - start + 1
            
            # Create file iterator for the range
            def file_iterator(file_name, start_byte, end_byte, chunk_size=8192):
                with open(file_name, "rb") as f:
                    f.seek(start_byte)
                    remaining = end_byte - start_byte + 1
                    while remaining > 0:
                        chunk_size_to_read = min(chunk_size, remaining)
                        chunk = f.read(chunk_size_to_read)
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk
            
            response = StreamingHttpResponse(
                file_iterator(path, start, end),
                status=206,  # Partial Content
                content_type=content_type
            )
            response['Content-Length'] = str(content_length)
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Accept-Ranges'] = 'bytes'
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(path)}"'
            return response
    
    # No Range header - return full file
    def file_iterator(file_name, chunk_size=8192):
        with open(file_name, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    response = StreamingHttpResponse(file_iterator(path), content_type=content_type)
    response['Content-Length'] = str(file_size)
    response['Accept-Ranges'] = 'bytes'
    response['Content-Disposition'] = f'inline; filename="{os.path.basename(path)}"'
    return response


# --- User Interactions (Likes & Follows) ---


class LikeSongView(APIView):
    """
    Like a song. Creates a LikedSong record if it doesn't exist.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, format=None):
        song = get_object_or_404(Song, pk=pk)
        
        # Check if already liked
        liked_song, created = LikedSong.objects.get_or_create(
            user=request.user,
            song=song
        )
        
        if created:
            serializer = LikedSongSerializer(liked_song)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Already liked
            serializer = LikedSongSerializer(liked_song)
            return Response(serializer.data, status=status.HTTP_200_OK)


class UnlikeSongView(APIView):
    """
    Unlike a song. Deletes the LikedSong record if it exists.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, format=None):
        song = get_object_or_404(Song, pk=pk)
        
        try:
            liked_song = LikedSong.objects.get(user=request.user, song=song)
            liked_song.delete()
            return Response(
                {"message": "Song unliked successfully"},
                status=status.HTTP_200_OK
            )
        except LikedSong.DoesNotExist:
            return Response(
                {"error": "Song was not liked"},
                status=status.HTTP_404_NOT_FOUND
            )


class UserLikedSongsView(APIView):
    """
    Get all songs liked by the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        liked_songs = LikedSong.objects.filter(user=request.user).select_related('song')
        serializer = LikedSongSerializer(liked_songs, many=True)
        return Response(serializer.data)


class FollowArtistView(APIView):
    """
    Follow an artist. Creates a Follower record if it doesn't exist.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, format=None):
        artist = get_object_or_404(Artist, pk=pk)
        
        # Check if already following
        follower, created = Follower.objects.get_or_create(
            user=request.user,
            artist=artist
        )
        
        if created:
            serializer = FollowerSerializer(follower)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Already following
            serializer = FollowerSerializer(follower)
            return Response(serializer.data, status=status.HTTP_200_OK)


class UnfollowArtistView(APIView):
    """
    Unfollow an artist. Deletes the Follower record if it exists.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, format=None):
        artist = get_object_or_404(Artist, pk=pk)
        
        try:
            follower = Follower.objects.get(user=request.user, artist=artist)
            follower.delete()
            return Response(
                {"message": "Artist unfollowed successfully"},
                status=status.HTTP_200_OK
            )
        except Follower.DoesNotExist:
            return Response(
                {"error": "Artist was not being followed"},
                status=status.HTTP_404_NOT_FOUND
            )


class UserFollowedArtistsView(APIView):
    """
    Get all artists followed by the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        followed_artists = Follower.objects.filter(user=request.user).select_related('artist')
        serializer = FollowerSerializer(followed_artists, many=True)
        return Response(serializer.data)


class ArtistFollowerCountView(APIView):
    """
    Get the total number of followers for an artist.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk, format=None):
        artist = get_object_or_404(Artist, pk=pk)
        follower_count = Follower.objects.filter(artist=artist).count()
        return Response({
            "artist_id": str(artist.id),
            "artist_name": artist.stage_name,
            "follower_count": follower_count
        })


# --- Playlist Management ---


class PlaylistListCreateView(generics.ListCreateAPIView):
    """
    List all playlists or create a new playlist.
    Users can only see their own playlists and public playlists.
    """
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return playlists owned by the user or public playlists."""
        user = self.request.user
        return Playlist.objects.filter(
            Q(owner=user) | Q(is_public=True)
        ).select_related('owner').prefetch_related('songs').order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set the owner to the current user."""
        serializer.save(owner=self.request.user)


class PlaylistDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a playlist.
    Only the owner can update or delete.
    """
    serializer_class = PlaylistDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return playlists owned by the user or public playlists."""
        user = self.request.user
        return Playlist.objects.filter(
            Q(owner=user) | Q(is_public=True)
        ).select_related('owner').prefetch_related('songs')
    
    def get_serializer_class(self):
        """Use detail serializer for GET, basic for PUT/PATCH."""
        if self.request.method == 'GET':
            return PlaylistDetailSerializer
        return PlaylistSerializer
    
    def update(self, request, *args, **kwargs):
        """Only allow owner to update."""
        playlist = self.get_object()
        if playlist.owner != request.user:
            return Response(
                {"detail": "You do not have permission to edit this playlist."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only allow owner to delete."""
        playlist = self.get_object()
        if playlist.owner != request.user:
            return Response(
                {"detail": "You do not have permission to delete this playlist."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class AddSongToPlaylistView(APIView):
    """
    Add a song to a playlist.
    Prevents duplicate songs in the same playlist.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk, song_id):
        """Add a song to the playlist."""
        playlist = get_object_or_404(Playlist, pk=pk)
        
        # Check if user owns the playlist
        if playlist.owner != request.user:
            return Response(
                {"detail": "You do not have permission to modify this playlist."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        song = get_object_or_404(Song, pk=song_id)
        
        # Check if song already exists in playlist
        if PlaylistSong.objects.filter(playlist=playlist, song=song).exists():
            return Response(
                {"detail": "Song is already in this playlist."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add song to playlist
        PlaylistSong.objects.create(playlist=playlist, song=song)
        
        # Return updated playlist
        serializer = PlaylistDetailSerializer(playlist)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RemoveSongFromPlaylistView(APIView):
    """
    Remove a song from a playlist.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, pk, song_id):
        """Remove a song from the playlist."""
        playlist = get_object_or_404(Playlist, pk=pk)
        
        # Check if user owns the playlist
        if playlist.owner != request.user:
            return Response(
                {"detail": "You do not have permission to modify this playlist."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        song = get_object_or_404(Song, pk=song_id)
        playlist_song = get_object_or_404(PlaylistSong, playlist=playlist, song=song)
        
        playlist_song.delete()
        
        # Return updated playlist
        serializer = PlaylistDetailSerializer(playlist)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PlaylistSongsView(APIView):
    """
    List all songs in a playlist.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        """Get all songs in the playlist."""
        playlist = get_object_or_404(Playlist, pk=pk)
        
        # Check if user can view this playlist
        if playlist.owner != request.user and not playlist.is_public:
            return Response(
                {"detail": "You do not have permission to view this playlist."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        playlist_songs = PlaylistSong.objects.filter(
            playlist=playlist
        ).select_related('song', 'song__album', 'song__album__artist').order_by('added_at')
        
        serializer = PlaylistSongSerializer(playlist_songs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReorderPlaylistSongsView(APIView):
    """
    Reorder songs in a playlist by updating their added_at timestamps.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Reorder songs in the playlist."""
        playlist = get_object_or_404(Playlist, pk=pk)
        
        # Check if user owns the playlist
        if playlist.owner != request.user:
            return Response(
                {"detail": "You do not have permission to modify this playlist."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Expected format: {"song_ids": ["uuid1", "uuid2", ...]}
        song_ids = request.data.get('song_ids', [])
        
        if not isinstance(song_ids, list) or len(song_ids) == 0:
            return Response(
                {"detail": "song_ids must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify all songs belong to this playlist
        playlist_songs = PlaylistSong.objects.filter(playlist=playlist)
        existing_song_ids = set(playlist_songs.values_list('song_id', flat=True))
        provided_song_ids = set(song_ids)
        
        if existing_song_ids != provided_song_ids:
            return Response(
                {"detail": "Song IDs do not match the playlist's songs."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update added_at timestamps based on new order
        from django.utils import timezone
        from datetime import timedelta
        
        base_time = timezone.now()
        for index, song_id in enumerate(song_ids):
            PlaylistSong.objects.filter(
                playlist=playlist,
                song_id=song_id
            ).update(added_at=base_time + timedelta(seconds=index))
        
        # Return updated playlist
        serializer = PlaylistDetailSerializer(playlist)
        return Response(serializer.data, status=status.HTTP_200_OK)