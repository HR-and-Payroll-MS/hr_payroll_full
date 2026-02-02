"""Config package."""

# Load celery app when Django starts
try:
	from .celery import app as celery_app  # noqa: F401
except Exception:
	pass
