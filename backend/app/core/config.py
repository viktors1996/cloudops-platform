from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CloudOps Platform API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "cloudops"
    POSTGRES_PORT: int = 5432

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def ASYNC_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()