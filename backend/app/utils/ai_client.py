import os
import httpx
import json
import logging

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL")

async def generate_ai_response(payload: dict) -> str:
    """
    Sends the Unified JSON Context to the remote AI Brain.
    Includes extended timeouts and debug logging.
    """
    if not AI_SERVICE_URL:
        return json.dumps({
            "mode": "TROUBLESHOOTING_MODE",
            "analysis_summary": "System Error: AI_SERVICE_URL is not configured in backend .env."
        })

    url = f"{AI_SERVICE_URL.rstrip('/')}/v1/pentest-analyze"
    
    # Headers to bypass Ngrok warning and ensure JSON
    headers = {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    }

    # EXTENDED TIMEOUT: 300 seconds (5 minutes) to allow long generations
    timeout_config = httpx.Timeout(300.0, connect=60.0)

    try:
        logger.info(f"Sending payload to AI Brain: {url} (Timeout: 300s)")
        
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            response = await client.post(url, json=payload, headers=headers)
            
        if response.status_code == 200:
            try:
                result = response.json()
                logger.info("AI Brain response received successfully.")
                
                # Handle old format {"analysis": "..."} vs new direct JSON
                if "analysis" in result:
                    content = result["analysis"]
                    if isinstance(content, str) and content.strip().startswith("{"):
                        try: 
                            return json.dumps(json.loads(content)) 
                        except: 
                            pass
                    return json.dumps(content) if not isinstance(content, str) else content

                return json.dumps(result)

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from AI: {response.text[:500]}")
                return json.dumps({
                    "mode": "TROUBLESHOOTING_MODE",
                    "analysis_summary": "Error: AI returned invalid data (parsing failed)."
                })
        else:
            logger.error(f"AI Error Status: {response.status_code} - {response.text[:200]}")
            return json.dumps({
                "mode": "TROUBLESHOOTING_MODE",
                "analysis_summary": f"System Error: AI Brain returned status {response.status_code}."
            })

    except httpx.ReadTimeout:
        logger.error("AI Timeout: The model took too long to generate a response.")
        return json.dumps({
            "mode": "TROUBLESHOOTING_MODE",
            "analysis_summary": "Timeout Error: The AI is thinking too hard. Try a simpler query or request a shorter response."
        })
    except Exception as e:
        logger.error(f"AI Connection Exception: {type(e).__name__} - {str(e)}")
        return json.dumps({
            "mode": "TROUBLESHOOTING_MODE",
            "analysis_summary": f"Connection Error: {str(e)}"
        })
