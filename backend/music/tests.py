from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch, MagicMock
from .models import Track

User = get_user_model()

class MusicAppTests(APITestCase):

    def setUp(self):
        # Create a user and force authentication
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        
        # Create a dummy MP3 file for testing
        self.audio_content = b'fake_audio_bytes'
        self.audio_file = SimpleUploadedFile("test_song.mp3", self.audio_content, content_type="audio/mpeg")

    def test_upload_track(self):
        """Test uploading a local audio file."""
        url = reverse('track-list-create')
        data = {
            'title': 'My Test Song',
            'audio_file': self.audio_file
        }
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Track.objects.count(), 1)
        self.assertEqual(Track.objects.get().title, 'My Test Song')

    @patch('music.utils.librosa')
    def test_trigger_mfcc_analysis(self, mock_librosa):
        """Test triggering MFCC analysis (Mocking librosa to avoid heavy processing)."""
        # 1. Setup existing track
        track = Track.objects.create(uploader=self.user, title="Analyze Me", audio_file=self.audio_file)
        
        # 2. Mock librosa output
        mock_librosa.load.return_value = (MagicMock(), 22050) # y, sr
        mock_librosa.feature.mfcc.return_value.tolist.return_value = [[0.1, 0.2], [0.3, 0.4]] # Fake MFCC matrix
        
        # 3. Call API
        url = reverse('track-analyze', args=[track.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Check Database update
        track.refresh_from_db()
        self.assertTrue(track.is_processed)
        self.assertIsNotNone(track.mfcc_data)

    @patch('music.views.requests.get')
    def test_jamendo_search(self, mock_get):
        """Test searching Jamendo (Mocking the external API)."""
        # Mock response from Jamendo
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [{"name": "Jamendo Rock", "id": "123"}]
        }
        mock_get.return_value = mock_response

        url = reverse('jamendo-search')
        response = self.client.get(url, {'q': 'Rock'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['name'], 'Jamendo Rock')

    @patch('music.views.requests.get')
    def test_jamendo_import(self, mock_get):
        """Test importing a song from Jamendo."""
        # We need to mock TWO calls: 
        # 1. The metadata fetch
        # 2. The file download
        
        # Setup mocks
        mock_meta_resp = MagicMock()
        mock_meta_resp.status_code = 200
        mock_meta_resp.json.return_value = {
            "results": [{"name": "Imp Song", "artist_name": "Artist", "audio": "http://fake.url/song.mp3"}]
        }
        
        mock_audio_resp = MagicMock()
        mock_audio_resp.status_code = 200
        mock_audio_resp.content = b'fake_downloaded_audio_bytes'

        # side_effect allows different returns for sequential calls
        mock_get.side_effect = [mock_meta_resp, mock_audio_resp]

        url = reverse('jamendo-import')
        response = self.client.post(url, {'id': '999'})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Track.objects.filter(title__contains="Imp Song").exists())

    def test_stream_audio(self):
        """Test the streaming endpoint returns a streaming response."""
        track = Track.objects.create(uploader=self.user, title="Stream Me", audio_file=self.audio_file)
        url = reverse('stream-audio', args=[track.id])
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'audio/mpeg')
        self.assertTrue(response.streaming)