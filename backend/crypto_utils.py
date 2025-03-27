import rsa
import base64
import json
import os
from datetime import datetime
from typing import Tuple, Dict, Any

class CryptoUtils:
    KEY_SIZE = 2048

    @staticmethod
    def generate_key_pair() -> Tuple[rsa.PublicKey, rsa.PrivateKey]:
        """Generate a new RSA key pair."""
        return rsa.newkeys(CryptoUtils.KEY_SIZE)

    @staticmethod
    def save_keys(public_key: rsa.PublicKey, private_key: rsa.PrivateKey, username: str) -> None:
        """Save RSA keys to files."""
        keys_dir = os.path.join(os.path.dirname(__file__), 'keys')
        os.makedirs(keys_dir, exist_ok=True)
        
        # Save public key
        pub_path = os.path.join(keys_dir, f'{username}_public.pem')
        with open(pub_path, 'wb') as f:
            f.write(public_key.save_pkcs1('PEM'))
        
        # Save private key
        priv_path = os.path.join(keys_dir, f'{username}_private.pem')
        with open(priv_path, 'wb') as f:
            f.write(private_key.save_pkcs1('PEM'))

    @staticmethod
    def load_keys(username: str) -> Tuple[rsa.PublicKey, rsa.PrivateKey]:
        """Load RSA keys from files."""
        keys_dir = os.path.join(os.path.dirname(__file__), 'keys')
        
        # Load public key
        pub_path = os.path.join(keys_dir, f'{username}_public.pem')
        with open(pub_path, 'rb') as f:
            public_key = rsa.PublicKey.load_pkcs1(f.read())
        
        # Load private key
        priv_path = os.path.join(keys_dir, f'{username}_private.pem')
        with open(priv_path, 'rb') as f:
            private_key = rsa.PrivateKey.load_pkcs1(f.read())
        
        return public_key, private_key

    @staticmethod
    def sign_data(data: Dict[str, Any], private_key: rsa.PrivateKey) -> Dict[str, str]:
        """Sign data using RSA private key."""
        # Create a hash of the data
        data_str = json.dumps(data, sort_keys=True)
        data_hash = rsa.compute_hash(data_str.encode(), 'SHA-256')
        
        # Sign the hash
        signature = rsa.sign(data_str.encode(), private_key, 'SHA-256')
        
        return {
            'hash': base64.b64encode(data_hash).decode('utf-8'),
            'signature': base64.b64encode(signature).decode('utf-8'),
            'timestamp': datetime.utcnow().isoformat()
        }

    @staticmethod
    def verify_signature(data: Dict[str, Any], signature: bytes, public_key: rsa.PublicKey) -> bool:
        """Verify RSA signature."""
        try:
            data_str = json.dumps(data, sort_keys=True)
            rsa.verify(data_str.encode(), signature, public_key)
            return True
        except rsa.VerificationError:
            return False

    @staticmethod
    def encrypt_data(data: Dict[str, Any], public_key: rsa.PublicKey) -> str:
        """Encrypt data using RSA public key."""
        data_str = json.dumps(data)
        # For large data, we'll use symmetric encryption in production
        # Here we'll chunk the data since RSA can only encrypt limited size
        chunk_size = 200  # RSA-2048 can encrypt up to ~245 bytes
        encrypted_chunks = []
        
        for i in range(0, len(data_str), chunk_size):
            chunk = data_str[i:i + chunk_size]
            encrypted_chunk = rsa.encrypt(chunk.encode(), public_key)
            encrypted_chunks.append(base64.b64encode(encrypted_chunk).decode())
        
        return json.dumps(encrypted_chunks)

    @staticmethod
    def decrypt_data(encrypted_data: str, private_key: rsa.PrivateKey) -> Dict[str, Any]:
        """Decrypt data using RSA private key."""
        try:
            encrypted_chunks = json.loads(encrypted_data)
            decrypted_chunks = []
            
            for chunk in encrypted_chunks:
                encrypted_bytes = base64.b64decode(chunk)
                decrypted_chunk = rsa.decrypt(encrypted_bytes, private_key)
                decrypted_chunks.append(decrypted_chunk.decode())
            
            decrypted_data = ''.join(decrypted_chunks)
            return json.loads(decrypted_data)
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {str(e)}")

# Key management functions
def setup_user_keys(username: str) -> None:
    """Generate and save keys for a new user."""
    public_key, private_key = CryptoUtils.generate_key_pair()
    CryptoUtils.save_keys(public_key, private_key, username)

def get_user_public_key(username: str) -> rsa.PublicKey:
    """Get user's public key."""
    public_key, _ = CryptoUtils.load_keys(username)
    return public_key

def get_user_private_key(username: str) -> rsa.PrivateKey:
    """Get user's private key."""
    _, private_key = CryptoUtils.load_keys(username)
    return private_key 