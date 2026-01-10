from django.db import models

class FAQ(models.Model):
    CATEGORY_CHOICES = [
        ('General', 'General'),
        ('Payroll', 'Payroll'),
        ('Leave', 'Leave'),
        ('Benefits', 'Benefits'),
    ]
    STATUS_CHOICES = [
        ('published', 'Published'),
        ('draft', 'Draft'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    question = models.TextField()
    answer = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question
