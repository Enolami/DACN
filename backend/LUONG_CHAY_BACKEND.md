# 📚 Giải Thích Luồng Chạy Backend Django

## 🎯 Tổng Quan Kiến Trúc

Backend này sử dụng **Django Framework** với các thành phần chính:
- **Database**: PostgreSQL
- **Authentication**: Django AllAuth (hỗ trợ đăng nhập bằng Google, Facebook, GitHub)
- **Custom User Model**: Mở rộng từ AbstractUser
- **WSGI/ASGI**: Xử lý HTTP requests

---

## 🔄 Luồng Xử Lý Request (Request Flow)

### 1. **Khởi Động Server**

```python
# Khi chạy: python manage.py runserver
# File: manage.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
```

**Quá trình khởi động:**
1. Django load `settings.py` để cấu hình
2. Kết nối database PostgreSQL
3. Load các apps trong `INSTALLED_APPS`
4. Khởi tạo middleware stack
5. Load URL routing từ `ROOT_URLCONF`

---

### 2. **Khi Client Gửi Request**

```
Client → WSGI Server → Middleware → URL Router → View → Model → Database
                                                    ↓
                                              Response ← Template
```

---

## 🔍 Chi Tiết Từng Bước

### **BƯỚC 1: Request Đến Django**

Khi có HTTP request đến:
```
GET http://localhost:8000/accounts/signup/
```

---

### **BƯỚC 2: Middleware Processing** (settings.py - dòng 53-63)

Django xử lý request qua các middleware theo thứ tự:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',      # Bảo mật
    'django.contrib.sessions.middleware.SessionMiddleware', # Quản lý session
    'django.middleware.common.CommonMiddleware',          # Xử lý chung
    'django.middleware.csrf.CsrfViewMiddleware',         # CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Xác thực
    'django.contrib.messages.middleware.MessageMiddleware',    # Messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # Clickjacking
    'allauth.account.middleware.AccountMiddleware',       # AllAuth
]
```

**Vai trò từng middleware:**
- **SecurityMiddleware**: Thêm security headers
- **SessionMiddleware**: Tạo/quản lý session cookie
- **CsrfViewMiddleware**: Kiểm tra CSRF token
- **AuthenticationMiddleware**: Đính kèm `request.user`
- **AccountMiddleware**: Xử lý AllAuth authentication

---

### **BƯỚC 3: URL Routing** (backend/urls.py)

```python
urlpatterns = [
    path('admin/', admin.site.urls),                    # Django Admin
    path('', home_view, name='home'),                   # Home page
    path('accounts/', include('user.urls')),            # User app URLs
    path('accounts/', include('django.contrib.auth.urls')), # Auth URLs
    path('accounts/', include('allauth.urls')),         # AllAuth URLs
]
```

**Request `/accounts/signup/` sẽ được route đến:**
- Kiểm tra pattern `accounts/` → match!
- Include `user.urls` → tiếp tục routing

---

### **BƯỚC 4: App-Level URL Routing** (user/urls.py)

```python
urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
```

**Request `/accounts/signup/` match với:**
- Pattern `signup/` → Gọi `SignUpView.as_view()`

---

### **BƯỚC 5: View Processing** (user/views.py)

#### **SignUpView (Class-Based View)**

```python
class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'
```

**Luồng xử lý:**

1. **GET Request** (Hiển thị form):
   ```
   → CreateView.get()
   → Tạo form instance: CustomUserCreationForm()
   → Render template: registration/signup.html
   → Trả về HTML form
   ```

2. **POST Request** (Xử lý đăng ký):
   ```
   → CreateView.post()
   → Validate form: form.is_valid()
   → Lưu user vào database: form.save()
   → Redirect đến: success_url (login page)
   ```

---

### **BƯỚC 6: Form Validation** (user/forms.py)

```python
class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email')
```

**Quá trình validate:**
1. Kiểm tra username đã tồn tại?
2. Kiểm tra email hợp lệ?
3. Kiểm tra password (từ `UserCreationForm`):
   - Minimum length
   - Common password
   - Numeric-only password
4. Nếu hợp lệ → lưu vào database

---

### **BƯỚC 7: Model & Database** (user/models.py)

```python
class User(AbstractUser):
    pass  # Mở rộng AbstractUser với các field: username, email, password...

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
```

**Khi tạo User mới:**

1. **Lưu User vào Database:**
   ```sql
   INSERT INTO user_user (username, email, password, ...) 
   VALUES (...)
   ```

2. **Signal Triggered** (models.py - dòng 18-25):
   ```python
   @receiver(post_save, sender=User)
   def create_user_profile(sender, instance, created, **kwargs):
       if created:
           Profile.objects.create(user=instance)
   ```
   → Tự động tạo Profile cho User mới

---

### **BƯỚC 8: Database Connection** (settings.py - dòng 88-97)

```python
DATABASES = {
    "default": {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),        # Từ file .env
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}
```

**Kết nối PostgreSQL:**
- Sử dụng `python-decouple` để đọc config từ file `.env`
- Django ORM tự động quản lý connection pool

---

### **BƯỚC 9: Response**

**Sau khi xử lý xong:**
1. **Redirect** (nếu thành công): 
   ```python
   return redirect('login')  # → /accounts/login/
   ```

2. **Render Template** (nếu GET request):
   ```python
   return render(request, 'registration/signup.html', {'form': form})
   ```

---

## 🔐 Authentication Flow

### **Đăng Nhập (Login)**

**URL:** `/accounts/login/` (django.contrib.auth.urls)

**Luồng:**
1. User submit form với username + password
2. `AuthenticationMiddleware` kiểm tra credentials
3. Nếu hợp lệ:
   - Tạo session
   - Set `request.user = User object`
   - Redirect đến `LOGIN_REDIRECT_URL = '/accounts/dashboard/'`
4. Nếu không hợp lệ:
   - Hiển thị error message
   - Form login lại

### **AllAuth Social Login** (Google, Facebook, GitHub)

**Luồng OAuth:**
1. User click "Login with Google"
2. Redirect đến Google OAuth
3. User xác nhận → Google redirect về callback URL
4. AllAuth xử lý token → Tạo/lấy User
5. Đăng nhập user → Redirect đến dashboard

---

## 📁 Cấu Trúc Thư Mục

```
backend/
├── backend/              # Django project config
│   ├── settings.py       # Cấu hình chính
│   ├── urls.py          # URL routing chính
│   ├── wsgi.py          # WSGI server entry point
│   └── asgi.py          # ASGI server entry point
│
├── user/                # Django app: User management
│   ├── models.py        # User & Profile models
│   ├── views.py         # SignUpView, DashboardView
│   ├── forms.py         # CustomUserCreationForm
│   ├── urls.py          # App-level URLs
│   └── admin.py         # Django admin config
│
├── templates/           # HTML templates
│   └── registration/
│       ├── login.html
│       ├── signup.html
│       └── dashboard.html
│
├── manage.py            # Django CLI utility
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables (DB config)
```

---

## 🔄 Ví Dụ Luồng Hoàn Chỉnh: Đăng Ký User

### **Scenario:** User đăng ký tài khoản mới

```
1. User truy cập: http://localhost:8000/accounts/signup/
   
