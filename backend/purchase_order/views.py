from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile, PurchaseOrder, Signature, AuditLog
from .serializers import (
    UserProfileSerializer, PurchaseOrderSerializer, 
    CreatePurchaseOrderSerializer, SignPurchaseOrderSerializer,
    AuditLogSerializer
)
from utils.crypto import CryptoUtils
import json
from django.utils import timezone

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        profile = UserProfile.objects.get(user=user)
        
        if profile.role == 'purchaser':
            return PurchaseOrder.objects.filter(purchaser=user)
        elif profile.role == 'supervisor':
            return PurchaseOrder.objects.filter(status='pending')
        elif profile.role == 'purchasing_dept':
            return PurchaseOrder.objects.filter(status='approved')
        
        return PurchaseOrder.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePurchaseOrderSerializer
        return PurchaseOrderSerializer
    
    def create(self, request, *args, **kwargs):
        profile = UserProfile.objects.get(user=request.user)
        
        if profile.role != 'purchaser':
            return Response(
                {"detail": "Only purchasers can create purchase orders"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        purchase_order = serializer.save()
        
        # Log the action
        AuditLog.objects.create(
            user=request.user,
            action="Created purchase order",
            details=f"Created purchase order {purchase_order.order_number}",
            ip_address=self.get_client_ip(request)
        )
        
        return Response(
            PurchaseOrderSerializer(purchase_order).data, 
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Sign a purchase order"""
        try:
            # For debugging
            print(f"Sign action called for PO {pk} by {request.user.username}")
            print(f"Request data: {request.data}")
            
            purchase_order = self.get_object()
            
            # Check if the user is authorized to sign
            user_profile = UserProfile.objects.get(user=request.user)
            print(f"User role: {user_profile.role}")
            
            # Check if the user has already signed this purchase order
            existing_signature = Signature.objects.filter(
                purchase_order=purchase_order, 
                signer=request.user
            ).first()
            
            if existing_signature:
                print(f"User {request.user.username} has already signed this purchase order.")
                return Response(
                    {"detail": "You have already signed this purchase order."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Only purchasers and supervisors can sign
            if user_profile.role not in ['purchaser', 'supervisor']:
                print(f"User {request.user.username} is not authorized to sign.")
                return Response(
                    {"detail": "You are not authorized to sign purchase orders."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Validate the request data
            serializer = SignPurchaseOrderSerializer(data=request.data)
            if not serializer.is_valid():
                print(f"Invalid data: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the signature
            try:
                signature = Signature.objects.create(
                    purchase_order=purchase_order,
                    signer=request.user,
                    signature=serializer.validated_data['signature'],
                    hash=serializer.validated_data['hash']
                )
                
                # Log the action
                AuditLog.objects.create(
                    user=request.user,
                    action=f"signed purchase order {purchase_order.order_number}",
                    timestamp=timezone.now()
                )
                
                # Update status if signed by supervisor
                if user_profile.role == 'supervisor':
                    purchase_order.status = 'approved'
                    purchase_order.save()
                    
                    # Log the approval
                    AuditLog.objects.create(
                        user=request.user,
                        action=f"approved purchase order {purchase_order.order_number}",
                        timestamp=timezone.now()
                    )
                
                return Response(
                    {"detail": "Purchase order signed successfully."}, 
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                print(f"Error creating signature: {e}")
                return Response(
                    {"detail": f"Error creating signature: {str(e)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            print(f"Unexpected error in sign action: {e}")
            return Response(
                {"detail": f"An unexpected error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        purchase_order = self.get_object()
        profile = UserProfile.objects.get(user=request.user)
        
        # Log request data for debugging
        print(f"Reject action called by {request.user.username} for PO-{purchase_order.order_number}")
        print(f"Request data: {request.data}")
        
        if profile.role != 'supervisor':
            return Response(
                {"detail": "Only supervisors can reject purchase orders"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if purchase_order.status != 'pending':
            return Response(
                {"detail": "You can only reject pending purchase orders"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create a signature for the rejection
            serializer = SignPurchaseOrderSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            signature = Signature.objects.create(
                purchase_order=purchase_order,
                signer=request.user,
                signature=serializer.validated_data['signature'],
                hash=serializer.validated_data['hash']
            )
            
            print(f"Rejection signature created: {signature.id}")
            
            # Update purchase order status
            purchase_order.status = 'rejected'
            purchase_order.save()
            print(f"Purchase order status updated to 'rejected'")
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action="Rejected purchase order",
                details=f"Rejected purchase order {purchase_order.order_number}",
                ip_address=self.get_client_ip(request)
            )
            
            return Response(
                {"detail": "Purchase order rejected successfully"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Error rejecting purchase order: {str(e)}")
            return Response(
                {"detail": f"Error rejecting purchase order: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        purchase_order = self.get_object()
        profile = UserProfile.objects.get(user=request.user)
        
        # Log request data for debugging
        print(f"Process action called by {request.user.username} for PO-{purchase_order.order_number}")
        print(f"Request data: {request.data}")
        print(f"User role: {profile.role}")
        
        if profile.role not in ['purchasing_dept', 'purchaser']:
            return Response(
                {"detail": "Only purchasing department can process purchase orders"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if purchase_order.status != 'approved':
            return Response(
                {"detail": "You can only process approved purchase orders"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create a signature for the processing
            serializer = SignPurchaseOrderSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            signature = Signature.objects.create(
                purchase_order=purchase_order,
                signer=request.user,
                signature=serializer.validated_data['signature'],
                hash=serializer.validated_data['hash']
            )
            
            print(f"Processing signature created: {signature.id}")
            
            # Update purchase order status
            purchase_order.status = 'processed'
            purchase_order.save()
            print(f"Purchase order status updated to 'processed'")
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action="Processed purchase order",
                details=f"Processed purchase order {purchase_order.order_number}",
                ip_address=self.get_client_ip(request)
            )
            
            return Response(
                {"detail": "Purchase order processed successfully"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Error processing purchase order: {str(e)}")
            return Response(
                {"detail": f"Error processing purchase order: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        purchase_order = self.get_object()
        profile = UserProfile.objects.get(user=request.user)
        
        # Log request data for debugging
        print(f"Approve action called by {request.user.username} for PO-{purchase_order.order_number}")
        print(f"Request data: {request.data}")
        
        if profile.role != 'supervisor':
            return Response(
                {"detail": "Only supervisors can approve purchase orders"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if purchase_order.status != 'pending':
            return Response(
                {"detail": "You can only approve pending purchase orders"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create a signature for the approval
            serializer = SignPurchaseOrderSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            signature = Signature.objects.create(
                purchase_order=purchase_order,
                signer=request.user,
                signature=serializer.validated_data['signature'],
                hash=serializer.validated_data['hash']
            )
            
            print(f"Approval signature created: {signature.id}")
            
            # Update purchase order status
            purchase_order.status = 'approved'
            purchase_order.save()
            print(f"Purchase order status updated to 'approved'")
            
            # Log the action
            AuditLog.objects.create(
                user=request.user,
                action="Approved purchase order",
                details=f"Approved purchase order {purchase_order.order_number}",
                ip_address=self.get_client_ip(request)
            )
            
            return Response(
                {"detail": "Purchase order approved successfully"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Error approving purchase order: {str(e)}")
            return Response(
                {"detail": f"Error approving purchase order: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_database(request):
    """
    Reset the database by deleting all purchase orders and signatures.
    Only accessible to supervisors.
    """
    # Check if the user is a supervisor
    try:
        profile = UserProfile.objects.get(user=request.user)
        if profile.role != 'supervisor':
            return Response({'error': 'Only supervisors can reset the database'}, status=403)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=404)
    
    # Check for confirmation
    if not request.data.get('confirm', False):
        return Response({'error': 'Confirmation required'}, status=400)
    
    try:
        # Delete all signatures first (due to foreign key constraints)
        signature_count = Signature.objects.count()
        Signature.objects.all().delete()
        
        # Then delete all purchase orders
        order_count = PurchaseOrder.objects.count()
        PurchaseOrder.objects.all().delete()
        
        return Response({
            'success': True,
            'message': f'Database reset successful. Deleted {signature_count} signatures and {order_count} purchase orders.'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)