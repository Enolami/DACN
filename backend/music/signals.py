"""
Django signals for automatic music processing.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Song
from .utils import process_track_mfcc, extract_duration


@receiver(post_save, sender=Song)
def auto_process_song(sender, instance, created, **kwargs):
    """
    Automatically trigger MFCC analysis and duration extraction when a song is created.
    This signal handler ensures that any song with an audio file gets processed,
    regardless of how it was created (upload, import, etc.).
    
    Args:
        sender: The model class (Song)
        instance: The actual instance being saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    # Only process new songs or songs that don't have MFCC vector yet
    # Skip if already has MFCC vector (was processed in view)
    if not created and instance.mfcc_vector:
        return
    
    # Skip if already has duration and MFCC (fully processed)
    if instance.mfcc_vector and instance.duration:
        return
    
    # Only process if we have an audio file
    if not instance.audio_file:
        return
    
    # Skip if already processing (to avoid infinite loops)
    if hasattr(instance, '_processing'):
        return
    
    try:
        # Mark as processing to avoid recursion
        instance._processing = True
        
        file_path = instance.audio_file.path
        
        # Try to process MFCC and extract duration together
        result = process_track_mfcc(file_path, return_duration=True)
        
        if result:
            mfcc_vector, duration = result
            # Update without triggering signal again
            Song.objects.filter(id=instance.id).update(
                mfcc_vector=mfcc_vector,
                duration=duration
            )
        else:
            # If MFCC fails, at least try to extract duration
            duration = extract_duration(file_path)
            if duration:
                Song.objects.filter(id=instance.id).update(duration=duration)
                
    except Exception as e:
        # Log error but don't fail the save
        print(f"Warning: Auto-processing failed for song {instance.id}: {e}")
        import traceback
        traceback.print_exc()
        
        # Still try to extract duration as fallback
        try:
            if instance.audio_file:
                file_path = instance.audio_file.path
                duration = extract_duration(file_path)
                if duration and not instance.duration:
                    Song.objects.filter(id=instance.id).update(duration=duration)
        except Exception as duration_error:
            print(f"Warning: Duration extraction also failed: {duration_error}")
    finally:
        # Clean up processing flag
        if hasattr(instance, '_processing'):
            delattr(instance, '_processing')
