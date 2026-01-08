# 📱 TÓM TẮT FLOW UX - Music AI Application

## 🎯 TỔNG QUAN
Ứng dụng Music AI là một nền tảng streaming nhạc với giao diện hiện đại, hỗ trợ đăng nhập đa phương thức, quản lý thư viện nhạc, và trải nghiệm nghe nhạc với player đầy đủ tính năng.

---

## 🔐 PHẦN 1: AUTHENTICATION FLOW

### 1.1. Đăng Nhập (Login)
**Entry Point:** `LoginPage`
- **Email/Password Login:**
  - User nhập email + password
  - Submit → API call `/api/user/login/`
  - Thành công → Lưu token vào `localStorage` → Navigate đến `SubscriptionPage`
  - Thất bại → Hiển thị error message

- **Google Login:**
  - Click "Login with Google" → OAuth flow
  - Google redirect về → API call `/api/user/google-login/`
  - Thành công → Lưu token → Navigate đến `SubscriptionPage`

- **Facebook Login:**
  - Click "Login with Facebook" → Facebook OAuth
  - Thành công → API call → Lưu token → Navigate đến `SubscriptionPage`

- **Navigation Options:**
  - "Sign Up" → Navigate đến `SignUpPage`
  - "Forgot Password?" → Navigate đến `ForgotPasswordPage`

### 1.2. Đăng Ký (Sign Up)
**Entry Point:** `SignUpPage`
- User điền form: email, password, confirm password, first name
- Submit → API call `/api/user/signup/`
- Thành công → Navigate đến `SubscriptionPage`
- "Already have an account?" → Navigate về `LoginPage`

### 1.3. Quên Mật Khẩu (Forgot Password)
**Entry Point:** `ForgotPasswordPage`
- User nhập email
- Submit → Gửi reset link
- Navigate đến `ResetPasswordPage` (mode: "verify")
- "Back to Login" → Navigate về `LoginPage`

### 1.4. Xác Thực & Đặt Lại Mật Khẩu
**Entry Point:** `ResetPasswordPage`
- **Mode: "verify":**
  - User nhập verification code
  - Submit → Navigate đến mode "reset"
- **Mode: "reset":**
  - User nhập password mới
  - Submit → Reset thành công → Navigate về `LoginPage`

### 1.5. Chọn Gói Đăng Ký (Subscription)
**Entry Point:** `SubscriptionPage`
- User chọn plan: **Free** hoặc **Premium**
- Click "Select Plan" → Navigate đến `HomePage` (main app)

---

## 🏠 PHẦN 2: MAIN APPLICATION FLOW

### 2.1. Layout Chính
**Cấu trúc:** 3 cột + Music Player bar
```
┌─────────────┬──────────────────────┬─────────────┐
│ LeftSidebar │   Main Content       │ RightPanel  │
│             │   (TopNavigation +   │             │
│             │    Page Content)     │             │
├─────────────┴──────────────────────┴─────────────┤
│           MusicPlayer (Bottom Bar)              │
└─────────────────────────────────────────────────┘
```

### 2.2. LeftSidebar Navigation
**Các mục chính:**
- **Home** → Navigate đến `HomePage`
- **Your Library** (Collapsible):
  - **Playlists** → `LibraryPage` (category: "playlists")
  - **Songs** → `LibraryPage` (category: "songs")
  - **Artists** → `LibraryPage` (category: "artists")
  - **Albums** → `LibraryPage` (category: "albums")

### 2.3. TopNavigation
- Search bar (placeholder)
- User profile button → Navigate đến `ProfilePage`

### 2.4. RightPanel
**2 tabs:**
- **Queue:** Danh sách "Up Next" (các bài hát sắp phát)
- **History:** Danh sách "Recently Played"
- Click vào bất kỳ bài hát → Navigate đến `SongDetail`

---

## 🎵 PHẦN 3: CONTENT NAVIGATION FLOW

### 3.1. HomePage
**Tabs:** All | Music | Radio

**Sections:**
- **Trending Now:** Grid playlist cards
- **AI Personalized:** Playlist cards với AI badge
- **Recommended Artists:** Artist cards
- **Popular Radios:** Radio station cards

