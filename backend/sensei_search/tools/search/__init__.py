from .base import *
from .bing import *
from .searxng import *
import os

def get_search_tool() -> SearchTool:
    env = os.getenv("ENV", "development")
    if env == "development":
        return SearxNG()
    else:
        return Bing()
