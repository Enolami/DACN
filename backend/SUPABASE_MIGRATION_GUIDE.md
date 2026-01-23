# Supabase Migration Guide

This guide explains how to migrate your music data from the local database to Supabase for deployment.

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Supabase Credentials**:
   - **Project URL**: Format is `https://[project-ref].supabase.co` (NOT the dashboard URL)
     - Find it in: Project Settings > API > Project URL
     - Example: `https://ybeegptxykdqbiehflpl.supabase.co`
   - **Service Role Key**: Found in Project Settings > API > service_role key (secret)
   - **Database Connection String**: Found in Project Settings > Database > Connection string

## Setup

### 1. Install Required Packages

The required packages are already in `requirements.txt`:
- `psycopg2` - PostgreSQL adapter
- `requests` - For Supabase REST API calls

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory or set environment variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Note**: Replace `[PASSWORD]` with your database password and `[PROJECT-REF]` with your project reference.

## Migration Methods

### Method 1: Export to JSON (Recommended for First Migration)

This method exports all data to a JSON file that can be imported later.

#### Step 1: Export Data

```bash
cd backend
python manage.py export_to_supabase --output supabase_export.json
```

**Options:**
- `--include-files`: Include audio files as base64 in the export (large file size)
- `--upload-to-supabase-storage`: Upload audio files directly to Supabase Storage during export
- `--supabase-url`: Supabase project URL
- `--supabase-key`: Supabase service role key
- `--storage-bucket`: Storage bucket name (default: `audio-files`)

**Example with file upload:**
```bash
python manage.py export_to_supabase \
  --output supabase_export.json \
  --upload-to-supabase-storage \
  --supabase-url https://xxxxx.supabase.co \
  --supabase-key your-service-key \
  --storage-bucket audio-files
```

#### Step 2: Import to Supabase

After setting up your Supabase database schema, import the JSON file:

```bash
python manage.py import_from_supabase --input supabase_export.json
```

**Options:**
- `--skip-existing`: Skip songs that already exist
- `--download-files`: Download audio files from URLs
- `--download-from-base64`: Save audio files from base64 encoded data

### Method 2: Direct Import to Supabase (For Ongoing Sync)

This method directly imports data to Supabase using REST API.

```bash
python manage.py import_to_supabase \
  --supabase-url https://xxxxx.supabase.co \
  --supabase-key your-service-key \
  --supabase-db-url postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres \
  --upload-storage \
  --storage-bucket audio-files \
  --skip-existing
```

## Supabase Database Setup

### 1. Create Tables in Supabase

Run the following SQL in Supabase SQL Editor to create the required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase auth.users is already created)
-- We'll reference it via user_id UUID

-- Artists table
CREATE TABLE IF NOT EXISTS artist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stage_name VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Albums table
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

-- Songs table
CREATE TABLE IF NOT EXISTS song (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    album_id UUID REFERENCES album(id) ON DELETE SET NULL,
    duration INTEGER DEFAULT 0,
    audio_file_url VARCHAR(500),
    jamendo_id VARCHAR(100) UNIQUE,
    mfcc_vector JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_song_jamendo_id ON song(jamendo_id);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PlaylistSongs join table
CREATE TABLE IF NOT EXISTS playlistsong (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlist(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES song(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, song_id)
);

-- LikedSongs table
CREATE TABLE IF NOT EXISTS likedsong (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES song(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- Followers table
CREATE TABLE IF NOT EXISTS follower (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artist(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE artist ENABLE ROW LEVEL SECURITY;
ALTER TABLE album ENABLE ROW LEVEL SECURITY;
ALTER TABLE song ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlistsong ENABLE ROW LEVEL SECURITY;
ALTER TABLE likedsong ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower ENABLE ROW LEVEL SECURITY;

-- Create policies (example: allow all for service role)
-- Adjust based on your security requirements
CREATE POLICY "Enable all for service role" ON artist FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON album FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON song FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON playlist FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON playlistsong FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON likedsong FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON follower FOR ALL USING (true);
```

### 2. Create Storage Bucket for Audio Files

1. Go to Supabase Dashboard > Storage
2. Create a new bucket named `audio-files` (or your preferred name)
3. Set it to **Public** if you want direct access, or **Private** with RLS policies
4. Configure CORS if needed for your frontend domain

## Audio File Storage Options

### Option 1: Supabase Storage (Recommended)

Upload audio files to Supabase Storage during export:

```bash
python manage.py export_to_supabase \
  --output export.json \
  --upload-to-supabase-storage \
  --supabase-url https://xxxxx.supabase.co \
  --supabase-key your-key \
  --storage-bucket audio-files
```

**Pros:**
- Files are stored in Supabase
- Easy to manage and scale
- Direct URL access

**Cons:**
- Storage costs apply
- Requires Supabase Storage setup

### Option 2: Keep Using Cloudinary

If you're already using Cloudinary for album covers, you can continue using it for audio files. The export will preserve the `audio_file_url` field.

### Option 3: Local Files with Base64

Include files in the JSON export:

```bash
python manage.py export_to_supabase --output export.json --include-files
```

**Note**: This creates very large JSON files. Only use for small datasets.

## Updating Django Settings for Supabase

After migration, update `backend/backend/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('SUPABASE_DB_NAME', default='postgres'),
        'USER': config('SUPABASE_DB_USER', default='postgres'),
        'PASSWORD': config('SUPABASE_DB_PASSWORD'),
        'HOST': config('SUPABASE_DB_HOST'),
        'PORT': config('SUPABASE_DB_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}
```

## Verification

After import, verify the data:

1. Check Supabase Dashboard > Table Editor
2. Verify row counts match your local database
3. Test audio file URLs if using Supabase Storage
4. Test API endpoints with Supabase database

## Troubleshooting

### Issue: "Table does not exist"
- **Solution**: Run the SQL schema creation script in Supabase SQL Editor

### Issue: "Permission denied"
- **Solution**: Check RLS policies and ensure service role key has proper permissions

### Issue: "Audio files not accessible"
- **Solution**: 
  - Verify storage bucket is public or has proper RLS policies
  - Check CORS settings in Supabase Storage
  - Verify file uploads completed successfully

### Issue: "Foreign key constraint fails"
- **Solution**: Ensure data is imported in order: Users → Artists → Albums → Songs → Playlists

## Next Steps

1. Update your production Django settings to use Supabase database
2. Configure environment variables in your deployment platform
3. Update frontend API URLs if needed
4. Test all functionality with Supabase database
5. Set up automated backups in Supabase

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase REST API](https://supabase.com/docs/reference/javascript/introduction)
