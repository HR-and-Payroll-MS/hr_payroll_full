"""Settings package initializer.

Select settings module based on DJANGO_ENV.
"""
import os

ENVIRONMENT = os.getenv('DJANGO_ENV', 'local').lower()

if ENVIRONMENT in ('prod', 'production'):
    from .production import *  # noqa
else:
    from .local import *  # noqa
