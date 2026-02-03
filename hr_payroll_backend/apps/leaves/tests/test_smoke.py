from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestLeavesSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('leaves')
        self.assertEqual(config.name, 'apps.leaves')

    def test_models_import(self):
        importlib.import_module('apps.leaves.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.leaves.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
