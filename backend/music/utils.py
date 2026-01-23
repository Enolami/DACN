import librosa
import numpy as np
import os
from typing import Tuple, Optional
from io import BytesIO
import requests
import cloudinary.uploader
from django.conf import settings

def process_track_mfcc(file_path, n_mfcc=13, duration=30, return_duration=True):
    """
    Loads an audio file and calculates Mel-frequency cepstral coefficients (MFCCs).
    Returns a simplified averaged vector (20-40 numbers) instead of the full matrix.
    
    Args:
        file_path (str): Path to the audio file.
        n_mfcc (int): Number of MFCCs to extract (default 13).
        duration (int): Duration in seconds to load for MFCC analysis (to save memory/time). 
                        None for full file. Note: For duration calculation, always loads full file.
        return_duration (bool): Whether to also return the audio duration.
        
    Returns:
        If return_duration=True: Tuple[list, int] - (MFCC vector, duration in seconds)
        If return_duration=False: list - MFCC vector only
        Returns None on error.
        
    The MFCC vector is averaged across time to create a single feature vector
    representing the overall acoustic characteristics of the song.
    """
    try:
        # Load audio file for MFCC analysis (may be limited to duration parameter for performance)
        # y: audio time series, sr: sampling rate
        y, sr = librosa.load(file_path, duration=duration)
        
        # Calculate MFCC - returns shape (n_mfcc, time_steps)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        
        # Average across time dimension to get a single vector per MFCC coefficient
        # This reduces the matrix from (n_mfcc, time_steps) to (n_mfcc,)
        mfcc_mean = np.mean(mfcc, axis=1)
        
        # Optionally add standard deviation for richer features
        # This doubles the feature count: mean + std for each MFCC
        mfcc_std = np.std(mfcc, axis=1)
        mfcc_vector = np.concatenate([mfcc_mean, mfcc_std])
        
        # Convert to list for JSON serialization
        mfcc_vector_list = mfcc_vector.tolist()
        
        if return_duration:
            # Get full duration of the audio file (load full file separately for accurate duration)
            # This ensures we get the actual file duration, not just the loaded portion
            y_full, sr_full = librosa.load(file_path, duration=None)  # Load full file
            full_duration = librosa.get_duration(y=y_full, sr=sr_full)
            duration_seconds = int(round(full_duration))
            return mfcc_vector_list, duration_seconds
        else:
            return mfcc_vector_list
        
    except Exception as e:
        print(f"Error processing audio: {e}")
        import traceback
        traceback.print_exc()
        return None


def extract_duration(file_path: str) -> Optional[int]:
    """
    Extract the duration of an audio file in seconds.
    
    Args:
        file_path (str): Path to the audio file.
        
    Returns:
        int: Duration in seconds, or None on error.
    """
    try:
        y, sr = librosa.load(file_path)
        duration = librosa.get_duration(y=y, sr=sr)
        return int(round(duration))
    except Exception as e:
        print(f"Error extracting duration: {e}")
        return None


