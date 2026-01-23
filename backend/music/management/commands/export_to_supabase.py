"""
Django management command to export songs and related data to Supabase.

This command exports songs, artists, albums, and their relationships from the current
database and prepares them for import into Supabase.

Usage:
    python manage.py export_to_supabase --output export.json
    python manage.py export_to_supabase --output export.json --include-files
    python manage.py export_to_supabase --output export.json --upload-to-supabase-storage
"""

import json
import os
import base64
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.files.base import ContentFile
from music.models import Song, Artist, Album, Playlist, PlaylistSong, LikedSong, Follower
from user.models import User
import requests


class Command(BaseCommand):
    help = 'Export songs and related data to Supabase format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default='supabase_export.json',
            help='Output JSON file path (default: supabase_export.json)',
        )
        parser.add_argument(
            '--include-files',
            action='store_true',
            help='Include audio file data in export (base64 encoded)',
        )
        parser.add_argument(
            '--upload-to-supabase-storage',
            action='store_true',
            help='Upload audio files to Supabase Storage (requires SUPABASE_URL and SUPABASE_SERVICE_KEY)',
        )
        parser.add_argument(
            '--supabase-url',
            type=str,
            help='Supabase project URL in format: https://[project-ref].supabase.co (NOT dashboard URL. Get from Project Settings > API > Project URL)',
        )
        parser.add_argument(
            '--supabase-key',
            type=str,
            help='Supabase service role key (or set SUPABASE_SERVICE_KEY env var)',
        )
        parser.add_argument(
            '--storage-bucket',
            type=str,
            default='audio-files',
            help='Supabase Storage bucket name (default: audio-files)',
        )

    def handle(self, *args, **options):
        output_path = options['output']
        include_files = options['include_files']
        upload_to_storage = options['upload_to_supabase_storage']
        supabase_url = options['supabase_url'] or os.getenv('SUPABASE_URL')
        supabase_key = options['supabase_key'] or os.getenv('SUPABASE_SERVICE_KEY')
        storage_bucket = options['storage_bucket']

        self.stdout.write(self.style.SUCCESS('Starting export to Supabase format...'))

        # Collect all data
        export_data = {
            'metadata': {
                'export_date': None,
                'total_songs': 0,
                'total_artists': 0,
                'total_albums': 0,
                'total_playlists': 0,
            },
            'users': [],
            'artists': [],
            'albums': [],
            'songs': [],
            'playlists': [],
            'playlist_songs': [],
            'liked_songs': [],
            'followers': [],
        }

        from datetime import datetime
        export_data['metadata']['export_date'] = datetime.now().isoformat()

        # Export Users (only those with artist profiles or playlists)
        self.stdout.write('Exporting users...')
        user_ids = set()
        
        # Get users from playlists
        playlists = Playlist.objects.select_related('owner').all()
        for playlist in playlists:
            user_ids.add(playlist.owner.id)
        
        # Get users from liked songs
        liked_songs = LikedSong.objects.select_related('user').all()
        for liked_song in liked_songs:
            user_ids.add(liked_song.user.id)
        
        # Get users from followers
        followers = Follower.objects.select_related('user').all()
        for follower in followers:
            user_ids.add(follower.user.id)

        users = User.objects.filter(id__in=user_ids).select_related('profile')
        for user in users:
            # Get profile name if available
            profile_name = None
            if hasattr(user, 'profile') and user.profile:
                profile_name = user.profile.name
            
            export_data['users'].append({
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'name': profile_name,  # Display name from profile
                'is_artist': user.is_artist,
                'is_email_verified': user.is_email_verified,
                'oauth_provider': user.oauth_provider,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
                'updated_at': user.updated_at.isoformat() if hasattr(user, 'updated_at') and user.updated_at else None,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            })

        # Export Artists
        self.stdout.write('Exporting artists...')
        artists = Artist.objects.all()
        for artist in artists:
            export_data['artists'].append({
                'id': str(artist.id),
                'stage_name': artist.stage_name,
                'image_url': artist.image_url or '',
                'jamendo_artist_id': artist.jamendo_artist_id or '',
                'verified': artist.verified,
                'created_at': artist.created_at.isoformat() if artist.created_at else None,
                'updated_at': artist.updated_at.isoformat() if artist.updated_at else None,
            })
        export_data['metadata']['total_artists'] = len(export_data['artists'])

        # Export Albums
        self.stdout.write('Exporting albums...')
        albums = Album.objects.select_related('artist', 'artist__user').all()
        for album in albums:
            export_data['albums'].append({
                'id': str(album.id),
                'artist_id': str(album.artist.id),
                'title': album.title,
                'release_date': album.release_date.isoformat() if album.release_date else None,
                'cover_pic_url': album.cover_pic_url,
                'cover_pic_id': album.cover_pic_id,
                'created_at': album.created_at.isoformat() if album.created_at else None,
                'updated_at': album.updated_at.isoformat() if album.updated_at else None,
            })
        export_data['metadata']['total_albums'] = len(export_data['albums'])

        # Export Songs
        self.stdout.write('Exporting songs...')
        songs = Song.objects.select_related('album', 'album__artist', 'album__artist__user').all()
        
        for song in songs:
            song_data = {
                'id': str(song.id),
                'title': song.title,
                'album_id': str(song.album.id) if song.album else None,
                'duration': song.duration,
                'audio_file_url': song.audio_file_url,
                'jamendo_id': song.jamendo_id,
                'mfcc_vector': song.mfcc_vector,
                'created_at': song.created_at.isoformat() if song.created_at else None,
                'updated_at': song.updated_at.isoformat() if song.updated_at else None,
            }

            # Handle audio file
            if song.audio_file:
                if upload_to_storage and supabase_url and supabase_key:
                    # Upload to Supabase Storage
                    try:
                        storage_url = self.upload_to_supabase_storage(
                            song.audio_file.path,
                            song.id,
                            supabase_url,
                            supabase_key,
                            storage_bucket
                        )
                        song_data['audio_file_url'] = storage_url
                        song_data['audio_file_path'] = None  # No local path needed
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'Failed to upload {song.title} to Supabase Storage: {e}')
                        )
                        song_data['audio_file_path'] = str(song.audio_file.path)
                elif include_files:
                    # Include file as base64
                    try:
                        with open(song.audio_file.path, 'rb') as f:
                            file_data = base64.b64encode(f.read()).decode('utf-8')
                            song_data['audio_file_base64'] = file_data
                            song_data['audio_file_name'] = os.path.basename(song.audio_file.path)
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'Failed to read audio file for {song.title}: {e}')
                        )
                        song_data['audio_file_path'] = str(song.audio_file.path)
                else:
                    # Just include the path
                    song_data['audio_file_path'] = str(song.audio_file.path)

            export_data['songs'].append(song_data)
        
        export_data['metadata']['total_songs'] = len(export_data['songs'])

        # Export Playlists
        self.stdout.write('Exporting playlists...')
        for playlist in playlists:
            export_data['playlists'].append({
                'id': str(playlist.id),
                'title': playlist.title,
                'owner_id': str(playlist.owner.id),
                'is_public': playlist.is_public,
                'created_at': playlist.created_at.isoformat() if playlist.created_at else None,
                'updated_at': playlist.updated_at.isoformat() if playlist.updated_at else None,
            })
        export_data['metadata']['total_playlists'] = len(export_data['playlists'])

        # Export PlaylistSongs
        self.stdout.write('Exporting playlist songs...')
        playlist_songs = PlaylistSong.objects.select_related('playlist', 'song').all()
        for ps in playlist_songs:
            export_data['playlist_songs'].append({
                'id': str(ps.id),
                'playlist_id': str(ps.playlist.id),
                'song_id': str(ps.song.id),
                'added_at': ps.added_at.isoformat() if ps.added_at else None,
            })

        # Export LikedSongs
        self.stdout.write('Exporting liked songs...')
        for liked_song in liked_songs:
            export_data['liked_songs'].append({
                'id': str(liked_song.id),
                'user_id': str(liked_song.user.id),
                'song_id': str(liked_song.song.id),
                'liked_at': liked_song.liked_at.isoformat() if liked_song.liked_at else None,
            })

        # Export Followers
        self.stdout.write('Exporting followers...')
        for follower in followers:
            export_data['followers'].append({
                'id': str(follower.id),
                'user_id': str(follower.user.id),
                'artist_id': str(follower.artist.id),
                'followed_at': follower.followed_at.isoformat() if follower.followed_at else None,
            })

        # Write to JSON file
        self.stdout.write(f'Writing export to {output_path}...')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        # Print summary
        self.stdout.write(self.style.SUCCESS('\nExport completed successfully!'))
        self.stdout.write(f"  - Users: {len(export_data['users'])}")
        self.stdout.write(f"  - Artists: {export_data['metadata']['total_artists']}")
        self.stdout.write(f"  - Albums: {export_data['metadata']['total_albums']}")
        self.stdout.write(f"  - Songs: {export_data['metadata']['total_songs']}")
        self.stdout.write(f"  - Playlists: {export_data['metadata']['total_playlists']}")
        self.stdout.write(f"  - Playlist Songs: {len(export_data['playlist_songs'])}")
        self.stdout.write(f"  - Liked Songs: {len(export_data['liked_songs'])}")
        self.stdout.write(f"  - Followers: {len(export_data['followers'])}")
        self.stdout.write(f"\nExport file: {output_path}")

    def upload_to_supabase_storage(self, file_path, song_id, supabase_url, supabase_key, bucket_name):
        """
        Upload audio file to Supabase Storage.
        
        Returns the public URL of the uploaded file.
        """
        file_name = os.path.basename(file_path)
        # Use song ID as filename to avoid conflicts
        storage_path = f"songs/{song_id}/{file_name}"
        
        # Read file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload to Supabase Storage
        upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{storage_path}"
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true',  # Overwrite if exists
        }
        
        response = requests.put(upload_url, data=file_data, headers=headers)
        response.raise_for_status()
        
        # Return public URL
        public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{storage_path}"
        return public_url
