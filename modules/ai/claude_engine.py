import json
import os
import sys
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

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

    prompt = PromptTemplate(
        input_variables=["transcript", "jd"],
        template=SCORE_PROMPT + "\n\nTRANSCRIPT:\n{transcript}\n\nJD:\n{jd}",
    )

    chain = prompt | llm

    response = chain.invoke({"transcript": transcript, "jd": jd})
    result = response.content.strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"error": "Could not parse score", "raw": result}
