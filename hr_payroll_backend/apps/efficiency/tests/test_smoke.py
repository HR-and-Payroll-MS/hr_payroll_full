from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestEfficiencySmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('efficiency')
        self.assertEqual(config.name, 'apps.efficiency')

    def test_models_import(self):
        importlib.import_module('apps.efficiency.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.efficiency.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
