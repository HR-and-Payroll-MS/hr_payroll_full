"""
Seed peer-to-peer notifications between employees.

Usage (from project root):
  python hr_payroll_backend/scripts/seed_peer_notifications.py

This script will use Django settings and create notifications where random
employees send varied notification types/messages to other random employees.
"""
import os
import random
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ.pop('SQLITE_DB_NAME', None)

import django
django.setup()

from apps.employees.models import Employee
from apps.notifications.models import Notification


MESSAGES = [
    ("Quick question about your timesheet", "Can you double-check the entry on 2025-01-15? I saw a gap.", 'message'),
    ("Congrats on the promotion!", "Well deserved — congratulations on your new role.", 'promotion'),
    ("Reminder: submit receipts", "Friendly reminder to upload your travel receipts for last week.", 'info'),
    ("Could you approve this?", "I routed a small expense approval to you — please approve when free.", 'request'),
    ("Heads up: meeting moved", "We moved today's 3PM catch-up to 4PM — updated calendar.", 'info'),
    ("Policy question", "Do interns need pre-approval for remote work next month?", 'policy'),
    ("Attendance note", "I corrected a missing punch for Jan 10 — please review.", 'attendance'),
    ("Wellness invite", "Join the steps challenge starting Monday — team sign-up open.", 'info'),
    ("Security reminder", "Please reset MFA if prompted; contact IT for help.", 'warning'),
    ("Expense clarification", "Can you attach the itemized receipt for the taxi?", 'request'),
]


def seed_notifications(count: int = 100):
    employees = list(Employee.objects.all())
    if len(employees) < 2:
        print('Need at least 2 employees to seed peer notifications.')
        return

    created = 0
    for _ in range(count):
        sender = random.choice(employees)
        recipient = random.choice(employees)
        # avoid self-notify for single notification, allow occasional self for testing
        if sender == recipient:
            # 10% chance allow self notifications
            if random.random() > 0.1:
                recipient = random.choice([e for e in employees if e != sender])

        title, message, ntype = random.choice(MESSAGES)
        # Add small personalization
        personalized = f"{message}\n\n— from {sender.fullname} at {datetime.utcnow().isoformat()}"

        Notification.objects.create(
            recipient=recipient,
            sender=sender,
            title=title,
            message=personalized,
            notification_type=ntype,
        )
        created += 1

    print(f"Seeded {created} peer-to-peer notifications")


if __name__ == '__main__':
    # default to 100 notifications unless overridden by env var
    try:
        n = int(os.environ.get('SEED_NOTIFICATIONS_COUNT', '100'))
    except ValueError:
        n = 100
    seed_notifications(n)
