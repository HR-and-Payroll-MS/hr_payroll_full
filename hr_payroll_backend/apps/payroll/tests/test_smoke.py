from django.test import SimpleTestCase
from django.apps import apps
import importlib


class TestPayrollSmoke(SimpleTestCase):
    def test_app_config(self):
        config = apps.get_app_config('payroll')
        self.assertEqual(config.name, 'apps.payroll')

    def test_models_import(self):
        importlib.import_module('apps.payroll.models')

    def test_urls_import(self):
        urls = importlib.import_module('apps.payroll.urls')
        self.assertTrue(hasattr(urls, 'urlpatterns'))