def upload_album_cover(image_url: str, album_id: str) -> Optional[dict]:
    """
    Download an image from a URL and upload it to Cloudinary as an album cover.
    
    Args:
        image_url (str): URL of the image to download.
        album_id (str): UUID of the album (used for public_id).
        
    Returns:
        dict: Cloudinary upload result with 'secure_url' and 'public_id', or None on error.
    """
    try:
        # Download the image
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Create BytesIO object from image content
        image_file = BytesIO(response.content)
        
        # Determine format from URL or content type
        content_type = response.headers.get('content-type', '')
        if 'png' in content_type:
            file_format = 'png'
        elif 'jpeg' in content_type or 'jpg' in content_type:
            file_format = 'jpg'
        elif 'webp' in content_type:
            file_format = 'webp'
        else:
            # Default to jpg if unknown
            file_format = 'jpg'
        
        # Create public_id for Cloudinary
        public_id = f'album_covers/album_{album_id}'
        
        # Upload to Cloudinary with transformations for album cover optimization
        upload_result = cloudinary.uploader.upload(
            image_file,
            public_id=public_id,
            folder='album_covers',
            overwrite=True,
            resource_type='image',
            format=file_format,
            transformation=[
                {'width': 1000, 'height': 1000, 'crop': 'fill', 'gravity': 'auto'},
                {'quality': 'auto', 'fetch_format': 'auto'},
            ],
        )
        
        return {
            'secure_url': upload_result['secure_url'],
            'public_id': upload_result['public_id'],
        }
        
    except Exception as e:
        print(f"Error uploading album cover to Cloudinary: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_or_create_jamendo_artist(artist_name: str, jamendo_artist_id: str = None, artist_image_url: str = None):
    """
    Get or create an Artist for Jamendo imports.
    No longer requires a User - artists are standalone entities.
    
    Args:
        artist_name (str): Name of the artist.
        jamendo_artist_id (str, optional): Jamendo artist ID for uniqueness.
        artist_image_url (str, optional): Artist image URL from Jamendo.
        
    Returns:
        Artist: The artist object.
    """
    from .models import Artist
    
    # Create or get artist by jamendo_artist_id if available, otherwise by name
    if jamendo_artist_id:
        artist, created = Artist.objects.get_or_create(
            jamendo_artist_id=jamendo_artist_id,
            defaults={
                'stage_name': artist_name,
                'image_url': artist_image_url or '',
            }
        )
    else:
        # Fallback: get by name (less reliable, but works if no jamendo_id)
        artist, created = Artist.objects.get_or_create(
            stage_name=artist_name,
            jamendo_artist_id__isnull=True,
            defaults={
                'image_url': artist_image_url or '',
            }
        )
    
    # Update fields if artist already existed
    if not created:
        updated = False
        if artist.stage_name != artist_name:
            artist.stage_name = artist_name
            updated = True
        if artist_image_url and not artist.image_url:
            artist.image_url = artist_image_url
            updated = True
        if updated:
            artist.save()
    
    return artist


def calculate_similarity(song_id, top_n=5, min_similarity=0.0):
    """
    Calculate cosine similarity between a target song and all other songs with MFCC vectors.
    Returns the top N most similar songs.
    
    Args:
        song_id: UUID of the target song
        top_n (int): Number of similar songs to return (default: 5)
        min_similarity (float): Minimum similarity score threshold (default: 0.0)
        
    Returns:
        list: List of tuples (song_object, similarity_score) sorted by similarity (descending)
        Returns empty list if:
        - Target song not found
        - Target song has no MFCC vector
        - No other songs with MFCC vectors found
    """
    from .models import Song
    from sklearn.metrics.pairwise import cosine_similarity
    
    try:
        # Get target song
        target_song = Song.objects.get(id=song_id)
        
        # Check if target song has MFCC vector
        if not target_song.mfcc_vector:
            return []
        
        # Convert target MFCC vector to numpy array
        target_vector = np.array(target_song.mfcc_vector)
        
        # Get all other songs with MFCC vectors (exclude target song)
        # Use select_related to optimize database queries
        other_songs = Song.objects.select_related('album', 'album__artist').exclude(
            id=song_id
        ).exclude(mfcc_vector__isnull=True).exclude(mfcc_vector=[])
        
        if not other_songs.exists():
            return []
        
        # Prepare vectors for comparison
        song_vectors = []
        song_objects = []
        
        for song in other_songs:
            if song.mfcc_vector:  # Double check
                try:
                    vector = np.array(song.mfcc_vector)
                    # Ensure vectors have same length
                    if len(vector) == len(target_vector):
                        song_vectors.append(vector)
                        song_objects.append(song)
                except (ValueError, TypeError):
                    # Skip songs with invalid vectors
                    continue
        
        if not song_vectors:
            return []
        
        # Convert to numpy array for efficient computation
        song_vectors_array = np.array(song_vectors)
        
        # Reshape target vector for sklearn (needs to be 2D)
        target_vector_2d = target_vector.reshape(1, -1)
        
        # Calculate cosine similarity
        # cosine_similarity returns a 2D array: [[similarity1, similarity2, ...]]
        similarities = cosine_similarity(target_vector_2d, song_vectors_array)[0]
        
        # Create list of (song, similarity) tuples
        results = list(zip(song_objects, similarities))
        
        # Filter by minimum similarity threshold
        results = [(song, score) for song, score in results if score >= min_similarity]
        
        # Sort by similarity (descending) and get top N
        results.sort(key=lambda x: x[1], reverse=True)
        results = results[:top_n]
        
        return results
        
    except Song.DoesNotExist:
        return []
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        import traceback
        traceback.print_exc()
        return []