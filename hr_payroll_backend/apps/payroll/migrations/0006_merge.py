from django.db import migrations


class Migration(migrations.Migration):
    # Chain to the timestamped merge to avoid duplicate leaf nodes
    dependencies = [
        ("payroll", "0006_merge_20260118_1741"),
    ]

    operations = []
