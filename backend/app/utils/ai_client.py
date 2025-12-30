import os
import httpx
import logging

logger = logging.getLogger(__name__)

# This comes from your OCI .env file
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")

async def generate_ai_response(prompt: str) -> str:
    """
    Bridge function to send prompts to the remote Qwen 7B model on Colab.
    Matches the function name expected by chat_assistant.py.
    """
    if not AI_SERVICE_URL:
        return "System Error: AI_SERVICE_URL is not set in your .env file."

    # We send the prompt under the 'data' key which our Colab script expects
    payload = {"data": prompt}
    
    # Ensure URL formatting is correct
    url = f"{AI_SERVICE_URL.rstrip('/')}/v1/pentest-analyze"

    try:
        logger.info(f"Sending request to Colab AI at: {url}")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            
        if response.status_code == 200:
            result = response.json()
            # Our Colab script returns the answer in the 'analysis' key
            return result.get("analysis", "No analysis content received.")
        else:
            return f"System Error: AI Brain returned status {response.status_code}"

    except Exception as e:
        logger.error(f"AI connection failed: {e}")
        return f"System Error: Could not connect to Colab. Ensure the Colab notebook is running. ({str(e)})"
