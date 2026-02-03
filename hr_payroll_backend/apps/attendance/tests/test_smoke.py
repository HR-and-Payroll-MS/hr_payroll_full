from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestAttendanceSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('attendance')
        self.assertEqual(config.name, 'apps.attendance')

    def test_models_import(self):
        importlib.import_module('apps.attendance.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.attendance.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
