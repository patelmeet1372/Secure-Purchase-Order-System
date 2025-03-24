#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from purchase_order.models import UserProfile

def update_public_keys():
    """Update public keys for all users with hardcoded demo values."""
    # These are the public keys corresponding to the private keys in keyStorage.js
    demo_public_keys = {
        'purchaser1': """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqvufnB3qZG/cxRavjJiZ
3xeQ0EAp21BBrILPzuBBcKrGQUJv6QrPnCn2fSf4lgDBhWaDuRaUGWeqVAY+9VNJ
dfjsJ6zt0mqyZW9CxG2ChdS71RO1K7CqQ0sLtzHEPCazZvppAie41EZEF0NCpXBz
vT4mBdcJAifMRPQWFiQOrnEPEEhD9JYyfcyqB4d4CHTJ1C8/lUB9UBMjyn/hnkmR
ZrdUBMkF9V3mIEfcaSyyT9PNBVnVQ19R1VI0u5/JjYJl5HwoyjYvAFl/ORe4EMpv
whCz5KUSFDlV8QsY/4isPljh4EXyMx3108bwhpv8ru+kPDSyY9EAIDUQ2oUMZcNW
QwIDAQAB
-----END PUBLIC KEY-----""",
        'supervisor1': """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqwR11mMJlIvW/oViqc+z
JF8DrAf4ZJbzW8WdVL8EtsDEbmRFRbFI+MZhv278/xu9x1vvpOjf5Nvto6/jWitu
Xi4A/1YSfYyhjmJv+vuU3xpAY9SxdcQJBxDC+BnvAzDf+xdkqzz345IRGlnWhRt6
xZi6jW1kTVzyAhGlmYKozCWD7/t159/yokaC1XhZcVBr1MeA5dfLdKyV1LCvhH3e
Fy+V0VFqrvu+TWZf5+oWZP5V3K9ONRFxDsqLEIgQAYyG0818BOZk97UtHmQ8fsCZ
0EHRNSi/T2AvJU8PGd91bXdQxPCQWMA7IRybgahfzdWylCR+/mAKGnoEc2LTtNJe
zQIDAQAB
-----END PUBLIC KEY-----""",
        'purchasing_dept1': """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuKYKW3xRDVEKh6BeFqcI
8v9Uf4ABpsfRODLhQqVY98PgVd7RB8TW3kVHzGZtJ2ev5WY0OnB31DMKjEvgVpU6
kfoN0Wm9Zy4dgPrjdCPI5PhirFfIaRpx8MjJ9nvuwKqW+2tnyVZjJG3BWgGLh2vX
KuqsefGDy5CV0yioYR7wRwniswHQYdJ/bSfQy96fjqPki2WhsktEUFsCsmKrMi+8
2Fu5M95hIspYzHGDtmN2+fSS6c29cjmGs8Z5ivQNVb6TMGA+lEP8PNG5Hn6kS7iV
giaGTkknT8pnMg39f1EOfPvQwAt0xfRzc0GZVbxf+3Kh10GySNsA7isSVa0Spzzr
RQIDAQAB
-----END PUBLIC KEY-----"""
    }
    
    for username, public_key in demo_public_keys.items():
        try:
            user = User.objects.get(username=username)
            profile = UserProfile.objects.get(user=user)
            
            # Update the profile with the public key
            profile.public_key = public_key
            profile.save()
            
            print(f"Updated public key for {username}")
            
        except User.DoesNotExist:
            print(f"User {username} not found")
            continue
        except UserProfile.DoesNotExist:
            print(f"No profile found for {username}")
            continue

if __name__ == "__main__":
    print("Updating public keys for demo users...")
    update_public_keys()
    print("Done!") 