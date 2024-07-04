from typing import List, Optional, Union

from typing_extensions import TypedDict


class WebResult(TypedDict):
    url: str
    title: str
    content: str


class MediumVideo(TypedDict):
    url: str
    medium: str


class MediumImage(TypedDict):
    url: str
    image: str
    medium: str


class MetaData(TypedDict):
    has_math: bool


class ChatHistoryItem(TypedDict, total=False):
    id: str
    thread_id: str
    mediums: List[Union[MediumImage, MediumVideo]]
    web_results: List[WebResult]
    query: str
    answer: str
    metadata: Optional[MetaData]


class ThreadMetadata(TypedDict):
    name: str
    user_id: str
    created_at: str
    slug: str
    related_questions: List[str]


class ChatThread(TypedDict):
    thread_id: str
    chat_history: List[ChatHistoryItem]
    metadata: ThreadMetadata
