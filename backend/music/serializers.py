from rest_framework import serializers
from .models import Song, LikedSong, Follower, Artist, Album, Playlist, PlaylistSong


class ArtistSerializer(serializers.ModelSerializer):
    """
    Serializer for Artist model.
    """
    
    class Meta:
        model = Artist
        fields = [
            "id",
            "stage_name",
            "image_url",
            "jamendo_artist_id",
            "verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AlbumSerializer(serializers.ModelSerializer):
    """
    Serializer for Album model with nested artist data.
    """
    artist = ArtistSerializer(read_only=True)
    artist_id = serializers.UUIDField(source="artist.id", read_only=True)
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    
    class Meta:
        model = Album
        fields = [
            "id",
            "title",
            "artist",
            "artist_id",
            "artist_name",
            "release_date",
            "cover_pic_url",
            "cover_pic_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class SongSerializer(serializers.ModelSerializer):
    """
    Basic serializer for listing/creating songs via the upload API.
    Includes nested album and artist data.
    """
    album = AlbumSerializer(read_only=True)
    album_id = serializers.UUIDField(source="album.id", read_only=True, allow_null=True)
    album_title = serializers.CharField(source="album.title", read_only=True, allow_null=True)
    artist = serializers.SerializerMethodField()
    artist_id = serializers.SerializerMethodField()
    artist_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()  # Album cover URL

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "album",
            "album_id",
            "album_title",
            "artist",
            "artist_id",
            "artist_name",
            "duration",
            "audio_file",
            "audio_file_url",
            "jamendo_id",
            "image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["duration", "audio_file_url", "created_at", "updated_at"]
    
    def get_artist(self, obj):
        """Get artist from album if available."""
        if obj.album and obj.album.artist:
            return ArtistSerializer(obj.album.artist).data
        return None
    
    def get_artist_id(self, obj):
        """Get artist ID from album if available."""
        if obj.album and obj.album.artist:
            return obj.album.artist.id
        return None
    
    def get_artist_name(self, obj):
        """Get artist name from album if available."""
        if obj.album and obj.album.artist:
            return obj.album.artist.stage_name
        return None
    
    def get_image_url(self, obj):
        """Get album cover URL if available."""
        if obj.album and obj.album.cover_pic_url:
            return obj.album.cover_pic_url
        return None


class SongDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer exposing the stored MFCC vector as well.
    Includes nested album and artist data.
    """
    album = AlbumSerializer(read_only=True)
    album_id = serializers.UUIDField(source="album.id", read_only=True, allow_null=True)
    album_title = serializers.CharField(source="album.title", read_only=True, allow_null=True)
    artist = serializers.SerializerMethodField()
    artist_id = serializers.SerializerMethodField()
    artist_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()  # Album cover URL

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "album",
            "album_id",
            "album_title",
            "artist",
            "artist_id",
            "artist_name",
            "duration",
            "audio_file",
            "audio_file_url",
            "jamendo_id",
            "image_url",
            "mfcc_vector",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["mfcc_vector", "created_at", "updated_at"]
    
    def get_artist(self, obj):
        """Get artist from album if available."""
        if obj.album and obj.album.artist:
            return ArtistSerializer(obj.album.artist).data
        return None
    
    def get_artist_id(self, obj):
        """Get artist ID from album if available."""
        if obj.album and obj.album.artist:
            return obj.album.artist.id
        return None
    
    def get_artist_name(self, obj):
        """Get artist name from album if available."""
        if obj.album and obj.album.artist:
            return obj.album.artist.stage_name
        return None
    
    def get_image_url(self, obj):
        """Get album cover URL if available."""
        if obj.album and obj.album.cover_pic_url:
            return obj.album.cover_pic_url
        return None


class LikedSongSerializer(serializers.ModelSerializer):
    """
    Serializer for LikedSong model.
    """
    song_title = serializers.CharField(source="song.title", read_only=True)
    song_id = serializers.UUIDField(source="song.id", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    
    class Meta:
        model = LikedSong
        fields = [
            "id",
            "user",
            "user_username",
            "song",
            "song_id",
            "song_title",
            "liked_at",
        ]
        read_only_fields = ["liked_at"]


class FollowerSerializer(serializers.ModelSerializer):
    """
    Serializer for Follower model.
    """
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    artist_id = serializers.UUIDField(source="artist.id", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    
    class Meta:
        model = Follower
        fields = [
            "id",
            "user",
            "user_username",
            "artist",
            "artist_id",
            "artist_name",
            "followed_at",
        ]
        read_only_fields = ["followed_at"]


class PlaylistSongSerializer(serializers.ModelSerializer):
    """
    Serializer for PlaylistSong join table with nested song data.
    """
    song = SongSerializer(read_only=True)
    song_id = serializers.UUIDField(source="song.id", read_only=True)
    position = serializers.SerializerMethodField()
    
    class Meta:
        model = PlaylistSong
        fields = [
            "id",
            "song",
            "song_id",
            "added_at",
            "position",
        ]
        read_only_fields = ["added_at"]
    
    def get_position(self, obj):
        """Get the position of the song in the playlist."""
        # Get all playlist songs ordered by added_at
        playlist_songs = PlaylistSong.objects.filter(
            playlist=obj.playlist
        ).order_by('added_at')
        positions = {ps.id: idx + 1 for idx, ps in enumerate(playlist_songs)}
        return positions.get(obj.id, 0)


class PlaylistSerializer(serializers.ModelSerializer):
    """
    Basic serializer for listing playlists.
    """
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    song_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = [
            "id",
            "title",
            "owner",
            "owner_username",
            "is_public",
            "song_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["owner", "created_at", "updated_at"]
    
    def get_song_count(self, obj):
        """Get the number of songs in the playlist."""
        return obj.songs.count()


class PlaylistDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for playlist with nested songs.
    """
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    songs = serializers.SerializerMethodField()
    song_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = [
            "id",
            "title",
            "owner",
            "owner_username",
            "is_public",
            "songs",
            "song_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["owner", "created_at", "updated_at"]
    
    def get_songs(self, obj):
        """Get all songs in the playlist ordered by added_at."""
        playlist_songs = PlaylistSong.objects.filter(
            playlist=obj
        ).select_related('song', 'song__album', 'song__album__artist').order_by('added_at')
        return PlaylistSongSerializer(playlist_songs, many=True).data
    
    def get_song_count(self, obj):
        """Get the number of songs in the playlist."""
        return obj.songs.count()