"""
Django management command to import songs and related data from Supabase export.

This command reads a JSON export file and imports the data into the current database.

Usage:
    python manage.py import_from_supabase --input export.json
    python manage.py import_from_supabase --input export.json --skip-existing
    python manage.py import_from_supabase --input export.json --download-files
"""

import json
import os
import base64
import requests
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from music.models import Song, Artist, Album, Playlist, PlaylistSong, LikedSong, Follower
from user.models import User
import uuid


class Command(BaseCommand):
    help = 'Import songs and related data from Supabase export JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--input',
            type=str,
            required=True,
            help='Input JSON file path',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip songs that already exist (by ID or jamendo_id)',
        )
        parser.add_argument(
            '--download-files',
            action='store_true',
            help='Download audio files from URLs and save locally',
        )
        parser.add_argument(
            '--download-from-base64',
            action='store_true',
            help='Save audio files from base64 encoded data in export',
        )

    def handle(self, *args, **options):
        input_path = options['input']
        skip_existing = options['skip_existing']
        download_files = options['download_files']
        download_from_base64 = options['download_from_base64']

        if not os.path.exists(input_path):
            raise CommandError(f'Input file not found: {input_path}')

        self.stdout.write(self.style.SUCCESS(f'Reading export file: {input_path}...'))

        # Read JSON file
        with open(input_path, 'r', encoding='utf-8') as f:
            export_data = json.load(f)

        metadata = export_data.get('metadata', {})
        self.stdout.write(f"Export date: {metadata.get('export_date', 'Unknown')}")
        self.stdout.write(f"Total songs: {metadata.get('total_songs', 0)}")
        self.stdout.write(f"Total artists: {metadata.get('total_artists', 0)}")
        self.stdout.write(f"Total albums: {metadata.get('total_albums', 0)}")

        # Import Users
        self.stdout.write('\nImporting users...')
        user_map = {}  # Map old user IDs to new user objects
        for user_data in export_data.get('users', []):
            user_id = uuid.UUID(user_data['id'])
            user, created = User.objects.get_or_create(
                id=user_id,
                defaults={
                    'username': user_data.get('username', f'user_{user_id}'),
                    'email': user_data.get('email', ''),
                    'is_artist': user_data.get('is_artist', False),
                    'is_email_verified': user_data.get('is_email_verified', False),
                    'oauth_provider': user_data.get('oauth_provider', ''),
                    'is_active': user_data.get('is_active', True),
                    'is_staff': user_data.get('is_staff', False),
                }
            )
            
            # Update profile name if provided
            if user_data.get('name') and hasattr(user, 'profile'):
                from user.models import Profile
                profile, _ = Profile.objects.get_or_create(user=user)
                profile.name = user_data.get('name')
                profile.save()
            user_map[user_data['id']] = user
            if created:
                self.stdout.write(f"  Created user: {user.username}")
            else:
                self.stdout.write(f"  User already exists: {user.username}")

        # Import Artists
        self.stdout.write('\nImporting artists...')
        artist_map = {}  # Map old artist IDs to new artist objects
        for artist_data in export_data.get('artists', []):
            artist_id = uuid.UUID(artist_data['id'])
            
            # Create artist without user (artists are standalone now)
            defaults = {
                'stage_name': artist_data['stage_name'],
                'verified': artist_data.get('verified', False),
            }
            
            # Add optional fields if they exist
            if artist_data.get('image_url'):
                defaults['image_url'] = artist_data['image_url']
            if artist_data.get('jamendo_artist_id'):
                defaults['jamendo_artist_id'] = artist_data['jamendo_artist_id']
            
            artist, created = Artist.objects.get_or_create(
                id=artist_id,
                defaults=defaults
            )
            
            # Update fields if artist already existed
            if not created:
                updated = False
                if artist.stage_name != artist_data['stage_name']:
                    artist.stage_name = artist_data['stage_name']
                    updated = True
                if artist_data.get('image_url') and not artist.image_url:
                    artist.image_url = artist_data['image_url']
                    updated = True
                if artist_data.get('jamendo_artist_id') and not artist.jamendo_artist_id:
                    artist.jamendo_artist_id = artist_data['jamendo_artist_id']
                    updated = True
                if updated:
                    artist.save()
            
            artist_map[artist_data['id']] = artist
            if created:
                self.stdout.write(f"  Created artist: {artist.stage_name}")
            else:
                self.stdout.write(f"  Artist already exists: {artist.stage_name}")

        # Import Albums
        self.stdout.write('\nImporting albums...')
        album_map = {}  # Map old album IDs to new album objects
        for album_data in export_data.get('albums', []):
            album_id = uuid.UUID(album_data['id'])
            artist = artist_map.get(album_data['artist_id'])
            if not artist:
                self.stdout.write(
                    self.style.WARNING(f"  Skipping album {album_data['title']}: artist not found")
                )
                continue

            release_date = None
            if album_data.get('release_date'):
                try:
                    release_date = timezone.datetime.fromisoformat(album_data['release_date'].replace('Z', '+00:00'))
                except:
                    pass

            album, created = Album.objects.get_or_create(
                id=album_id,
                defaults={
                    'artist': artist,
                    'title': album_data['title'],
                    'release_date': release_date,
                    'cover_pic_url': album_data.get('cover_pic_url', ''),
                    'cover_pic_id': album_data.get('cover_pic_id', ''),
                }
            )
            album_map[album_data['id']] = album
            if created:
                self.stdout.write(f"  Created album: {album.title}")
            else:
                self.stdout.write(f"  Album already exists: {album.title}")

        # Import Songs
        self.stdout.write('\nImporting songs...')
        song_map = {}  # Map old song IDs to new song objects
        imported_count = 0
        skipped_count = 0

        for song_data in export_data.get('songs', []):
            song_id = uuid.UUID(song_data['id'])
            
            # Check if song already exists
            if skip_existing:
                if Song.objects.filter(id=song_id).exists():
                    self.stdout.write(f"  Skipping existing song: {song_data['title']}")
                    skipped_count += 1
                    song_map[song_data['id']] = Song.objects.get(id=song_id)
                    continue
                
                # Also check by jamendo_id if present
                if song_data.get('jamendo_id'):
                    existing = Song.objects.filter(jamendo_id=song_data['jamendo_id']).first()
                    if existing:
                        self.stdout.write(f"  Skipping existing song (by jamendo_id): {song_data['title']}")
                        skipped_count += 1
                        song_map[song_data['id']] = existing
                        continue

            album = None
            if song_data.get('album_id'):
                album = album_map.get(song_data['album_id'])

            # Handle audio file
            audio_file = None
            audio_file_url = song_data.get('audio_file_url', '')
            
            if download_from_base64 and song_data.get('audio_file_base64'):
                # Decode base64 and save as file
                try:
                    file_data = base64.b64decode(song_data['audio_file_base64'])
                    file_name = song_data.get('audio_file_name', f'{song_id}.mp3')
                    audio_file = ContentFile(file_data, name=file_name)
                    self.stdout.write(f"  Decoded audio file for: {song_data['title']}")
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to decode audio file for {song_data['title']}: {e}")
                    )
            elif download_files and audio_file_url:
                # Download file from URL
                try:
                    response = requests.get(audio_file_url, timeout=30)
                    response.raise_for_status()
                    file_name = os.path.basename(audio_file_url) or f'{song_id}.mp3'
                    audio_file = ContentFile(response.content, name=file_name)
                    self.stdout.write(f"  Downloaded audio file for: {song_data['title']}")
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to download audio file for {song_data['title']}: {e}")
                    )
            elif song_data.get('audio_file_path') and os.path.exists(song_data['audio_file_path']):
                # Use existing local file
                with open(song_data['audio_file_path'], 'rb') as f:
                    file_name = os.path.basename(song_data['audio_file_path'])
                    audio_file = ContentFile(f.read(), name=file_name)

            # Create or update song
            song, created = Song.objects.update_or_create(
                id=song_id,
                defaults={
                    'title': song_data['title'],
                    'album': album,
                    'duration': song_data.get('duration', 0),
                    'audio_file': audio_file,
                    'audio_file_url': audio_file_url,
                    'jamendo_id': song_data.get('jamendo_id'),
                    'mfcc_vector': song_data.get('mfcc_vector'),
                }
            )
            
            song_map[song_data['id']] = song
            if created:
                imported_count += 1
                self.stdout.write(f"  ✓ Imported: {song.title}")
            else:
                self.stdout.write(f"  Updated: {song.title}")

        self.stdout.write(f"\n  Imported: {imported_count} songs")
        if skipped_count > 0:
            self.stdout.write(f"  Skipped: {skipped_count} songs")

        # Import Playlists
        self.stdout.write('\nImporting playlists...')
        playlist_map = {}
        for playlist_data in export_data.get('playlists', []):
            playlist_id = uuid.UUID(playlist_data['id'])
            owner = user_map.get(playlist_data['owner_id'])
            if not owner:
                self.stdout.write(
                    self.style.WARNING(f"  Skipping playlist {playlist_data['title']}: owner not found")
                )
                continue

            playlist, created = Playlist.objects.get_or_create(
                id=playlist_id,
                defaults={
                    'title': playlist_data['title'],
                    'owner': owner,
                    'is_public': playlist_data.get('is_public', False),
                }
            )
            playlist_map[playlist_data['id']] = playlist
            if created:
                self.stdout.write(f"  Created playlist: {playlist.title}")

        # Import PlaylistSongs
        self.stdout.write('\nImporting playlist songs...')
        for ps_data in export_data.get('playlist_songs', []):
            playlist = playlist_map.get(ps_data['playlist_id'])
            song = song_map.get(ps_data['song_id'])
            
            if not playlist or not song:
                continue

            added_at = None
            if ps_data.get('added_at'):
                try:
                    added_at = timezone.datetime.fromisoformat(ps_data['added_at'].replace('Z', '+00:00'))
                except:
                    pass

            PlaylistSong.objects.get_or_create(
                playlist=playlist,
                song=song,
                defaults={
                    'id': uuid.UUID(ps_data['id']),
                    'added_at': added_at,
                }
            )

        # Import LikedSongs
        self.stdout.write('\nImporting liked songs...')
        for liked_data in export_data.get('liked_songs', []):
            user = user_map.get(liked_data['user_id'])
            song = song_map.get(liked_data['song_id'])
            
            if not user or not song:
                continue

            liked_at = None
            if liked_data.get('liked_at'):
                try:
                    liked_at = timezone.datetime.fromisoformat(liked_data['liked_at'].replace('Z', '+00:00'))
                except:
                    pass

            LikedSong.objects.get_or_create(
                user=user,
                song=song,
                defaults={
                    'id': uuid.UUID(liked_data['id']),
                    'liked_at': liked_at,
                }
            )

        # Import Followers
        self.stdout.write('\nImporting followers...')
        for follower_data in export_data.get('followers', []):
            user = user_map.get(follower_data['user_id'])
            artist = artist_map.get(follower_data['artist_id'])
            
            if not user or not artist:
                continue

            followed_at = None
            if follower_data.get('followed_at'):
                try:
                    followed_at = timezone.datetime.fromisoformat(follower_data['followed_at'].replace('Z', '+00:00'))
                except:
                    pass

            Follower.objects.get_or_create(
                user=user,
                artist=artist,
                defaults={
                    'id': uuid.UUID(follower_data['id']),
                    'followed_at': followed_at,
                }
            )

        self.stdout.write(self.style.SUCCESS('\n✓ Import completed successfully!'))
