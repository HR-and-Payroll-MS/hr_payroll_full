from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestSupportSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('support')
        self.assertEqual(config.name, 'apps.support')

    def test_models_import(self):
        importlib.import_module('apps.support.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.support.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
