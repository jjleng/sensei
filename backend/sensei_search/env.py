import os
from pathlib import Path

from loguru import logger


def load_envs() -> None:
    from dotenv import load_dotenv

    if getattr(load_envs, "_loaded", False):
        return

    base_dir = Path(__file__).resolve().parent.parent

    env = os.getenv("ENV", "development")
    logger.info(f"Loading environment: {env}")

    if env == "development":
        dotenv_path = base_dir / ".env.development"
    elif env == "production":
        dotenv_path = base_dir / ".env.production"
    else:
        raise ValueError(f"Unknown environment: {env}")

    load_dotenv(dotenv_path)

    load_envs._loaded = True  # type: ignore
