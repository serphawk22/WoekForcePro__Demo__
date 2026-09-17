"""
Application configuration settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings."""
    
    # Application
    APP_NAME: str = "WorkForce Pro API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"
    
    # Database - PostgreSQL required
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost/workforcepro")
    
    # JWT Authentication
    # Fail fast in production: a missing SECRET_KEY would silently sign tokens
    # with a well-known value.
    if os.getenv("SECRET_KEY"):
        SECRET_KEY: str = os.getenv("SECRET_KEY")
    else:
        _is_prod = (
            os.getenv("VERCEL_ENV") == "production"
            or os.getenv("RENDER_ENV") == "production"
        )
        if _is_prod:
            raise RuntimeError(
                "SECRET_KEY is required in production. Set it in your hosting "
                "platform's environment variables before deploying."
            )
        SECRET_KEY: str = "dev-only-insecure-secret-key-change-me"
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Cookie settings
    COOKIE_NAME: str = "access_token"
    COOKIE_HTTPONLY: bool = True
    COOKIE_SECURE: bool = False  # Set to True in production with HTTPS
    COOKIE_SAMESITE: str = "lax"


settings = Settings()
