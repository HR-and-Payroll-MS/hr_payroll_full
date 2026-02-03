from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestAnnouncementsSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('announcements')
        self.assertEqual(config.name, 'apps.announcements')

    def test_models_import(self):
        importlib.import_module('apps.announcements.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.announcements.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
