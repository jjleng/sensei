from __future__ import annotations

import asyncio
import os
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, List, Union
from urllib.parse import urljoin

from aiohttp import ClientSession
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from sensei_search.logger import logger


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


async def is_url_accessible(url: str) -> bool:
    async with ClientSession() as session:
        try:
            async with session.head(url) as response:
                return response.status == 200
        except:
            return False


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


class Input(BaseModel):
    query: str = Field(
        ...,
        description="The best search query to help you find the information you need.",
    )
    categories: List[Category] = Field(
        [],
        description=(
            "The search functionality categorizes results into three types: 'general', 'images', and 'videos'. "
            "The 'general' category returns text and links, 'images' returns image results, and 'videos' returns video content. "
            "Specify 'images' and 'videos' alongside 'general' to enrich the search results with additional visual content "
            'when it adds value. For instance, for a query like "Joe Biden Biography", specifying all three categories '
            "['general', 'images', 'videos'] would be beneficial."
        ),
    )


class SearchTool(ABC):

    @staticmethod
    @abstractmethod
    async def search(args: Input) -> TopResults:
        pass
