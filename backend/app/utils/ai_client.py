import os
import httpx
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration: Points to the RAG Chatbot (Instance B)
AI_SERVER_URL = os.getenv("AI_SERVER_URL", "http://10.0.0.51:8080/api/chat")

def clean_thinking_process(text: str) -> str:
    """
    Removes the <thinking>...</thinking> internal reasoning blocks 
    to provide a clean response to the user.
    """
    if not text:
        return ""
    # Regex to match <thinking> content, including newlines (DOTALL)
    cleaned = re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.DOTALL)
    return cleaned.strip()

async def generate_ai_response(prompt: str) -> str:
    """
    Sends the prompt to the internal AI Microservice asynchronously.
    Parses the specific JSON format from the RAG chatbot.
    """
    try:
        payload = {
            "query": prompt,
            "top_k": 3,
            "session_id": "default-session" 
        }

        logger.info(f"Sending request to AI Server at: {AI_SERVER_URL}")

        # Use AsyncClient with a long timeout for AI generation
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(AI_SERVER_URL, json=payload)

        # --- DEBUG LOGGING ADDED HERE ---
        logger.info(f"AI Server Status Code: {response.status_code}")
        logger.info(f"AI Server Raw Response Body: {response.text}")
        # --------------------------------

        # Handle Successful Response
        if response.status_code == 200:
            data = response.json()
            
            # 1. Extract the answer
            raw_answer = data.get("answer")
            
            # Fallback if 'answer' key is missing
            if not raw_answer:
                raw_answer = data.get("response", "No content received from AI.")
                logger.warning("Key 'answer' not found in response. Used 'response' fallback.")

            # 2. Clean up the <thinking> tags
            final_answer = clean_thinking_process(raw_answer)
            
            logger.info("Successfully processed AI response.")
            return final_answer

        # Handle Non-200 Responses
        error_msg = f"AI Server Error ({response.status_code}): {response.text}"
        logger.error(error_msg)
        return f"System: Unable to generate response. (Status: {response.status_code})"

    except httpx.ConnectError:
        msg = "System: Connection Refused: The AI Server is unreachable."
        logger.error(msg)
        return msg
    except Exception as e:
        logger.error(f"AI connection failed: {e}")
        return "System: An internal error occurred while contacting the AI."
