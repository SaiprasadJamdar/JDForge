import json
import os
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from prompts import SCORE_PROMPT

load_dotenv()

def _llm():
    return ChatAnthropic(
        model="claude-sonnet-4-5",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        max_tokens=1000
    )

def score_jd_quality(transcript: str, jd: str) -> dict:
    llm = _llm()

    prompt = PromptTemplate(
        input_variables=["transcript", "jd"],
        template=SCORE_PROMPT + "\n\nTRANSCRIPT:\n{transcript}\n\nJD:\n{jd}"
    )

    chain = prompt | llm

    response = chain.invoke({
        "transcript": transcript,
        "jd": jd
    })

    result = response.content.strip()

    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"error": "Could not parse score", "raw": result}
