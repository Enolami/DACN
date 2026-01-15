from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints (Song)
    path("songs/", views.SongListCreateView.as_view(), name="song-list-create"),
    path("songs/<uuid:pk>/", views.SongDetailView.as_view(), name="song-detail"),
    path("songs/<uuid:pk>/analyze/", views.SongAnalysisView.as_view(), name="song-analyze"),

    # Jamendo Integration
    path("jamendo/search/", views.JamendoSearchView.as_view(), name="jamendo-search"),
    path("jamendo/import/", views.JamendoImportView.as_view(), name="jamendo-import"),

    # Streaming Endpoint (Standard HTTP)
    path("stream/<uuid:pk>/", views.stream_audio, name="stream-audio"),
    path("dashboard/", views.dashboard_view, name="music-dashboard"),
]