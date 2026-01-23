"""
Django management command to directly import songs to Supabase database.

This command connects to Supabase PostgreSQL database and imports data directly.

Usage:
    python manage.py import_to_supabase --supabase-url <url> --supabase-key <key>
    python manage.py import_to_supabase --supabase-url <url> --supabase-key <key> --upload-storage
"""

import os
import requests
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import connections
from music.models import Song, Artist, Album, Playlist, PlaylistSong, LikedSong, Follower
from user.models import User
from decouple import config


class Command(BaseCommand):
    help = 'Import songs and related data directly to Supabase PostgreSQL database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--supabase-url',
            type=str,
            help='Supabase project URL (or set SUPABASE_URL env var)',
        )
        parser.add_argument(
            '--supabase-key',
            type=str,
            help='Supabase service role key (or set SUPABASE_SERVICE_KEY env var)',
        )
        parser.add_argument(
            '--supabase-db-url',
            type=str,
            help='Supabase PostgreSQL connection string (or set SUPABASE_DB_URL env var)',
        )
        parser.add_argument(
            '--upload-storage',
            action='store_true',
            help='Upload audio files to Supabase Storage',
        )
        parser.add_argument(
            '--storage-bucket',
            type=str,
            default='audio-files',
            help='Supabase Storage bucket name (default: audio-files)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip songs that already exist in Supabase',
        )

    def handle(self, *args, **options):
        supabase_url = options['supabase_url'] or config('SUPABASE_URL', default=None)
        supabase_key = options['supabase_key'] or config('SUPABASE_SERVICE_KEY', default=None)
        supabase_db_url = options['supabase_db_url'] or config('SUPABASE_DB_URL', default=None)
        upload_storage = options['upload_storage']
        storage_bucket = options['storage_bucket']
        skip_existing = options['skip_existing']

        if not supabase_db_url:
            raise CommandError(
                'Supabase database URL is required. '
                'Provide --supabase-db-url or set SUPABASE_DB_URL environment variable.'
            )

        self.stdout.write(self.style.SUCCESS('Connecting to Supabase...'))

        # Configure Supabase database connection
        # Parse the connection string
        # Format: postgresql://user:password@host:port/database
        import re
        match = re.match(
            r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)',
            supabase_db_url
        )
        if not match:
            raise CommandError('Invalid Supabase database URL format')

        user, password, host, port, database = match.groups()

        # Create a temporary database connection to Supabase
        supabase_db_config = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': database,
            'USER': user,
            'PASSWORD': password,
            'HOST': host,
            'PORT': port,
        }

        # Use Django's database router or create a new connection
        # For simplicity, we'll use the existing database and provide instructions
        # for manual import via SQL or use Supabase REST API

        self.stdout.write(self.style.SUCCESS('Using Supabase REST API for import...'))

        if not supabase_url or not supabase_key:
            raise CommandError(
                'Supabase URL and key are required for REST API import. '
                'Provide --supabase-url and --supabase-key or set environment variables.'
            )

        # Import using Supabase REST API
        self.import_via_rest_api(
            supabase_url,
            supabase_key,
            upload_storage,
            storage_bucket,
            skip_existing
        )

    def import_via_rest_api(self, supabase_url, supabase_key, upload_storage, storage_bucket, skip_existing):
        """Import data using Supabase REST API."""
        
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }

        base_url = f"{supabase_url}/rest/v1"

        # Import Artists (standalone, no user required)
        self.stdout.write('\nImporting artists...')
        artists = Artist.objects.all()
        for artist in artists:
            # Insert artist (no user_id needed)
            artist_data = {
                'id': str(artist.id),
                'stage_name': artist.stage_name,
                'image_url': artist.image_url or '',
                'jamendo_artist_id': artist.jamendo_artist_id or '',
                'verified': artist.verified,
                'created_at': artist.created_at.isoformat() if artist.created_at else None,
                'updated_at': artist.updated_at.isoformat() if artist.updated_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/artist",
                    json=artist_data,
                    headers=headers,
                )
                if response.status_code in [200, 201]:
                    self.stdout.write(f"  ✓ Imported artist: {artist.stage_name}")
                elif response.status_code == 409:  # Conflict (already exists)
                    if not skip_existing:
                        # Try update
                        response = requests.patch(
                            f"{base_url}/artist?id=eq.{artist.id}",
                            json=artist_data,
                            headers=headers,
                        )
                        if response.status_code == 200:
                            self.stdout.write(f"  Updated artist: {artist.stage_name}")
                    else:
                        self.stdout.write(f"  Skipped existing artist: {artist.stage_name}")
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to import artist {artist.stage_name}: {response.text}")
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error importing artist {artist.stage_name}: {e}")
                )

        # Import Albums
        self.stdout.write('\nImporting albums...')
        albums = Album.objects.select_related('artist').all()
        for album in albums:
            album_data = {
                'id': str(album.id),
                'artist_id': str(album.artist.id),
                'title': album.title,
                'release_date': album.release_date.isoformat() if album.release_date else None,
                'cover_pic_url': album.cover_pic_url,
                'cover_pic_id': album.cover_pic_id,
                'created_at': album.created_at.isoformat() if album.created_at else None,
                'updated_at': album.updated_at.isoformat() if album.updated_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/album",
                    json=album_data,
                    headers=headers,
                )
                if response.status_code in [200, 201]:
                    self.stdout.write(f"  ✓ Imported album: {album.title}")
                elif response.status_code == 409:
                    if not skip_existing:
                        response = requests.patch(
                            f"{base_url}/album?id=eq.{album.id}",
                            json=album_data,
                            headers=headers,
                        )
                        if response.status_code == 200:
                            self.stdout.write(f"  Updated album: {album.title}")
                    else:
                        self.stdout.write(f"  Skipped existing album: {album.title}")
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to import album {album.title}: {response.text}")
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error importing album {album.title}: {e}")
                )

        # Import Songs
        self.stdout.write('\nImporting songs...')
        songs = Song.objects.select_related('album').all()
        imported_count = 0
        skipped_count = 0

        for song in songs:
            # Upload audio file to Supabase Storage if requested
            audio_file_url = song.audio_file_url
            if upload_storage and song.audio_file:
                try:
                    audio_file_url = self.upload_to_supabase_storage(
                        song.audio_file.path,
                        song.id,
                        supabase_url,
                        supabase_key,
                        storage_bucket
                    )
                    self.stdout.write(f"  Uploaded audio for: {song.title}")
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to upload audio for {song.title}: {e}")
                    )

            song_data = {
                'id': str(song.id),
                'title': song.title,
                'album_id': str(song.album.id) if song.album else None,
                'duration': song.duration,
                'audio_file_url': audio_file_url,
                'jamendo_id': song.jamendo_id,
                'mfcc_vector': song.mfcc_vector,
                'created_at': song.created_at.isoformat() if song.created_at else None,
                'updated_at': song.updated_at.isoformat() if song.updated_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/song",
                    json=song_data,
                    headers=headers,
                )
                if response.status_code in [200, 201]:
                    imported_count += 1
                    self.stdout.write(f"  ✓ Imported: {song.title}")
                elif response.status_code == 409:
                    if skip_existing:
                        skipped_count += 1
                        self.stdout.write(f"  Skipped existing: {song.title}")
                    else:
                        response = requests.patch(
                            f"{base_url}/song?id=eq.{song.id}",
                            json=song_data,
                            headers=headers,
                        )
                        if response.status_code == 200:
                            self.stdout.write(f"  Updated: {song.title}")
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to import {song.title}: {response.text}")
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error importing {song.title}: {e}")
                )

        self.stdout.write(f"\n  Imported: {imported_count} songs")
        if skipped_count > 0:
            self.stdout.write(f"  Skipped: {skipped_count} songs")

        # Import Playlists
        self.stdout.write('\nImporting playlists...')
        playlists = Playlist.objects.select_related('owner').all()
        for playlist in playlists:
            playlist_data = {
                'id': str(playlist.id),
                'title': playlist.title,
                'owner_id': str(playlist.owner.id),
                'is_public': playlist.is_public,
                'created_at': playlist.created_at.isoformat() if playlist.created_at else None,
                'updated_at': playlist.updated_at.isoformat() if playlist.updated_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/playlist",
                    json=playlist_data,
                    headers=headers,
                )
                if response.status_code in [200, 201]:
                    self.stdout.write(f"  ✓ Imported playlist: {playlist.title}")
                elif response.status_code == 409:
                    if not skip_existing:
                        response = requests.patch(
                            f"{base_url}/playlist?id=eq.{playlist.id}",
                            json=playlist_data,
                            headers=headers,
                        )
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"  Error importing playlist {playlist.title}: {e}")
                    )

        # Import PlaylistSongs
        self.stdout.write('\nImporting playlist songs...')
        playlist_songs = PlaylistSong.objects.select_related('playlist', 'song').all()
        for ps in playlist_songs:
            ps_data = {
                'id': str(ps.id),
                'playlist_id': str(ps.playlist.id),
                'song_id': str(ps.song.id),
                'added_at': ps.added_at.isoformat() if ps.added_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/playlistsong",
                    json=ps_data,
                    headers=headers,
                )
                if response.status_code == 409:
                    # Already exists, skip
                    pass
            except Exception as e:
                pass  # Silent fail for duplicates

        # Import LikedSongs
        self.stdout.write('\nImporting liked songs...')
        liked_songs = LikedSong.objects.select_related('user', 'song').all()
        for ls in liked_songs:
            ls_data = {
                'id': str(ls.id),
                'user_id': str(ls.user.id),
                'song_id': str(ls.song.id),
                'liked_at': ls.liked_at.isoformat() if ls.liked_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/likedsong",
                    json=ls_data,
                    headers=headers,
                )
                if response.status_code == 409:
                    pass  # Already exists
            except Exception as e:
                pass

        # Import Followers
        self.stdout.write('\nImporting followers...')
        followers = Follower.objects.select_related('user', 'artist').all()
        for follower in followers:
            f_data = {
                'id': str(follower.id),
                'user_id': str(follower.user.id),
                'artist_id': str(follower.artist.id),
                'followed_at': follower.followed_at.isoformat() if follower.followed_at else None,
            }
            
            try:
                response = requests.post(
                    f"{base_url}/follower",
                    json=f_data,
                    headers=headers,
                )
                if response.status_code == 409:
                    pass  # Already exists
            except Exception as e:
                pass

        self.stdout.write(self.style.SUCCESS('\n✓ Import to Supabase completed!'))

    def upload_to_supabase_storage(self, file_path, song_id, supabase_url, supabase_key, bucket_name):
        """Upload audio file to Supabase Storage."""
        file_name = os.path.basename(file_path)
        storage_path = f"songs/{song_id}/{file_name}"
        
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{storage_path}"
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true',
        }
        
        response = requests.put(upload_url, data=file_data, headers=headers)
        response.raise_for_status()
        
        public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{storage_path}"
        return public_url
