import json
import os
import sys
from dotenv import load_dotenv
from langchain_groq import ChatGroq

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from prompts import SCORE_PROMPT

load_dotenv()

GROQ_MODEL = "llama-3.3-70b-versatile"


def score_jd_quality(transcript: str, jd: str) -> dict:
    llm = ChatGroq(
        model=GROQ_MODEL,
        api_key=os.environ.get("GROQ_API_KEY"),
        max_tokens=1000,
        temperature=0.0,
    )

    user_message = f"{SCORE_PROMPT}\n\nTRANSCRIPT:\n{transcript}\n\nJD:\n{jd}"

    response = llm.invoke([{"role": "user", "content": user_message}])
    result = response.content.strip()

    if "--- JSON ---" in result:
        parts = result.split("--- JSON ---", 1)
        report = parts[0].strip()
        json_text = parts[1].strip()
    else:
        report = result
        json_text = ""

    try:
        scores = json.loads(json_text)
    except json.JSONDecodeError:
        scores = {"error": "Could not parse scores", "raw": json_text}

    return {"report": report, "scores": scores}
