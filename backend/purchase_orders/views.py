from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import PurchaseOrder
from .serializers import PurchaseOrderSerializer
from crypto_utils import CryptoUtils, get_user_private_key, get_user_public_key
import base64
from datetime import datetime

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Add purchaser to request data
        request.data['purchaser'] = request.user.id
        
        # Create the purchase order
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        order = self.get_object()
        user = request.user
        
        try:
            # Get the current order state for signing
            order_state = order.to_dict()
            
            # Verify the signature
            signature = base64.b64decode(request.data.get('signature', ''))
            data_hash = base64.b64decode(request.data.get('hash', ''))
            timestamp = request.data.get('timestamp', datetime.utcnow().isoformat())
            
            # Get user's public key
            public_key = get_user_public_key(user.username)
            
            # Verify signature
            if not CryptoUtils.verify_signature(order_state, signature, public_key):
                return Response(
                    {"error": "Invalid signature"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create signature object
            signature_obj = {
                'user': user.username,
                'role': user.groups.first().name if user.groups.exists() else 'unknown',
                'signature': request.data.get('signature'),
                'hash': request.data.get('hash'),
                'timestamp': timestamp
            }
            
            # Add signature to order
            order.signatures.append(signature_obj)
            order.save()
            
            # Return signature data in the expected format
            return Response({
                'signature': signature_obj,
                'detail': 'Purchase order signed successfully'
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        order = self.get_object()
        user = request.user
        
        # Check if user is a supervisor
        if not user.groups.filter(name='Supervisor').exists():
            return Response(
                {"error": "Only supervisors can approve orders"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get the current order state for signing
            order_state = order.to_dict()
            order_state['status'] = 'approved'  # Update status for signature verification
            
            # Verify the signature
            signature = base64.b64decode(request.data.get('signature', ''))
            data_hash = base64.b64decode(request.data.get('hash', ''))
            timestamp = request.data.get('timestamp', datetime.utcnow().isoformat())
            
            # Get supervisor's public key
            public_key = get_user_public_key(user.username)
            
            # Verify signature
            if not CryptoUtils.verify_signature(order_state, signature, public_key):
                return Response(
                    {"error": "Invalid signature"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create signature object
            signature_obj = {
                'user': user.username,
                'role': 'Supervisor',
                'signature': request.data.get('signature'),
                'hash': request.data.get('hash'),
                'timestamp': timestamp
            }
            
            # Add supervisor's signature
            order.signatures.append(signature_obj)
            
            # Update order status
            order.status = 'approved'
            order.save()
            
            # Return signature data in the expected format
            return Response({
                'signature': signature_obj,
                'detail': 'Purchase order approved successfully'
            })
            
        except Exception as e:
            return Response(
                {"error": f"Error approving purchase order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        order = self.get_object()
        user = request.user
        
        # Check if user is from purchasing department
        if not user.groups.filter(name='Purchasing Department').exists():
            return Response(
                {"error": "Only purchasing department can process orders"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get the current order state for signing
            order_state = order.to_dict()
            order_state['status'] = 'processed'  # Update status for signature verification
            
            # Verify the signature
            signature = base64.b64decode(request.data.get('signature', ''))
            data_hash = base64.b64decode(request.data.get('hash', ''))
            timestamp = request.data.get('timestamp', datetime.utcnow().isoformat())
            
            # Get purchasing department user's public key
            public_key = get_user_public_key(user.username)
            
            # Verify signature
            if not CryptoUtils.verify_signature(order_state, signature, public_key):
                return Response(
                    {"error": "Invalid signature"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Decrypt order details
            private_key = get_user_private_key(user.username)
            decrypted_details = CryptoUtils.decrypt_data(order.encrypted_details, private_key)
            
            # Create signature object
            signature_obj = {
                'user': user.username,
                'role': 'Purchasing Department',
                'signature': request.data.get('signature'),
                'hash': request.data.get('hash'),
                'timestamp': timestamp
            }
            
            # Add purchasing department signature
            order.signatures.append(signature_obj)
            
            # Update order status
            order.status = 'processed'
            order.save()
            
            # Return signature data in the expected format
            return Response({
                'signature': signature_obj,
                'decrypted_details': decrypted_details,
                'detail': 'Purchase order processed successfully'
            })
            
        except Exception as e:
            return Response(
                {"error": f"Error processing purchase order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 