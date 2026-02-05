from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.apps import apps


ROLE_DEFINITIONS = {
    "Admin": {
        "apps": ["*"],
        "actions": ["add", "change", "delete", "view"],
    },
    "Manager": {
        "apps": [
            "employees",
            "departments",
            "attendance",
            "leaves",
            "announcements",
            "policies",
            "company",
            "efficiency",
            "support",
            "notifications",
            "payroll",
            "chat",
        ],
        "actions": ["add", "change", "delete", "view"],
        "extra_apps": {
            "users": ["view", "change"],
        },
    },
    "Payroll": {
        "apps": ["payroll"],
        "actions": ["add", "change", "delete", "view"],
        "extra_apps": {
            "employees": ["view"],
            "departments": ["view"],
            "attendance": ["view"],
            "leaves": ["view"],
            "announcements": ["view"],
            "policies": ["view"],
            "company": ["view"],
            "notifications": ["view"],
        },
    },
    "Line Manager": {
        "apps": ["attendance", "leaves"],
        "actions": ["view", "change"],
        "extra_apps": {
            "employees": ["view"],
            "departments": ["view"],
            "announcements": ["view"],
            "policies": ["view"],
            "company": ["view"],
            "notifications": ["view"],
        },
    },
    "Employee": {
        "apps": ["attendance", "leaves", "announcements", "policies", "company", "notifications", "payroll", "chat"],
        "actions": ["view"],
        "extra_apps": {
            "employees": ["view"],
        },
    },
}


def _get_permissions_for_app(app_label, actions):
    perms = []
    app_config = apps.get_app_config(app_label)
    for model in app_config.get_models():
        model_name = model._meta.model_name
        for action in actions:
            codename = f"{action}_{model_name}"
            perm = Permission.objects.filter(codename=codename, content_type__app_label=app_label).first()
            if perm:
                perms.append(perm)
    return perms


class Command(BaseCommand):
    help = "Seed role groups and assign Django permissions."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete all existing groups before seeding")

    def handle(self, *args, **options):
        reset = options.get("reset", False)

        if reset:
            Group.objects.all().delete()

        for role_name, config in ROLE_DEFINITIONS.items():
            group, _ = Group.objects.get_or_create(name=role_name)

            actions = config.get("actions", [])
            apps_list = config.get("apps", [])
            extra_apps = config.get("extra_apps", {})

            perms = []
            if "*" in apps_list:
                perms = list(Permission.objects.all())
            else:
                for app_label in apps_list:
                    perms.extend(_get_permissions_for_app(app_label, actions))

                for app_label, extra_actions in extra_apps.items():
                    perms.extend(_get_permissions_for_app(app_label, extra_actions))

            group.permissions.set(perms)

            self.stdout.write(self.style.SUCCESS(
                f"Seeded group '{role_name}' with {len(perms)} permissions"
            ))

        self.stdout.write(self.style.SUCCESS("Role seeding complete."))
