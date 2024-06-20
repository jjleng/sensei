from __future__ import annotations

import asyncio
import os
from enum import Enum
from typing import Any, List, Union
from urllib.parse import urljoin

from aiohttp import ClientSession
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from sensei_search.env import load_envs
from sensei_search.logger import logger

MAX_RESULTS = 5

load_envs()


class BaseResult(TypedDict):
    url: str
    title: str
    content: str
    engines: List[str]
    score: float
    category: str


class ImageResult(BaseResult):
    img_src: str


class VideoResult(BaseResult): ...


class GeneralResult(BaseResult): ...


class Category(str, Enum):
    general = "general"
    images = "images"
    videos = "videos"


class TopResults(TypedDict):
    general: List[GeneralResult]
    images: List[ImageResult]
    videos: List[VideoResult]


def get_top_results(
    results: List[Any], max_results: int, category: Category
) -> List[Union[GeneralResult, ImageResult, VideoResult]]:
    """
    This function retrieves the top results for a specific category based on the 'searxng' score.

    The 'searxng' score is a composite score calculated from:
    - The frequency of a link (how often it appears across different search engines)
    - The position of the link (how high it ranks in each search engine)
    - The weights assigned to each search engine

    The function returns the top 'max_results' items for the specified 'result_type'.
    """
    top_results: List[Union[GeneralResult, ImageResult, VideoResult]] = []

    for item in results:
        if item["category"] == category.value and len(top_results) < max_results:
            top_results.append(item)

        if len(top_results) == max_results:
            break

    return top_results


class Input(BaseModel):
    query: str = Field(
        ...,
        description="The best search query to help you find the information you need.",
    )
    categories: List[Category] = Field(
        [],
        description="By default, the search will return text results for you to get your answer. You can also specify images, videos, or maps to help users further with extra information. Specify this parameter when only needed.",
    )


async def filter_medium_by_scores(results: TopResults) -> TopResults:
    """
    Filter out low-score ('searxng' score) images and videos.
    """

    logger.info("Filtering medium by scores")
    # We want to use some heuristics to filter out low-quality results
    # Remove any images that have a score less than 1
    images = [image for image in results["images"] if float(image["score"] or 0) >= 1]

    # Remove any videos that have a score less than 4
    videos = [video for video in results["videos"] if float(video["score"] or 0) >= 4]

    results["images"] = images
    results["videos"] = videos

    return results


async def is_url_accessible(url: str) -> bool:
    async with ClientSession() as session:
        try:
            async with session.head(url) as response:
                return response.status == 200
        except:
            return False


async def filter_medium_by_accessibility(results: TopResults) -> TopResults:
    """
    Filter out images that are not accessible.
    """

    logger.info("Filtering medium by accessibility")
    # Only accessible images are returned
    images = results["images"]
    accessible_images = []

    tasks = [is_url_accessible(image["img_src"]) for image in images]

    accessibilities = await asyncio.gather(*tasks)

    for i, accessible in enumerate(accessibilities):
        if accessible:
            accessible_images.append(images[i])

    results["images"] = accessible_images
    return results


async def searxng_search_results_json(args: Input) -> TopResults:
    """
    A search engine tool. Useful when you need to answer questions about nouns, current
    events or the current state of the world. To use the tool, you need to pass in parameters
    described by the OpenAPI spec.
    """

    logger.info("Searching with searxng_search_results_json")
    logger.debug(f"Calling searxng_search_results_json with args: {args}")

    query, categories = args.query, args.categories

    searxng_base_url = os.environ.get("SEARXNG_URL")

    assert searxng_base_url, "SEARXNG_URL environment variable must be set"

    searxng_url = urljoin(searxng_base_url, "/search")

    params = {
        "q": query,
        "format": "json",
        "pageno": "1",
    }
    if categories:
        params["categories"] = ",".join(categories)

    async with ClientSession() as session:
        async with session.get(searxng_url, params=params) as response:
            logger.debug(f"Response status code: {response.status}")

            response.raise_for_status()
            result = await response.json()

    final: TopResults = {
        "general": [],
        "images": [],
        "videos": [],
    }

    for category in categories:
        final[category.value] = get_top_results(
            result["results"], MAX_RESULTS, category
        )

    logger.info("Calling searxng_search_results_json successfully")
    logger.debug(f"searxng_search_results_json returns: {result}")

    final = await filter_medium_by_scores(final)
    final = await filter_medium_by_accessibility(final)

    return final