**Interactions:**
- Click **PlaylistCard** → Navigate đến `PlaylistDetail`
- Click **ArtistCard** → Navigate đến `ArtistProfile`
- Click **Radio card** → (TBD - có thể là radio player)

### 3.2. LibraryPage
**Categories:** playlists | songs | artists | albums
- Hiển thị danh sách theo category đã chọn
- Click item → Navigate đến detail page tương ứng

### 3.3. PlaylistDetail
**Components:**
- Header: Playlist image, title, description, action buttons (Play, Like, Download, Share, More)
- Track Table: Danh sách bài hát với controls
- Suggested Playlists: Grid playlist cards ở cuối

**Interactions:**
- Click **Play** → Start playing playlist (update `currentSong`)
- Click track trong table → Navigate đến `SongDetail`
- Click **Suggested Playlist** → Navigate đến `PlaylistDetail` khác
- Click **Artist name** → Navigate đến `ArtistProfile`

### 3.4. SongDetail
**Components:**
- Song info: Title, artist, album, artwork
- Action buttons: Play, Like, Download, Share, Add to Playlist
- Related songs/artists

**Interactions:**
- Click **Play** → Update `currentSong` → Start playing
- Click **Artist name** → Navigate đến `ArtistProfile`
- Click **Album** → (TBD - có thể là album detail)

### 3.5. ArtistProfile
**Components:**
- Artist header: Avatar, name, follow button, stats
- Popular tracks
- Albums
- Related artists

**Interactions:**
- Click **Follow** → Toggle follow status
- Click **Track** → Navigate đến `SongDetail`
- Click **Album** → (TBD)
- Click **Related Artist** → Navigate đến `ArtistProfile` khác

### 3.6. ProfilePage
**Components:**
- User info: Avatar, name, stats
- User's playlists: Grid playlist cards
- User's liked songs

**Interactions:**
- Click **Playlist** → Navigate đến `PlaylistDetail`
- Click **Song** → Navigate đến `SongDetail`

---

## 🎧 PHẦN 4: MUSIC PLAYER FLOW

