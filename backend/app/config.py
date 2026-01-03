import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Check if we are in a Docker environment
IS_DOCKER = os.environ.get("DOCKER_ENV") == "true"

class Settings(BaseSettings):
    """Loads and validates settings from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=None if IS_DOCKER else ".env", 
        extra="ignore"
    )

    DATABASE_URL: str
    RABBITMQ_URL: str
    REDIS_URL: str = "redis://redis:6379"

    # --- EMAIL CONFIG ---
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "theartifices25@gmail.com")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "ibxv wxnw ctin jhbg")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "theartifices25@gmail.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_FROM_NAME: str = "CYRA from CyberRakshak"
    ALIENVAULT_API_KEY: str = os.getenv("ALIENVAULT_API_KEY", "f0bcbec1ee4e\ce0b15a4693950b2932a889fd45f37b3fbb9b0221f22bd8a7462")

    # --- SECURITY CONFIG ---
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 
    
    # --- DEV MODE SWITCH ---
    # If True, the API will assume you are "admin" even without a token.
    AUTH_DISABLED: bool = True

    # --- RAG CONFIGURATION ---
    # Path to RAG storage directory
    RAG_STORAGE_PATH: str = os.getenv("RAG_STORAGE_PATH", "rag_storage/")
    
    # Fallback mode uses legacy single-index RAG
    RAG_FALLBACK_MODE: bool = os.getenv("RAG_FALLBACK_MODE", "false").lower() == "true"
    
    @staticmethod
    def get_index_version(source: str) -> str:
        """
        Get versioned index name from environment.
        
        Example: Set ACTIVE_CVE_INDEX=cve_2025_01_01 to use a dated index.
        Falls back to source name if not set.
        """
        env_key = f"ACTIVE_{source.upper()}_INDEX"
        return os.getenv(env_key, source)

settings = Settings()

