from django.conf import settings
from django.db import models
import uuid

class Artist(models.Model):
    """
    Artist model for music artists (no longer tied to User).
    Used for Jamendo imports and general artist information.

    Schema reference:
      Artist {
        id string pk
        stage_name string
        image_url string (optional, from Jamendo)
        jamendo_artist_id string (optional, for tracking Jamendo artists)
        verified bool
        created_at datetime
        updated_at datetime
      }
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stage_name = models.CharField(max_length=255)
    image_url = models.URLField(max_length=500, blank=True, null=True, help_text="Artist image URL from Jamendo or other sources")
    jamendo_artist_id = models.CharField(max_length=100, blank=True, null=True, unique=True, db_index=True, help_text="Jamendo artist ID for tracking")
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure unique jamendo_artist_id when it's not null
        constraints = [
            models.UniqueConstraint(fields=['jamendo_artist_id'], condition=models.Q(jamendo_artist_id__isnull=False), name='unique_jamendo_artist_id')
        ]

    def __str__(self) -> str:  # pragma: no cover
        return self.stage_name


class Album(models.Model):
    """
    Music catalog album.

    Schema reference:
      Album {
        id string pk
        title string
        artist_id Artist [ref, required]
        release_date datetime
        cover_pic_url string
        cover_pic_id string
        created_at datetime
        updated_at datetime
      }
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(
        Artist, on_delete=models.CASCADE, related_name="albums"
    )
    title = models.CharField(max_length=255)
    release_date = models.DateTimeField(null=True, blank=True)
    cover_pic_url = models.URLField(max_length=500, blank=True)
    cover_pic_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.title


class Song(models.Model):
    """
    Individual song / track in the catalog.

    Schema reference:
      Song {
        id string pk
        title string
        album_id Album [ref]
        duration int
        audio_file_url string
        mfcc_vector json
        created_at datetime
        updated_at datetime
      }
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    album = models.ForeignKey(
        Album,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="songs",
    )
    # Duration in seconds. For newly uploaded or imported songs this can be
    # populated lazily after analysis, so we keep a sensible default.
    duration = models.PositiveIntegerField(help_text="Duration in seconds", default=0)

    # Optional local audio file (for uploads / Jamendo imports).
    audio_file = models.FileField(upload_to="tracks/", null=True, blank=True)

    # Public URL to stream this audio from (Jamendo URL or our own media URL).
    audio_file_url = models.URLField(max_length=500, blank=True)

    # Jamendo track ID (for tracking imports and preventing duplicates)
    jamendo_id = models.CharField(max_length=100, blank=True, null=True, unique=True, db_index=True)

    # Stored MFCC vector (content-based features for recommendations).
    mfcc_vector = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.title


class Playlist(models.Model):
    """
    User playlist model.

    Schema reference:
      Playlist {
        id string pk
        title string
        owner_id User [ref, required]
        is_public bool
        created_at datetime
        updated_at datetime
      }
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlists",
    )
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Explicit many-to-many via PlaylistSong join table
    songs = models.ManyToManyField(
        "Song", through="PlaylistSong", related_name="playlists"
    )

    def __str__(self) -> str:  # pragma: no cover
        return self.title


class PlaylistSong(models.Model):
    """
    Join table relating Playlists and Songs.

    Schema reference:
      PlaylistSong {
        id string pk
        playlist_id Playlist [ref, required]
        song_id Song [ref, required]
        added_at datetime
      }
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="playlist_songs"
    )
    song = models.ForeignKey(
        Song, on_delete=models.CASCADE, related_name="playlist_songs"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("playlist", "song")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.playlist.title} - {self.song.title}"


class LikedSong(models.Model):
    """
    User likes a specific Song.
    
    Schema reference:
      LikedSong {
        id string pk
        user_id User [ref, required]
        song_id Song [ref, required]
        liked_at datetime
      }
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="liked_songs"
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name="liked_by_users"
    )
    liked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("user", "song")
        ordering = ["-liked_at"]
    
    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user.username} likes {self.song.title}"


class Follower(models.Model):
    """
    User follows an Artist.
    
    Schema reference:
      Follower {
        id string pk
        user_id User [ref, required]   // The "Fan"
        artist_id Artist [ref, required] // The "Idol"
        followed_at datetime
      }
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following_artists"
    )
    artist = models.ForeignKey(
        Artist,
        on_delete=models.CASCADE,
        related_name="followers"
    )
    followed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("user", "artist")
        ordering = ["-followed_at"]
    
    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user.username} follows {self.artist.stage_name}"