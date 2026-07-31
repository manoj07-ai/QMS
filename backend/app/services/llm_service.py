import json
import logging
import time
import httpx
from typing import Dict, Any, Optional, List
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.primary_model = settings.GROQ_MODEL or "gemma2-9b-it"
        self.fallback_model = settings.GROQ_FALLBACK_MODEL or "llama-3.3-70b-versatile"
        self.client = None

        if self.api_key:
            try:
                # Disable SSL verification for corporate proxy networks
                custom_http_client = httpx.Client(verify=False, timeout=15.0)
                self.client = Groq(api_key=self.api_key, http_client=custom_http_client)
                logger.info(f"Initialized Groq LLM client with primary model: {self.primary_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")

    def call_json_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """
        Executes live Groq LLM call enforcing JSON output.
        Tries primary model first, falls back to secondary model on failure.
        """
        if not self.client:
            raise ValueError("GROQ_API_KEY is not configured in backend/.env")

        models_to_try = [self.primary_model, self.fallback_model]
        last_exception = None

        for model in models_to_try:
            start_time = time.time()
            try:
                logger.info(f"Invoking Groq LLM model: {model}...")
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=2000,
                )
                latency_ms = int((time.time() - start_time) * 1000)
                raw_json = response.choices[0].message.content
                parsed = json.loads(raw_json)

                # Append execution metadata for observability
                parsed["_llm_meta"] = {
                    "model": model,
                    "latency_ms": latency_ms,
                    "prompt_tokens": getattr(response.usage, "prompt_tokens", 0),
                    "completion_tokens": getattr(response.usage, "completion_tokens", 0),
                    "total_tokens": getattr(response.usage, "total_tokens", 0),
                }

                logger.info(
                    f"✓ Groq call successful [{model}] in {latency_ms}ms "
                    f"({parsed['_llm_meta']['total_tokens']} tokens)"
                )
                return parsed

            except Exception as e:
                logger.warning(f"Groq LLM invocation failed on model {model}: {e}")
                last_exception = e

        raise RuntimeError(f"All Groq LLM models failed: {last_exception}")

    def call_chat_llm(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.3
    ) -> str:
        """
        Executes live Groq Chat LLM query with full conversation history context.
        """
        if not self.client:
            raise ValueError("GROQ_API_KEY is not configured in backend/.env")

        models_to_try = [self.primary_model, self.fallback_model]
        last_exception = None

        for model in models_to_try:
            start_time = time.time()
            try:
                formatted_msgs = [{"role": "system", "content": system_prompt}] + messages
                logger.info(f"Invoking Groq Chat LLM [{model}] with {len(messages)} messages...")
                response = self.client.chat.completions.create(
                    model=model,
                    messages=formatted_msgs,
                    temperature=temperature,
                    max_tokens=1000,
                )
                latency_ms = int((time.time() - start_time) * 1000)
                content = response.choices[0].message.content
                logger.info(f"✓ Groq Chat response generated [{model}] in {latency_ms}ms")
                return content
            except Exception as e:
                logger.warning(f"Groq Chat model {model} failed: {e}")
                last_exception = e

        raise RuntimeError(f"Groq Chat failed on all models: {last_exception}")

llm_service = LLMService()
