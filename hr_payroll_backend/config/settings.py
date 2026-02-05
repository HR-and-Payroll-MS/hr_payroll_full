"""Settings loader (dispatches to local or production settings)."""
import importlib
import os
from pathlib import Path

_CURRENT_DIR = Path(__file__).resolve().parent

# Make this module act like a package for submodule imports
__path__ = [str(_CURRENT_DIR / "settings")]

ENV = os.getenv("DJANGO_ENV", "local").lower()
module_name = "config.settings.local" if ENV != "production" else "config.settings.production"

_settings = importlib.import_module(module_name)

for _key, _value in vars(_settings).items():
    if _key.isupper():
        globals()[_key] = _value

__all__ = [k for k in globals().keys() if k.isupper()]
