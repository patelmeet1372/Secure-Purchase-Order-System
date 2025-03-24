from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, PurchaseOrderViewSet, AuditLogViewSet, reset_database

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('reset-database/', reset_database, name='reset-database'),
]