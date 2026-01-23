from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints (Song)
    path("songs/", views.SongListCreateView.as_view(), name="song-list-create"),
    path("songs/<uuid:pk>/", views.SongDetailView.as_view(), name="song-detail"),
    path("songs/<uuid:pk>/analyze/", views.SongAnalysisView.as_view(), name="song-analyze"),
    path("songs/<uuid:pk>/recommendations/", views.RecommendationView.as_view(), name="song-recommendations"),

    # Jamendo Integration
    path("jamendo/search/", views.JamendoSearchView.as_view(), name="jamendo-search"),
    path("jamendo/import/", views.JamendoImportView.as_view(), name="jamendo-import"),

    # User Interactions (Likes)
    path("songs/<uuid:pk>/like/", views.LikeSongView.as_view(), name="song-like"),
    path("songs/<uuid:pk>/unlike/", views.UnlikeSongView.as_view(), name="song-unlike"),
    path("liked-songs/", views.UserLikedSongsView.as_view(), name="user-liked-songs"),

    # User Interactions (Follows)
    path("artists/<uuid:pk>/follow/", views.FollowArtistView.as_view(), name="artist-follow"),
    path("artists/<uuid:pk>/unfollow/", views.UnfollowArtistView.as_view(), name="artist-unfollow"),
    path("followed-artists/", views.UserFollowedArtistsView.as_view(), name="user-followed-artists"),

    # Playlist Management
    path("playlists/", views.PlaylistListCreateView.as_view(), name="playlist-list-create"),
    path("playlists/<uuid:pk>/", views.PlaylistDetailView.as_view(), name="playlist-detail"),
    path("playlists/<uuid:pk>/songs/", views.PlaylistSongsView.as_view(), name="playlist-songs"),
    path("playlists/<uuid:pk>/songs/<uuid:song_id>/", views.AddSongToPlaylistView.as_view(), name="playlist-add-song"),
    path("playlists/<uuid:pk>/songs/<uuid:song_id>/remove/", views.RemoveSongFromPlaylistView.as_view(), name="playlist-remove-song"),
    path("playlists/<uuid:pk>/reorder/", views.ReorderPlaylistSongsView.as_view(), name="playlist-reorder"),

    # Streaming Endpoint (Standard HTTP)
    path("stream/<uuid:pk>/", views.stream_audio, name="stream-audio"),
    path("dashboard/", views.dashboard_view, name="music-dashboard"),
]