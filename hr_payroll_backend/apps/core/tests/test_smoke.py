from django.test import SimpleTestCase
import importlib


class TestCorePermissionsSmoke(SimpleTestCase):
    def test_permissions_import(self):
        importlib.import_module('apps.core.permissions')

    def test_permission_classes_exist(self):
        from apps.core import permissions as p
        self.assertTrue(hasattr(p, 'IsHRManager'))
        self.assertTrue(hasattr(p, 'IsPayrollOfficer'))

    def test_manager_readonly_exists(self):
        from apps.core import permissions as p
        self.assertTrue(hasattr(p, 'IsManagerOrReadOnly'))
