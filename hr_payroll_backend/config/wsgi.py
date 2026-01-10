"""
WSGI config for HR & Payroll project.
"""
import os
from django.core.wsgi import get_wsgi_application

from config.socket_app import sio
import socketio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()
application = socketio.WSGIApp(sio, application)
