import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User, Group
from django.db import transaction
from crypto_utils import setup_user_keys

def setup_test_environment():
    print("Setting up test environment...")
    
    # Create groups
    groups = {
        'Purchaser': Group.objects.get_or_create(name='Purchaser')[0],
        'Supervisor': Group.objects.get_or_create(name='Supervisor')[0],
        'Purchasing Department': Group.objects.get_or_create(name='Purchasing Department')[0]
    }
    
    # Create test users
    test_users = [
        ('purchaser1', 'Purchaser'),
        ('supervisor1', 'Supervisor'),
        ('purchasing_dept1', 'Purchasing Department')
    ]
    
    with transaction.atomic():
        for username, group_name in test_users:
            # Create user if not exists
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'is_active': True}
            )
            
            if created:
                user.set_password('meetpatel123')
                user.save()
                print(f"Created user: {username}")
            
            # Add user to group
            user.groups.add(groups[group_name])
            
            # Generate RSA keys for user
            try:
                setup_user_keys(username)
                print(f"Generated RSA keys for {username}")
            except Exception as e:
                print(f"Error generating keys for {username}: {str(e)}")
    
    print("Test environment setup completed!")

if __name__ == "__main__":
    setup_test_environment() 