from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints
    path('tracks/', views.TrackListCreateView.as_view(), name='track-list-create'),
    path('tracks/<int:pk>/', views.TrackDetailView.as_view(), name='track-detail'),
    path('tracks/<int:pk>/analyze/', views.TrackAnalysisView.as_view(), name='track-analyze'),
    
    # Jamendo Integration
    path('jamendo/search/', views.JamendoSearchView.as_view(), name='jamendo-search'),
    path('jamendo/import/', views.JamendoImportView.as_view(), name='jamendo-import'),
    
    # Streaming Endpoint (Standard HTTP)
    path('stream/<int:pk>/', views.stream_audio, name='stream-audio'),
    path('dashboard/', views.dashboard_view, name='music-dashboard'),
]