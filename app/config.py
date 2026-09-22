from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "NestSpot"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = (
        "Modern neighborhood & residential parking sharing platform with "
        "interactive map, guest permits, and real-time ETA alerts."
    )
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Default complex info
    DEFAULT_COMPLEX_NAME: str = "Aura Park Evleri"
    DEFAULT_TOTAL_BLOCKS: int = 2
    DEFAULT_TOTAL_SPOTS: int = 24


settings = Settings()
