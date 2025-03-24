from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, PurchaseOrder, Signature, AuditLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role', 'public_key']

class SignatureSerializer(serializers.ModelSerializer):
    signer = UserSerializer(read_only=True)
    
    class Meta:
        model = Signature
        fields = ['id', 'signer', 'signature', 'hash', 'timestamp']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    purchaser = UserSerializer(read_only=True)
    signatures = SignatureSerializer(many=True, read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'order_number', 'purchaser', 'description', 'amount', 
                  'vendor', 'encrypted_details', 'status', 'created_at', 
                  'updated_at', 'signatures']

class CreatePurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = ['description', 'amount', 'vendor', 'encrypted_details']
    
    def create(self, validated_data):
        # Generate a unique order number
        import uuid
        order_number = str(uuid.uuid4())[:8].upper()
        
        validated_data['order_number'] = order_number
        validated_data['purchaser'] = self.context['request'].user
        
        return super().create(validated_data)

class SignPurchaseOrderSerializer(serializers.Serializer):
    signature = serializers.CharField()
    hash = serializers.CharField()

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'details', 'ip_address', 'timestamp']