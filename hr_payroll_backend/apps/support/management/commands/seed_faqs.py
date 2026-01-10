from django.core.management.base import BaseCommand
from apps.support.models import FAQ

class Command(BaseCommand):
    help = 'Seeds initial FAQ data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding FAQs...')
        
        # Clear existing to avoid duplicates if re-run (optional, or update_or_create)
        FAQ.objects.all().delete()

        faqs = [
            {
                'category': 'Payroll',
                'question': 'When is payday?',
                'answer': 'Payday is on the 28th of every month. If the 28th falls on a weekend, it will be the preceding Friday.',
                'status': 'published'
            },
            {
                'category': 'Payroll',
                'question': 'How is my tax calculated?',
                'answer': 'Tax is calculated based on the progressive tax brackets defined by the Ethiopian Federal Income Tax laws. You can view your specific tax code and version on your payslip.',
                'status': 'published'
            },
            {
                'category': 'Leave',
                'question': 'How do I apply for leave?',
                'answer': 'Go to the "Leave Management" section in the sidebar, click "Request Leave", select your dates and leave type, and submit. Your manager will be notified for approval.',
                'status': 'published'
            },
            {
                'category': 'General',
                'question': 'How do I reset my password?',
                'answer': 'Click on "Forgot Password" on the login screen, enter your email, and follow the instructions sent to your inbox.',
                'status': 'published'
            },
            {
                'category': 'Benefits',
                'question': 'What is included in the medical insurance?',
                'answer': 'Our medical insurance covers outpatient and inpatient care up to the limits defined in your contract. Please refer to the HR handbook for detailed coverage tables.',
                'status': 'published'
            }
        ]

        for item in faqs:
            FAQ.objects.create(**item)
            
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(faqs)} published FAQs.'))