### 4.1. MusicPlayer (Bottom Bar)
**Luôn hiển thị** ở tất cả main views (home, artist-profile, profile, playlist, song)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Song Info + Waveform] │ [Controls] │ [Volume + Queue + Max] │
└─────────────────────────────────────────────────────────────┘
```

**Left Section:**
- Song title + artist name
- Waveform animation
- **Click vào area này** → Navigate đến `SongDetail`

**Center Section:**
- Shuffle button
- Skip Back button
- **Play/Pause button** → Toggle playback
- Skip Forward button
- Repeat button
- Progress slider → Seek to time position

**Right Section:**
- **Maximize button** → Open `NowPlayingFullscreen`
- Queue button (TBD - có thể mở queue panel)
- Volume slider → Adjust volume

### 4.2. NowPlayingFullscreen
**Trigger:** Click Maximize button trên `MusicPlayer`

**Components:**
- **VinylDisc:** Đĩa xoay tròn với album artwork (size: 500px)
  - Xoay khi `isPlaying = true`
  - Dừng khi `isPlaying = false`
- Track info: Title, artist, genre badges
- Full playback controls: Play/Pause, Skip, Shuffle, Repeat
- Progress bar với time display
- Volume control
- Action buttons: Like, Download, Share, Add to Playlist
- Lyrics panel (toggle)
- Artist panel (toggle)
- Close button (ChevronDown) → Close fullscreen

**State Management:**
- Nhận `currentSong` từ `App.tsx` để hiển thị đúng thông tin
- `isPlaying` state riêng (có thể sync với `MusicPlayer`)

---

## 🔄 PHẦN 5: STATE MANAGEMENT & DATA FLOW

### 5.1. App.tsx State
```typescript
- currentView: 'login' | 'signup' | 'forgot-password' | ... | 'home' | ...
- currentPage: 'home' | 'library' | 'liked' | 'artists' | 'albums' | ...
- selectedArtist: Artist object
- selectedPlaylist: Playlist object
- selectedSong: Song object
- showNowPlaying: boolean (controls fullscreen)
- currentSong: Song object (shared across app)
```

### 5.2. Navigation Handlers
- `handleNavigate(page, data?)`: Navigate đến các detail pages
- `handleSidebarNavigate(page)`: Navigate từ sidebar
- `handleExpandPlayer()`: Mở `NowPlayingFullscreen`

### 5.3. Current Song Flow
1. User click Play trên bất kỳ track nào
2. `currentSong` state được update trong `App.tsx`
3. `MusicPlayer` nhận `currentSong` prop → Hiển thị thông tin
4. `NowPlayingFullscreen` nhận `currentSong` prop → Hiển thị artwork và info

---

## 📊 PHẦN 6: USER JOURNEY EXAMPLES

### Journey 1: Khám Phá & Nghe Nhạc
1. Login → Subscription → Home
2. Browse `HomePage` → Click playlist "Viral Hits 2025"
3. `PlaylistDetail` mở → Click Play button
4. `currentSong` update → `MusicPlayer` hiển thị bài hát đầu tiên
5. Click Maximize → `NowPlayingFullscreen` mở với đĩa xoay
6. Click track trong playlist → Navigate đến `SongDetail`
7. Click artist name → Navigate đến `ArtistProfile`

### Journey 2: Quản Lý Thư Viện
1. Home → Click "Your Library" → "Playlists"
2. `LibraryPage` hiển thị danh sách playlists
3. Click playlist → `PlaylistDetail` mở
4. Browse tracks → Click track → `SongDetail` mở
5. Click "Add to Playlist" → (TBD - modal chọn playlist)

### Journey 3: Tìm Kiếm & Khám Phá
1. Home → Click search bar (TBD - search functionality)
2. Browse recommended artists → Click artist
3. `ArtistProfile` mở → Click "Follow"
4. Click popular track → `SongDetail` mở
5. Click Play → Music starts playing

---

## 🎨 PHẦN 7: UI/UX FEATURES

### 7.1. Animations
- **Framer Motion:** Hover effects, transitions, page animations
- **VinylDisc:** Spinning animation khi playing
- **WaveformAnimation:** Visual feedback trong `MusicPlayer`

### 7.2. Responsive Design
- Fixed layout với 3-column structure
- Music Player bar luôn ở bottom
- Fullscreen mode cho `NowPlayingFullscreen`

### 7.3. Visual Feedback
- Hover states trên tất cả interactive elements
- Active states cho navigation items
- Loading states cho API calls
- Error messages cho failed operations

---

## 🔧 PHẦN 8: TECHNICAL NOTES

### 8.1. Routing
- Single Page Application (SPA)
- State-based routing (không dùng React Router)
- View switching thông qua `currentView` state

### 8.2. API Integration
- Authentication: `/api/user/login/`, `/api/user/signup/`, `/api/user/google-login/`
- Token storage: `localStorage.getItem('authToken')`
- API calls: `frontend/src/services/api.ts`

### 8.3. Component Hierarchy
```
App
├── LoginPage / SignUpPage / SubscriptionPage (auth flow)
└── Main App (after auth)
    ├── LeftSidebar
    ├── Main Content Area
    │   ├── TopNavigation
    │   └── HomePage / LibraryPage / PlaylistDetail / SongDetail / ArtistProfile / ProfilePage
    ├── RightPanel
    └── MusicPlayer
    └── NowPlayingFullscreen (overlay)
```

---

## ✅ CHECKLIST: Các Tính Năng Đã Implement

- [x] Authentication flow (Login, Sign Up, Forgot Password, Reset Password)
- [x] Subscription selection
- [x] Home page với tabs và content sections
- [x] Library page với categories
- [x] Playlist detail page
- [x] Song detail page
- [x] Artist profile page
- [x] User profile page
- [x] Music Player bar (persistent)
- [x] Now Playing Fullscreen với VinylDisc
- [x] Navigation flow giữa các pages
- [x] Right Panel (Queue & History)
- [x] Left Sidebar navigation
- [x] Top Navigation bar

---

## 🚀 CÁC TÍNH NĂNG CẦN PHÁT TRIỂN (TBD)

- [ ] Search functionality
- [ ] Album detail page
- [ ] Radio player
- [ ] Queue management (reorder, remove)
- [ ] Playlist creation/editing
- [ ] Social features (sharing, following)
- [ ] Offline mode
- [ ] Playback history tracking
- [ ] Recommendations engine
- [ ] AI playlist generation

---

**Tài liệu này được tạo tự động dựa trên codebase hiện tại.**

