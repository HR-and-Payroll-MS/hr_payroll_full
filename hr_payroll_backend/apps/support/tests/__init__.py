"""Test package shim to keep unittest discovery stable in Docker."""
import os
import sys

# Some runners import this package as a top-level module named 'tests'.
# Force the module file path to the app root so discovery doesn't error.
_app_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
# Point the module file to the app root tests.py (or app root) so unittest
# loader doesn't think it's imported from a different location.
sys.modules[__name__].__file__ = os.path.join(_app_root, 'tests.py')
sys.modules[__name__].__path__ = [_app_root]
