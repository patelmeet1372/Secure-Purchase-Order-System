from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=[
        ('purchaser', 'Purchaser'),
        ('supervisor', 'Supervisor'),
        ('purchasing_dept', 'Purchasing Department')
    ])
    public_key = models.TextField()
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"

class PurchaseOrder(models.Model):
    order_number = models.CharField(max_length=50, unique=True)
    purchaser = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchase_orders')
    description = models.TextField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    vendor = models.CharField(max_length=100)
    encrypted_details = models.TextField()  # JSON containing encrypted order details
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"PO-{self.order_number} - {self.status}"

class Signature(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='signatures')
    signer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='signatures')
    signature = models.TextField()  # Base64 encoded signature
    hash = models.TextField()  # Hash of the purchase order that was signed
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Signature by {self.signer.username} for PO-{self.purchase_order.order_number}"

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    details = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action} by {self.user.username if self.user else 'Unknown'} at {self.timestamp}"