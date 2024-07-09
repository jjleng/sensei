import os

from sensei_search.env import load_envs

load_envs()

SEARXNG_URL = os.environ["SEARXNG_URL"]
REDIS_HOST = os.environ["REDIS_HOST"]
BING_API_KEY = os.environ["BING_API_KEY"]

# Small model
SM_MODEL_URL = os.environ["SM_MODEL_URL"]
SM_MODEL = os.environ["SM_MODEL"]
SM_MODEL_API_KEY = os.environ["SM_MODEL_API_KEY"]

# Medium model
MD_MODEL_URL = os.environ["MD_MODEL_URL"]
MD_MODEL = os.environ["MD_MODEL"]
MD_MODEL_API_KEY = os.environ["MD_MODEL_API_KEY"]
