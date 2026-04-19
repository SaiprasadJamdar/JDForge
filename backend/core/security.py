from cryptography.fernet import Fernet
from backend.config import get_settings

def get_fernet() -> Fernet:
    settings = get_settings()
    # Ensure the key is exactly 32 url-safe base64-encoded bytes.
    # If the provided key is invalid, Fernet will raise an error.
    return Fernet(settings.encryption_key.encode())

def encrypt_key(plain_text: str | None) -> str | None:
    if not plain_text:
        return None
    f = get_fernet()
    return f.encrypt(plain_text.encode()).decode()

def decrypt_key(cipher_text: str | None) -> str | None:
    if not cipher_text:
        return None
    try:
        f = get_fernet()
        return f.decrypt(cipher_text.encode()).decode()
    except Exception:
        # If decryption fails (e.g. key mismatch), return None or original
        # During migration, we might have mixed plain/cipher text
        return None
