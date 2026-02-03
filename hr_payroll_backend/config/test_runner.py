from django.test.runner import DiscoverRunner


class KeepDbTestRunner(DiscoverRunner):
    """Test runner that always reuses the test DB and disables prompts."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("keepdb", True)
        kwargs.setdefault("interactive", False)
        super().__init__(*args, **kwargs)
