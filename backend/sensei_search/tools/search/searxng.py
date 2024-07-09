from __future__ import annotations

from urllib.parse import urljoin

from aiohttp import ClientSession

from sensei_search.config import SEARXNG_URL
from sensei_search.logger import logger
from sensei_search.tools.search.base import (
    Input,
    SearchTool,
    TopResults,
    filter_medium_by_accessibility,
    get_top_results,
)

MAX_RESULTS = 5


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


class SearxNG(SearchTool):

    @staticmethod
    async def search(args: Input) -> TopResults:
        """
        A search engine tool. Useful when you need to answer questions about nouns, current
        events or the current state of the world. To use the tool, you need to pass in parameters
        described by the OpenAPI spec.
        """

        logger.info("Searching with searxng_search_results_json")
        logger.debug(f"Calling searxng_search_results_json with args: {args}")

        query, categories = args.query, args.categories

        searxng_base_url = SEARXNG_URL

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
