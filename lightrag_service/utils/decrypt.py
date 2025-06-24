from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
import base64


def load_private_key() -> rsa.RSAPrivateKey:
    key_path = "private_key.pem"
    with open(key_path, "r") as f:
        private_key = serialization.load_pem_private_key(
            f.read().encode(), password=None
        )
    return private_key


PRIVATE_KEY = load_private_key()


def decrypt_str(encrypted_str: str):
    return PRIVATE_KEY.decrypt(
        base64.b64decode(encrypted_str),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    ).decode("utf-8")
