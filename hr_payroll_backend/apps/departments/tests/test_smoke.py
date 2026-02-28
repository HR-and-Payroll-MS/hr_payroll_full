from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestDepartmentsSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('departments')
        self.assertEqual(config.name, 'apps.departments')

    def test_models_import(self):
        importlib.import_module('apps.departments.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.departments.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
