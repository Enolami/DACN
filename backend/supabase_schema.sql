-- Supabase Database Schema for Music App
-- Run this script in Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ARTISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS artist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_name VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    jamendo_artist_id VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_jamendo_artist_id UNIQUE (jamendo_artist_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_jamendo_id ON artist(jamendo_artist_id) WHERE jamendo_artist_id IS NOT NULL;

-- ============================================
-- ALBUMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS album (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artist(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    release_date TIMESTAMPTZ,
    cover_pic_url VARCHAR(500),
    cover_pic_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_artist_id ON album(artist_id);

-- ============================================
-- SONGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS song (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    album_id UUID REFERENCES album(id) ON DELETE SET NULL,
    duration INTEGER DEFAULT 0,
    audio_file_url VARCHAR(500),
    jamendo_id VARCHAR(100),
    mfcc_vector JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_song_album_id ON song(album_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_song_jamendo_id ON song(jamendo_id) WHERE jamendo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_song_mfcc_vector ON song USING GIN(mfcc_vector);

-- ============================================
-- PLAYLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS playlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_owner_id ON playlist(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlist_is_public ON playlist(is_public);

-- ============================================
-- PLAYLIST SONGS JOIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS playlistsong (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlist(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES song(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_playlist_song UNIQUE (playlist_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_playlistsong_playlist_id ON playlistsong(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlistsong_song_id ON playlistsong(song_id);

-- ============================================
-- LIKED SONGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS likedsong (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES song(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_liked_song UNIQUE (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_likedsong_user_id ON likedsong(user_id);
CREATE INDEX IF NOT EXISTS idx_likedsong_song_id ON likedsong(song_id);

-- ============================================
-- FOLLOWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follower (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artist(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_follow_artist UNIQUE (user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_follower_user_id ON follower(user_id);
CREATE INDEX IF NOT EXISTS idx_follower_artist_id ON follower(artist_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE artist ENABLE ROW LEVEL SECURITY;
ALTER TABLE album ENABLE ROW LEVEL SECURITY;
ALTER TABLE song ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlistsong ENABLE ROW LEVEL SECURITY;
ALTER TABLE likedsong ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all for service role" ON artist;
DROP POLICY IF EXISTS "Enable all for service role" ON album;
DROP POLICY IF EXISTS "Enable all for service role" ON song;
DROP POLICY IF EXISTS "Enable all for service role" ON playlist;
DROP POLICY IF EXISTS "Enable all for service role" ON playlistsong;
DROP POLICY IF EXISTS "Enable all for service role" ON likedsong;
DROP POLICY IF EXISTS "Enable all for service role" ON follower;

-- Allow service role to do everything (for migrations and admin operations)
CREATE POLICY "Enable all for service role" ON artist
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON album
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON song
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON playlist
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON playlistsong
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON likedsong
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for service role" ON follower
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_artist_updated_at ON artist;
CREATE TRIGGER update_artist_updated_at
    BEFORE UPDATE ON artist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_album_updated_at ON album;
CREATE TRIGGER update_album_updated_at
    BEFORE UPDATE ON album
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_song_updated_at ON song;
CREATE TRIGGER update_song_updated_at
    BEFORE UPDATE ON song
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlist_updated_at ON playlist;
CREATE TRIGGER update_playlist_updated_at
    BEFORE UPDATE ON playlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('artist', 'album', 'song', 'playlist', 'playlistsong', 'likedsong', 'follower');
