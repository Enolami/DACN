from django.db import models
from django.conf import settings

class Track(models.Model):
    """
    Model to store uploaded music tracks and their analysis data.
    """
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255, blank=True)
    audio_file = models.FileField(upload_to='tracks/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Storing MFCC as JSON. For production with large datasets, 
    # consider storing this in a binary file (e.g., .npy) or a NoSQL store.
    mfcc_data = models.JSONField(null=True, blank=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.uploader.username}"