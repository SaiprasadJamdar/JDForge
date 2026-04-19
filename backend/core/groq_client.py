from groq import Groq
from backend.config import get_settings

_client: Groq | None = None


def get_groq_client(api_key: str | None = None) -> Groq:
    """Returns a Groq client. If api_key is provided, creates a new instance (dynamic). 
    Otherwise returns a singleton using the system key."""
    global _client
    if api_key:
        return Groq(api_key=api_key)
        
    if _client is None:
        _client = Groq(api_key=get_settings().groq_api_key)
    return _client


LLAMA_MODEL = "llama-3.3-70b-versatile"
WHISPER_MODEL = "whisper-large-v3-turbo"
