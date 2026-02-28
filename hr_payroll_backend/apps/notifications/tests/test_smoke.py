from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestNotificationsSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('notifications')
        self.assertEqual(config.name, 'apps.notifications')

    def test_models_import(self):
        importlib.import_module('apps.notifications.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.notifications.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
