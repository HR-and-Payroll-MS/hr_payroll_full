from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestCompanySmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('company')
        self.assertEqual(config.name, 'apps.company')

    def test_models_import(self):
        importlib.import_module('apps.company.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.company.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
