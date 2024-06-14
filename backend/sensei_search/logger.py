from sensei_search.env import load_envs

# Need to load envs before importing the loguru logger for env var LOGURU_LEVEL to work
load_envs()

from loguru import logger
