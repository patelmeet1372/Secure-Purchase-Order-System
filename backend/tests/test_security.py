from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from purchase_order.models import PurchaseOrder, Signature
from datetime import datetime
import json

User = get_user_model()

class SecurityTests(APITestCase):
    def setUp(self):
        # Create test users
        self.purchaser = User.objects.create_user(
            username='test_purchaser',
            password='test123',
            role='purchaser'
        )
        self.supervisor = User.objects.create_user(
            username='test_supervisor',
            password='test123',
            role='supervisor'
        )
        self.purchasing = User.objects.create_user(
            username='test_purchasing',
            password='test123',
            role='purchasing'
        )

    def test_authentication(self):
        """Test that authentication is required for all endpoints"""
        # Try to access protected endpoint without authentication
        response = self.client.get(reverse('purchase-order-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Login and try again
        self.client.force_authenticate(user=self.purchaser)
        response = self.client.get(reverse('purchase-order-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_role_based_access(self):
        """Test that users can only access appropriate endpoints"""
        # Login as purchaser
        self.client.force_authenticate(user=self.purchaser)
        
        # Try to approve order (should fail)
        response = self.client.post(reverse('purchase-order-approve', args=[1]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Login as supervisor
        self.client.force_authenticate(user=self.supervisor)
        
        # Try to create order (should fail)
        response = self.client.post(reverse('purchase-order-list'), {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_signature_verification(self):
        """Test the signature verification process"""
        # Create a test order
        self.client.force_authenticate(user=self.purchaser)
        order_data = {
            'item_name': 'Test Item',
            'quantity': 1,
            'unit_price': 100,
            'total_amount': 100,
            'description': 'Test Description'
        }
        response = self.client.post(reverse('purchase-order-list'), order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']

        # Sign the order
        response = self.client.post(reverse('purchase-order-sign', args=[order_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify signature exists
        signature = Signature.objects.filter(purchase_order_id=order_id).first()
        self.assertIsNotNone(signature)
        self.assertIsNotNone(signature.signature)
        self.assertIsNotNone(signature.timestamp)

    def test_timestamp_verification(self):
        """Test that timestamps are properly recorded and sequential"""
        # Create and sign multiple orders
        self.client.force_authenticate(user=self.purchaser)
        
        timestamps = []
        for i in range(3):
            order_data = {
                'item_name': f'Test Item {i}',
                'quantity': 1,
                'unit_price': 100,
                'total_amount': 100,
                'description': f'Test Description {i}'
            }
            response = self.client.post(reverse('purchase-order-list'), order_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Sign the order
            response = self.client.post(reverse('purchase-order-sign', args=[response.data['id']]))
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Get signature timestamp
            signature = Signature.objects.filter(purchase_order_id=response.data['id']).first()
            timestamps.append(signature.timestamp)

        # Verify timestamps are sequential
        for i in range(1, len(timestamps)):
            self.assertLess(timestamps[i-1], timestamps[i])

    def test_audit_trail(self):
        """Test that audit trail is maintained"""
        # Create and sign an order
        self.client.force_authenticate(user=self.purchaser)
        order_data = {
            'item_name': 'Test Item',
            'quantity': 1,
            'unit_price': 100,
            'total_amount': 100,
            'description': 'Test Description'
        }
        response = self.client.post(reverse('purchase-order-list'), order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']

        # Sign the order
        response = self.client.post(reverse('purchase-order-sign', args=[order_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify audit trail
        audit_logs = response.data.get('audit_logs', [])
        self.assertGreater(len(audit_logs), 0)
        self.assertIn('created', audit_logs[0])
        self.assertIn('signed', audit_logs[1])

    def test_data_integrity(self):
        """Test that data integrity is maintained"""
        # Create and sign an order
        self.client.force_authenticate(user=self.purchaser)
        order_data = {
            'item_name': 'Test Item',
            'quantity': 1,
            'unit_price': 100,
            'total_amount': 100,
            'description': 'Test Description'
        }
        response = self.client.post(reverse('purchase-order-list'), order_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_id = response.data['id']

        # Sign the order
        response = self.client.post(reverse('purchase-order-sign', args=[order_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try to modify the order
        modified_data = {
            'item_name': 'Modified Item',
            'quantity': 2,
            'unit_price': 200,
            'total_amount': 400,
            'description': 'Modified Description'
        }
        response = self.client.put(reverse('purchase-order-detail', args=[order_id]), modified_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 