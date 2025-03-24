from django.contrib import admin
from .models import UserProfile, PurchaseOrder, Signature, AuditLog

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'purchaser', 'vendor', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'purchaser__username', 'vendor')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Signature)
class SignatureAdmin(admin.ModelAdmin):
    list_display = ('purchase_order', 'signer', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('purchase_order__order_number', 'signer__username')
    readonly_fields = ('timestamp',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'ip_address', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action', 'details')
    readonly_fields = ('timestamp',)