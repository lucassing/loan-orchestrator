# orchestrator/agents.py
import os
import requests
from typing import Iterable
from django.conf import settings
import logging
logger = logging.getLogger(__name__)

class LLMException(Exception):
    pass

def risky_by_keywords(text: str, keywords: Iterable[str]) -> bool:
    if not text:
        return False
    low = text.lower()
    return any(kw.lower() in low for kw in keywords)


def risky_by_deepseek(text: str, *, threshold: float = 0.5) -> bool:
    """
    Classify loan purpose text using DeepSeek R1 (via OpenRouter).
    Returns True if message content includes 'risky' (case-insensitive).
    Falls back to False if API unavailable or any error.
    """
    if not (settings.OPENROUTER_API_KEY and text):
        return False

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "X-Title": "Loan Orchestrator",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.OPENROUTER_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a loan-risk classifier. "
                            "Return only one word: 'RISKY' if the purpose suggests gambling, crypto speculation, "
                            "scam, or other financial risk. Otherwise, return 'SAFE'."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Classify this loan purpose as RISKY or SAFE:\n{text}",
                    },
                ],
                "temperature": 0,
                "max_tokens": 1000,
            },
            timeout=20,
        )
        data = resp.json()

        if resp.status_code != 200:
            raise LLMException(data.get("error"))

        answer = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
            .lower()
        )
        return "risky" in answer
    except Exception as e:
        logger.warning(f"[DeepSeek] classification failed: {e}")
        raise e
