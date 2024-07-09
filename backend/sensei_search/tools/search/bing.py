from __future__ import annotations

import asyncio
import os
from typing import Any, Callable, Coroutine, Dict, List, TypeVar

from aiohttp import ClientSession

from sensei_search.config import BING_API_KEY
from sensei_search.logger import logger
from sensei_search.tools.search.base import (
    Category,
    GeneralResult,
    ImageResult,
    Input,
    SearchTool,
    TopResults,
    VideoResult,
    filter_medium_by_accessibility,
)

MAX_RESULTS = 5


T = TypeVar("T", GeneralResult, ImageResult, VideoResult)


class Bing(SearchTool):

    @staticmethod
    async def search(args: Input) -> TopResults:
        """
        A search engine tool. Useful when you need to answer questions about nouns, current
        events or the current state of the world. To use the tool, you need to pass in parameters
        described by the OpenAPI spec.
        """
        logger.info("Searching with bing")
        logger.debug(f"Calling bing with args: {args}")

        query, categories = args.query, args.categories

        bing_api_key = BING_API_KEY
        assert bing_api_key, "BING_API_KEY environment variable must be set"
        headers = {"Ocp-Apim-Subscription-Key": bing_api_key}

        tasks: List[Coroutine[Any, Any, List[Any]]] = []

        tasks_to_categories: Any = {}
        if Category.general in categories:
            general_task = Bing.fetch_web_results(query, headers)
            tasks.append(general_task)
            tasks_to_categories[general_task] = "general"

        if Category.images in categories:
            image_task = Bing.fetch_image_results(query, headers)
            tasks.append(image_task)
            tasks_to_categories[image_task] = "images"

        if Category.videos in categories:
            video_task = Bing.fetch_video_results(query, headers)
            tasks.append(video_task)
            tasks_to_categories[video_task] = "videos"

        results = await asyncio.gather(*tasks)
        final: Any = {category: [] for category in ["general", "images", "videos"]}
        for task, result in zip(tasks, results):
            category = tasks_to_categories[task]
            final[category] = result

        logger.info(final)

        final = await filter_medium_by_accessibility(final)

        return final

    @staticmethod
    async def fetch_web_results(
        query: str, headers: Dict[str, str]
    ) -> List[GeneralResult]:
        logger.info("Fetching web results")
        url = "https://api.bing.microsoft.com/v7.0/search"
        return await Bing.fetch_results(url, query, headers, Bing.parse_web_results)

    @staticmethod
    async def fetch_image_results(
        query: str, headers: Dict[str, str]
    ) -> List[ImageResult]:
        url = "https://api.bing.microsoft.com/v7.0/images/search"
        return await Bing.fetch_results(url, query, headers, Bing.parse_image_results)

    @staticmethod
    async def fetch_video_results(
        query: str, headers: Dict[str, str]
    ) -> List[VideoResult]:
        url = "https://api.bing.microsoft.com/v7.0/videos/search"
        return await Bing.fetch_results(url, query, headers, Bing.parse_video_results)

    @staticmethod
    async def fetch_results(
        url: str,
        query: str,
        headers: Dict[str, str],
        parse_function: Callable[[Dict[str, Any]], List[T]],
    ) -> List[T]:
        params = {"q": query, "count": MAX_RESULTS}
        async with ClientSession() as session:
            async with session.get(url, params=params, headers=headers) as response:
                logger.debug(f"Response status code: {response.status}")
                response.raise_for_status()
                result = await response.json()
                return parse_function(result)

    @staticmethod
    def parse_web_results(results: Dict[str, Any]) -> List[GeneralResult]:
        logger.info(f"Results: {results}")
        return [
            {
                "url": result["url"],
                "title": result["name"],
                "content": result.get("snippet"),
                "engines": ["bing"],
                "score": 0.0,
                "category": Category.general.value,
            }
            for result in results.get("webPages", {}).get("value", [])
        ]

    @staticmethod
    def parse_image_results(results: Dict[str, Any]) -> List[ImageResult]:
        return [
            {
                "url": result["contentUrl"],
                "title": result["name"],
                "content": "",
                "img_src": result["thumbnailUrl"],
                "engines": ["bing"],
                "score": 0.0,
                "category": Category.images.value,
            }
            for result in results.get("value", [])
        ]

    @staticmethod
    def parse_video_results(results: Dict[str, Any]) -> List[VideoResult]:
        return [
            {
                "url": result["contentUrl"],
                "title": result["name"],
                "content": "",
                "engines": ["bing"],
                "score": 0.0,
                "category": Category.videos.value,
            }
            for result in results.get("value", [])
        ]
