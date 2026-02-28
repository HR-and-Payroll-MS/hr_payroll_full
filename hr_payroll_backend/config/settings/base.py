"""
Base Django settings for HR & Payroll Management System.
"""
import os
import sys
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse
from dotenv import load_dotenv

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables from .env folder
ENVIRONMENT = os.getenv('DJANGO_ENV', 'local').lower()
ENV_DIR = BASE_DIR / '.env' / f'.{ENVIRONMENT}'
load_dotenv(ENV_DIR / '.django')
load_dotenv(ENV_DIR / '.postgres')

# Security settings
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-hr-payroll-dev-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'djoser',
    'corsheaders',

    # Local apps
    'apps.users',
    'apps.employees',
    'apps.departments',
    'apps.attendance',
    'apps.leaves',
    'apps.notifications',
    'apps.announcements',
    'apps.policies',
    'apps.payroll',
    'apps.efficiency',
    'apps.company',
    'apps.support',
    'apps.chat',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

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

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database
IS_TESTING = (
    os.getenv('PYTEST_CURRENT_TEST') is not None
    or any(arg in ('test', 'pytest') or arg.endswith('pytest') for arg in sys.argv)
)
DB_ENGINE = os.getenv('DB_ENGINE')
if not DB_ENGINE:
    DB_ENGINE = 'sqlite' if IS_TESTING else 'postgres'
DB_ENGINE = DB_ENGINE.lower()
if DB_ENGINE == 'sqlite':
    SQLITE_DB_NAME = os.getenv('SQLITE_DB_NAME', 'data/db.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / SQLITE_DB_NAME,
        }
    }
else:
    use_supabase_db = os.getenv('USE_SUPABASE_DB', 'False').lower() == 'true'

    if use_supabase_db:
        database_url = (
            os.getenv('SUPABASE_DATABASE_URL', '').strip()
            or os.getenv('DATABASE_URL', '').strip()
        )
        supabase_db_name = os.getenv('SUPABASE_DB_NAME')
        supabase_db_user = os.getenv('SUPABASE_DB_USER')
        supabase_db_password = os.getenv('SUPABASE_DB_PASSWORD')
        supabase_db_host = os.getenv('SUPABASE_DB_HOST')
        supabase_db_port = os.getenv('SUPABASE_DB_PORT', '5432')
        supabase_db_sslmode = os.getenv('SUPABASE_DB_SSLMODE', 'require')

        if database_url:
            parsed_db = urlparse(database_url)
            database_name = (parsed_db.path or '').lstrip('/')
            database_user = parsed_db.username
            database_password = parsed_db.password
            database_host = parsed_db.hostname
            database_port = parsed_db.port or int(supabase_db_port)
            database_sslmode = supabase_db_sslmode
        else:
            database_name = supabase_db_name
            database_user = supabase_db_user
            database_password = supabase_db_password
            database_host = supabase_db_host
            database_port = int(supabase_db_port)
            database_sslmode = supabase_db_sslmode

        if not database_sslmode and database_host and 'supabase.co' in str(database_host):
            database_sslmode = 'require'
    else:
        database_name = os.getenv('POSTGRES_DB', 'hr_payroll')
        database_user = os.getenv('POSTGRES_USER', 'hr_payroll')
        database_password = os.getenv('POSTGRES_PASSWORD', 'hr_payroll')
        database_host = os.getenv('POSTGRES_HOST', 'localhost')
        database_port = int(os.getenv('POSTGRES_PORT', '5432'))
        database_sslmode = os.getenv('POSTGRES_SSLMODE')

    db_options = {}
    if database_sslmode:
        db_options['sslmode'] = database_sslmode

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': database_name,
            'USER': database_user,
            'PASSWORD': database_password,
            'HOST': database_host,
            'PORT': database_port,
            'OPTIONS': db_options,
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Test runner (reuse existing test DB to avoid interactive prompts)
TEST_RUNNER = 'config.test_runner.KeepDbTestRunner'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'apps.users.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# Static and Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Simple JWT Configuration - matches frontend expectations
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# Djoser Configuration
DJOSER = {
    'LOGIN_FIELD': 'username',
    'USER_CREATE_PASSWORD_RETYPE': False,
    'SERIALIZERS': {
        'current_user': 'apps.users.serializers.CurrentUserSerializer',
    },
}

# CORS Configuration - allow frontend origins
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000'
).split(',')
CORS_ALLOWED_ORIGIN_REGEXES = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGIN_REGEXES', '').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG
X_FRAME_OPTIONS = 'SAMEORIGIN'

# Celery / Redis
CELERY_BROKER_URL = os.getenv(
    'CELERY_BROKER_URL',
    os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
)
CELERY_RESULT_BACKEND = os.getenv(
    'CELERY_RESULT_BACKEND',
    os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
