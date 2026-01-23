"""
Django management command to import songs from Jamendo API.

This command fetches tracks from Jamendo and creates Artist, Album, and Song records
in the database (which will be Supabase in production).

Usage:
    python manage.py import_jamendo_songs --limit 200
    python manage.py import_jamendo_songs --limit 200 --skip-existing
    python manage.py import_jamendo_songs --limit 200 --genre pop
"""

import requests
import time
import os
import uuid
from datetime import datetime
from io import BytesIO
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from decouple import config
from music.models import Song, Artist, Album
from music.utils import (
    get_or_create_jamendo_artist,
    upload_album_cover,
    process_track_mfcc
)


class Command(BaseCommand):
    help = 'Import songs from Jamendo API into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=200,
            help='Number of songs to import (default: 200)',
        )
        parser.add_argument(
            '--offset',
            type=int,
            default=0,
            help='Offset for pagination (default: 0)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip songs that already exist (by jamendo_id)',
        )
        parser.add_argument(
            '--genre',
            type=str,
            default=None,
            help='Filter by genre (e.g., pop, rock, electronic)',
        )
        parser.add_argument(
            '--order',
            type=str,
            default='popularity_total',
            help='Order by: popularity_total, releasedate, downloads_total (default: popularity_total)',
        )
        parser.add_argument(
            '--skip-mfcc',
            action='store_true',
            help='Skip MFCC analysis (faster but no recommendations)',
        )
        parser.add_argument(
            '--upload-to-supabase',
            action='store_true',
            help='Upload audio files directly to Supabase Storage (recommended for production)',
        )
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
            '--storage-bucket',
            type=str,
            default='audio-files',
            help='Supabase Storage bucket name (default: audio-files)',
        )

    def handle(self, *args, **options):
        limit = options['limit']
        offset = options['offset']
        skip_existing = options['skip_existing']
        genre = options['genre']
        order = options['order']
        skip_mfcc = options['skip_mfcc']
        upload_to_supabase = options['upload_to_supabase']
        supabase_url = options['supabase_url'] or config('SUPABASE_URL', default=None)
        supabase_key = options['supabase_key'] or config('SUPABASE_SERVICE_KEY', default=None)
        storage_bucket = options['storage_bucket']

        if not settings.JAMENDO_CLIENT_ID:
            raise CommandError('JAMENDO_CLIENT_ID is not set in settings')
        
        if upload_to_supabase and not (supabase_url and supabase_key):
            raise CommandError(
                'Supabase URL and key are required when using --upload-to-supabase. '
                'Provide --supabase-url and --supabase-key or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
            )

        self.stdout.write(self.style.SUCCESS(f'Starting import of {limit} songs from Jamendo...'))

        # Build Jamendo API parameters
        params = {
            'client_id': settings.JAMENDO_CLIENT_ID,
            'format': 'json',
            'limit': min(limit, 200),  # Jamendo API max limit is 200 per request
            'offset': offset,
            'order': order,
            'include': 'musicinfo',
        }

        if genre:
            params['tags'] = genre

        imported_count = 0
        skipped_count = 0
        error_count = 0
        page = 0
        total_to_import = limit

        while imported_count < total_to_import:
            # Update offset for pagination
            params['offset'] = offset + (page * params['limit'])
            params['limit'] = min(params['limit'], total_to_import - imported_count)

            self.stdout.write(f'\nFetching page {page + 1} (offset: {params["offset"]}, limit: {params["limit"]})...')

            try:
                # Fetch tracks from Jamendo
                url = 'https://api.jamendo.com/v3.0/tracks/'
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()

                results = data.get('results', [])
                if not results:
                    self.stdout.write(self.style.WARNING('No more tracks available'))
                    break

                self.stdout.write(f'Found {len(results)} tracks, processing...')

                # Process each track
                for track_info in results:
                    try:
                        result = self._import_track(
                            track_info, 
                            skip_existing, 
                            skip_mfcc,
                            upload_to_supabase,
                            supabase_url,
                            supabase_key,
                            storage_bucket
                        )
                        if result == 'imported':
                            imported_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ [{imported_count}/{total_to_import}] Imported: {track_info.get("name", "Unknown")}')
                            )
                        elif result == 'skipped':
                            skipped_count += 1
                            self.stdout.write(
                                self.style.WARNING(f'⊘ [{imported_count}/{total_to_import}] Skipped: {track_info.get("name", "Unknown")}')
                            )
                        else:
                            error_count += 1
                            self.stdout.write(
                                self.style.ERROR(f'✗ [{imported_count}/{total_to_import}] Error: {track_info.get("name", "Unknown")}')
                            )

                        # Rate limiting - be nice to Jamendo API
                        time.sleep(0.5)

                    except Exception as e:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(f'✗ Error importing track {track_info.get("name", "Unknown")}: {str(e)}')
                        )
                        continue

                # Check if we got fewer results than requested (end of data)
                if len(results) < params['limit']:
                    self.stdout.write(self.style.WARNING('Reached end of available tracks'))
                    break

                page += 1

            except requests.RequestException as e:
                self.stdout.write(self.style.ERROR(f'Jamendo API error: {str(e)}'))
                break
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Unexpected error: {str(e)}'))
                break

        # Summary
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS(f'Import completed!'))
        self.stdout.write(f'  ✓ Imported: {imported_count}')
        self.stdout.write(f'  ⊘ Skipped: {skipped_count}')
        self.stdout.write(f'  ✗ Errors: {error_count}')
        self.stdout.write('=' * 50)

    def _import_track(self, track_info, skip_existing, skip_mfcc, upload_to_supabase=False, supabase_url=None, supabase_key=None, storage_bucket='audio-files'):
        """
        Import a single track from Jamendo.
        Returns: 'imported', 'skipped', or 'error'
        """
        try:
            jamendo_id = str(track_info.get('id'))
            if not jamendo_id:
                return 'error'

            # Check if song already exists
            if skip_existing and Song.objects.filter(jamendo_id=jamendo_id).exists():
                return 'skipped'

            # Extract track information
            title = track_info.get('name', 'Unknown Track')
            audio_url = track_info.get('audio')
            artist_name = track_info.get('artist_name') or track_info.get('artist_nameformat', 'Unknown Artist')
            album_name = track_info.get('album_name') or title
            cover_url = track_info.get('image')
            duration = track_info.get('duration', 0)
            jamendo_artist_id = str(track_info.get('artist_id', '')) if track_info.get('artist_id') else None
            release_date_str = track_info.get('releasedate')

            if not audio_url:
                return 'error'

            # Fetch artist image if available
            artist_image_url = None
            if jamendo_artist_id:
                try:
                    artist_url = 'https://api.jamendo.com/v3.0/artists/'
                    artist_params = {
                        'client_id': settings.JAMENDO_CLIENT_ID,
                        'format': 'json',
                        'id': jamendo_artist_id,
                    }
                    artist_resp = requests.get(artist_url, params=artist_params, timeout=10)
                    if artist_resp.status_code == 200:
                        artist_results = artist_resp.json().get('results', [])
                        if artist_results:
                            artist_image_url = (
                                artist_results[0].get('image') or
                                artist_results[0].get('artistimage') or
                                artist_results[0].get('image_url') or
                                None
                            )
                except Exception:
                    pass  # Continue without artist image

            # Create or get Artist
            artist = get_or_create_jamendo_artist(artist_name, jamendo_artist_id, artist_image_url)

            # Parse release date
            release_date = None
            if release_date_str:
                try:
                    release_date = datetime.strptime(release_date_str, '%Y-%m-%d')
                except (ValueError, TypeError):
                    pass

            # Create or get Album
            album, album_created = Album.objects.get_or_create(
                artist=artist,
                title=album_name,
                defaults={'release_date': release_date}
            )

            # Upload cover art if available
            if cover_url and (album_created or not album.cover_pic_url):
                cover_result = upload_album_cover(cover_url, str(album.id))
                if cover_result:
                    album.cover_pic_url = cover_result['secure_url']
                    album.cover_pic_id = cover_result['public_id']
                    album.save(update_fields=['cover_pic_url', 'cover_pic_id'])

            # Create Song first (to get the ID for storage path)
            song = Song(
                title=title,
                album=album,
                duration=duration,
                jamendo_id=jamendo_id,
                audio_file_url=audio_url,  # Temporary - will update after upload
            )
            song.save()
            
            # Download audio once - we'll use it for both Supabase upload and MFCC analysis
            audio_data = None
            final_audio_url = audio_url  # Default to Jamendo URL
            
            # Download audio if we need it for Supabase upload or MFCC analysis
            if upload_to_supabase or not skip_mfcc:
                try:
                    audio_response = requests.get(audio_url, timeout=30)
                    audio_response.raise_for_status()
                    audio_data = audio_response.content
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'  Warning: Could not download audio from Jamendo for {title}: {str(e)}')
                    )
                    # Continue without audio_data - song will use Jamendo URL
            
            # Upload audio to Supabase Storage if requested
            if upload_to_supabase and audio_data:
                try:
                    # Use song ID for storage path
                    song_id_str = str(song.id)
                    storage_path = f"songs/{song_id_str}/jamendo_{jamendo_id}.mp3"
                    
                    # Upload to Supabase Storage
                    upload_url = f"{supabase_url}/storage/v1/object/{storage_bucket}/{storage_path}"
                    headers = {
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'audio/mpeg',
                        'x-upsert': 'true',  # Overwrite if exists
                    }
                    
                    # Upload to Supabase
                    upload_response = requests.put(
                        upload_url,
                        data=audio_data,
                        headers=headers,
                        timeout=60
                    )
                    upload_response.raise_for_status()
                    
                    # Get public URL
                    final_audio_url = f"{supabase_url}/storage/v1/object/public/{storage_bucket}/{storage_path}"
                    
                    # Update song with Supabase Storage URL
                    song.audio_file_url = final_audio_url
                    song.save(update_fields=['audio_file_url'])
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'  Warning: Could not upload to Supabase Storage for {title}: {str(e)}. Using Jamendo URL instead.')
                    )
                    # Keep Jamendo URL if Supabase upload fails
                    pass

            # Process MFCC analysis if not skipped
            # Use the audio_data we already downloaded (avoids re-downloading and Supabase Storage issues)
            if not skip_mfcc and audio_data:
                try:
                    import tempfile
                    tmp_file_path = None
                    
                    try:
                        # Write audio_data to temporary file for MFCC analysis
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                            tmp_file.write(audio_data)
                            tmp_file_path = tmp_file.name
                        
                        # Process MFCC
                        result = process_track_mfcc(tmp_file_path, return_duration=True)
                        if result:
                            mfcc_vector, extracted_duration = result
                            Song.objects.filter(id=song.id).update(
                                mfcc_vector=mfcc_vector,
                                duration=extracted_duration
                            )
                    finally:
                        # Clean up temporary file
                        if tmp_file_path:
                            try:
                                os.unlink(tmp_file_path)
                            except:
                                pass
                except Exception as e:
                    # MFCC analysis failed, but song is still imported
                    self.stdout.write(
                        self.style.WARNING(f'  Warning: MFCC analysis failed for {title}: {str(e)}')
                    )

            return 'imported'

        except Exception as e:
            import traceback
            self.stdout.write(self.style.ERROR(f'  Error details: {traceback.format_exc()}'))
            return 'error'
