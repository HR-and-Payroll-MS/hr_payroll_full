from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestChatSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('chat')
        self.assertEqual(config.name, 'apps.chat')

    def test_models_import(self):
        importlib.import_module('apps.chat.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.chat.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
