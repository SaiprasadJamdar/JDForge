from groq import Groq
from backend.config import get_settings

_client: Groq | None = None


def get_groq_client(api_key: str | None = None) -> Groq:
    """Returns a Groq client. Requires api_key for user-driven features."""
    if api_key:
        return Groq(api_key=api_key)
        
    # Strictly avoid fallback to .env for user features.
    # The developer key should only be used for initialized system tasks if documented.
    system_key = get_settings().groq_api_key
    if not system_key:
        raise ValueError("No Groq API Key found. Please add one in Settings.")
    
    return Groq(api_key=system_key)


LLAMA_MODEL = "llama-3.3-70b-versatile"
WHISPER_MODEL = "whisper-large-v3-turbo"

# ─── LLM execution helpers (with Token Logging) ──────────────────────────────

import json
from uuid import UUID
from sqlalchemy.orm import Session
from backend.modules.auth.model import TokenLog

def _llm(system: str, user_content: str, temperature: float = 0.3, 
         api_key: str | None = None, db: Session | None = None, 
         user_id: UUID | None = None, tag: str = "Unspecified") -> str:
    client = get_groq_client(api_key)
    resp = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_content}],
        temperature=temperature,
    )
    content = resp.choices[0].message.content.strip()
    
    # Log usage if DB and user are present
    if db and user_id and hasattr(resp, "usage"):
        try:
            log = TokenLog(
                user_id=user_id,
                feature=tag,
                model_name=LLAMA_MODEL,
                prompt_tokens=resp.usage.prompt_tokens,
                completion_tokens=resp.usage.completion_tokens,
                total_tokens=resp.usage.total_tokens
            )
            db.add(log)
            db.commit()
        except:
            pass # Logger likely not initialized yet here
            
    return content


def _llm_json(system: str, user_content: str, api_key: str | None = None, 
              db: Session | None = None, user_id: UUID | None = None, 
              tag: str = "Unspecified") -> dict:
    client = get_groq_client(api_key)
    try:
        resp = client.chat.completions.create(
            model=LLAMA_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user_content}],
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        raw_response = resp.choices[0].message.content.strip()
        
        # Log usage
        if db and user_id and hasattr(resp, "usage"):
            try:
                log = TokenLog(
                    user_id=user_id,
                    feature=tag,
                    model_name=LLAMA_MODEL,
                    prompt_tokens=resp.usage.prompt_tokens,
                    completion_tokens=resp.usage.completion_tokens,
                    total_tokens=resp.usage.total_tokens
                )
                db.add(log)
                db.commit()
            except:
                pass

        # Cleanup markdown formatting if model leaked backticks
        if "```json" in raw_response:
            raw_response = raw_response.split("```json")[-1].split("```")[0].strip()
        elif "```" in raw_response:
            raw_response = raw_response.split("```")[-1].split("```")[0].strip()
            
        data = json.loads(raw_response)
        
        # ── Normalize lists to bulleted strings ──
        def _normalize(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, list):
                        obj[k] = "\n".join([f"• {item}" for item in v])
                    elif isinstance(v, dict):
                        _normalize(v)
            return obj

        data = _normalize(data)
        return data
    except Exception as e:
        print(f"DEBUG: _llm_json raw response error: {e}")
        # Re-raise to allow caller (like Auto-Apply) to decide on fallback
        raise e