2. Middleware xử lý request:
   - SecurityMiddleware → Thêm security headers
   - SessionMiddleware → Tạo session mới
   - CsrfViewMiddleware → Tạo CSRF token
   
3. URL Routing:
   - backend/urls.py → path('accounts/', include('user.urls'))
   - user/urls.py → path('signup/', SignUpView.as_view())
   
4. View xử lý (GET request):
   - SignUpView.get() được gọi
   - Tạo CustomUserCreationForm()
   - Render template: registration/signup.html
   - Trả về HTML form với CSRF token
   
5. User điền form và submit (POST request):
   - Form data: {username: "john", email: "john@example.com", password: "***"}
   
6. View xử lý (POST request):
   - SignUpView.post() được gọi
   - form.is_valid() → Kiểm tra validation
   
7. Form Validation:
   - Username chưa tồn tại? ✓
   - Email hợp lệ? ✓
   - Password đủ mạnh? ✓
   
8. Lưu vào Database:
   - form.save() → Tạo User object
   - INSERT INTO user_user (...) VALUES (...)
   
9. Signal Triggered:
   - post_save signal → create_user_profile()
   - Tạo Profile object: Profile.objects.create(user=user)
   
10. Redirect:
    - Redirect đến: reverse_lazy('login')
    - URL: /accounts/login/
    
11. Response trả về:
    - HTTP 302 Redirect → Browser tự động chuyển đến login page
```

---

## 🛠️ Các API Endpoints Hiện Tại

| URL Pattern | View | Mô Tả |
|------------|------|-------|
| `/` | `home_view` | Home page (redirect) |
| `/admin/` | Django Admin | Admin panel |
| `/accounts/signup/` | `SignUpView` | Đăng ký user mới |
| `/accounts/dashboard/` | `DashboardView` | Trang dashboard sau login |
| `/accounts/login/` | Django Auth | Đăng nhập |
| `/accounts/logout/` | Django Auth | Đăng xuất |
| `/accounts/password/reset/` | Django Auth | Reset password |
| `/accounts/social/...` | AllAuth | Social login (Google, Facebook, GitHub) |

---

## 🔗 Integration với Frontend

**Hiện tại:** Backend đang dùng Django templates (server-side rendering)

**Để tích hợp với React Frontend (SPA):**

1. **Tạo REST API** (sử dụng Django REST Framework):
   ```python
   # Cần thêm: djangorestframework vào INSTALLED_APPS
   # Tạo serializers, viewsets, routers
   ```

2. **CORS Configuration:**
   ```python
   # settings.py
   CORS_ALLOWED_ORIGINS = ['http://localhost:3000']  # React dev server
   ```

3. **API Endpoints:**
   ```
   POST /api/auth/signup/    # Đăng ký
   POST /api/auth/login/     # Đăng nhập
   GET  /api/user/profile/   # Lấy profile
   ```

---

## 📝 Lưu Ý Quan Trọng

1. **Environment Variables**: Cần file `.env` với:
   ```
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

2. **Migrations**: Sau khi thay đổi models:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Static Files**: Trong production cần collect static:
   ```bash
   python manage.py collectstatic
   ```

4. **Security**: 
   - Đổi `SECRET_KEY` trong production
   - Set `DEBUG = False` trong production
   - Cấu hình `ALLOWED_HOSTS`

---

## 🎯 Tóm Tắt Luồng Chạy

```
Request → Middleware → URL Router → View → Form/Model → Database
                                              ↓
                                    Template → Response
```

**Key Components:**
- **settings.py**: Cấu hình toàn bộ ứng dụng
- **urls.py**: Định tuyến URL đến views
- **views.py**: Xử lý logic business
- **models.py**: Định nghĩa database schema
- **forms.py**: Validate và xử lý form data
- **middleware**: Xử lý request/response trước/sau views

---

**📌 Kết luận:** Backend Django này sử dụng kiến trúc MVC (Model-View-Controller) với pattern rõ ràng, hỗ trợ authentication đầy đủ và sẵn sàng mở rộng thành REST API để tích hợp với React frontend.

