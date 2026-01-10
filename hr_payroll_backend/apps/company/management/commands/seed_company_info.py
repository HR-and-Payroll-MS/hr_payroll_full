"""
Management command to seed initial company information.
Run with: python manage.py seed_company_info
"""
from django.core.management.base import BaseCommand
from apps.company.models import CompanyInfo


class Command(BaseCommand):
    help = 'Seed initial company information for the organization'

    def handle(self, *args, **options):
        company, created = CompanyInfo.objects.get_or_create(
            pk=1,
            defaults={
                'name': 'TechInnovate Ethiopia',
                'address': 'Bole Road, Africa Avenue, Addis Ababa, Ethiopia',
                'country_code': '+251',
                'phone': '911234567',
                'email': 'hr@techinnovate.et',
                'description': 'TechInnovate Ethiopia is a leading software development company focused on building innovative solutions for Ethiopian businesses. We specialize in enterprise applications, HR management systems, and digital transformation services.',
                'website': 'https://www.techinnovate.et',
                'tax_id': 'TIN-123456789',
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created CompanyInfo: {company.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  CompanyInfo already exists: {company.name}'))
