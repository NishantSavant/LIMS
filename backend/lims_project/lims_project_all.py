# lims_project/settings.py
import os
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-lims-2025-change-production')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Local apps
    'core',
    'accounts',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lims_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lims_project.wsgi.application'

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "lims_db",
        "USER": "postgres",
        "PASSWORD": "psychopath@Savant01",
        "HOST": "localhost",
        "PORT": "5432",
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'backend/report/'      # ← Maps /reports/ to backend/reports/
MEDIA_ROOT = BASE_DIR / 'reports' 

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'core.CustomUser'

# DRF Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
# lims_project/settings.py ends here

# lims_project/asgi.py
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lims_project.settings')

application = get_asgi_application()
# lims_project/asgi.py ends here

# lims_project/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView  # add
from core import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("core.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),  # new
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),  # optional
    path('api/doctor/patient-request/', views.patient_request_doctor, name='patient_request_doctor'),
    path('api/doctor/pending-requests/', views.doctor_pending_requests, name='doctor_pending_requests'),
    path('api/doctor/patient-request/<int:link_id>/accept/', views.accept_patient_request, name='accept_patient_request'),
    path('api/patient/my-doctors/', views.patient_my_doctors),
    path('api/doctor/my-patients/', views.doctor_my_patients),
    path('api/doctor/available-doctors/', views.available_doctors, name='available_doctors'),
    path('api/lab/available-labs/', views.available_labs, name='available_labs'),
    path('api/patient/lab-request/', views.patient_lab_request, name='patient_lab_request'),
    path('api/patient/lab-requests/', views.patient_lab_requests, name='patient_lab_requests'),
    path('api/lab/patients/search/', views.lab_patient_search, name='lab_patient_search'),
    path('api/lab/upload-report/', views.lab_upload_report, name='lab_upload_report'),
    path('api/lab/patient/lab-requests/', views.lab_patient_requests, name  ='lab-patient-requests'),
    path('api/patient/lab-reports/', views.patient_lab_reports, name='patient-lab-reports'),
    path('api/lab/doctor/lab-reports/', views.doctor_lab_reports, name='doctor-lab-reports'),
]
if settings.DEBUG:
    urlpatterns += static('backend/report/', document_root=settings.MEDIA_ROOT)
# lims_project/urls.py ends here

# lims_project/wsgi.py
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lims_project.settings')

application = get_wsgi_application()
# lims_project/wsgi.py ends here