import librosa
import numpy as np
import os

def process_track_mfcc(file_path, n_mfcc=13, duration=30):
    """
    Loads an audio file and calculates Mel-frequency cepstral coefficients (MFCCs).
    
    Args:
        file_path (str): Path to the audio file.
        n_mfcc (int): Number of MFCCs to return.
        duration (int): Duration in seconds to load (to save memory/time). None for full.
        
    Returns:
        list: A list of lists representing the MFCC matrix (time steps x features).
    """
    try:
        # Load audio file
        # y: audio time series, sr: sampling rate
        y, sr = librosa.load(file_path, duration=duration)
        
        # Calculate MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        
        # MFCC is a numpy array of shape (n_mfcc, time_steps)
        # Transpose it to (time_steps, n_mfcc) if preferred, or keep as is.
        # We convert to list for JSON serialization.
        return mfcc.tolist()
        
    except Exception as e:
        print(f"Error processing audio: {e}")
        return None