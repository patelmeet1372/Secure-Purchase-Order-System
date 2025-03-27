from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import json

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected')
    ]
    
    order_number = models.CharField(max_length=8, unique=True)
    purchaser = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    vendor = models.CharField(max_length=255)
    encrypted_details = models.TextField()  # Encrypted JSON data
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    signatures = models.JSONField(default=list)  # List of signature objects
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.order_number:
            # Generate a unique order number (you can implement your own logic)
            import uuid
            self.order_number = uuid.uuid4().hex[:8].upper()
        
        # Validate signatures format
        if not isinstance(self.signatures, list):
            raise ValidationError({'signatures': 'Signatures must be a list'})
        
        for sig in self.signatures:
            if not isinstance(sig, dict):
                raise ValidationError({'signatures': 'Each signature must be a dictionary'})
            required_fields = {'user', 'role', 'signature', 'hash', 'timestamp'}
            if not all(field in sig for field in required_fields):
                raise ValidationError({'signatures': f'Signature missing required fields: {required_fields}'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def to_dict(self):
        """Convert order to dictionary for signing."""
        return {
            'order_number': self.order_number,
            'purchaser': self.purchaser.username,
            'description': self.description,
            'amount': str(self.amount),
            'vendor': self.vendor,
            'encrypted_details': self.encrypted_details,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __str__(self):
        return f"PO-{self.order_number} ({self.status})" 