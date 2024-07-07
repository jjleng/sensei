from __future__ import annotations

import inspect
import uuid
from typing import Callable, Dict, get_type_hints

from openai.types.chat import ChatCompletionToolParam
from pydantic import BaseModel, TypeAdapter
from slugify import slugify


def create_slug(input_string: str, max_length: int = 30) -> str:
    """
    Creates a URL-friendly, capped-length, and unique slug from the given input string.
    """
    base_slug = slugify(input_string)[:max_length].rstrip("-")
    unique_suffix = str(uuid.uuid4())
    unique_slug = f"{base_slug}-{unique_suffix}"

    return unique_slug


def fix_enum_references(schema: Dict) -> Dict:
    if "properties" in schema:
        for _, prop_value in schema["properties"].items():
            if "items" in prop_value and "$ref" in prop_value["items"]:
                ref = prop_value["items"]["$ref"].split("/")[-1]
                if ref in schema["$defs"]:
                    enum_def = schema["$defs"][ref]
                    if "enum" in enum_def:
                        prop_value["items"] = {
                            "type": "string",
                            "enum": enum_def["enum"],
                        }
    return schema


def to_openapi_spec(func: Callable) -> ChatCompletionToolParam:
    """
    This function uses reflection to obtain the signature of the 'func' function
    and returns it in the form of an OpenAPI specification.

    The OpenAPI specification is used here to provide a way for the Language Model (LLM) to
    understand how to call a user-defined tool. While there's no universally accepted
    method for representing a function signature in this context, the OpenAPI specification
    is relatively more adopted in both closed and open-source models.
    """
    sig = inspect.signature(func)
    params = list(sig.parameters.values())
    if len(params) != 1:
        raise TypeError("Function must have exactly one parameter")

    param = params[0]
    input_model = get_type_hints(func).get(param.name)

    if not issubclass(input_model, BaseModel):  # type: ignore
        raise TypeError("Input type must be a subclass of pydantic.BaseModel")

    type_adapter = TypeAdapter(input_model)
    input_schema = type_adapter.json_schema()
    input_schema = fix_enum_references(input_schema)

    properties = input_schema.get("properties", {})
    required = input_schema.get("required", [])

    description = inspect.cleandoc(func.__doc__ or "").replace("\n", " ")

    # Build a custom OpenAPI spec, might not fully comply with the OpenAPI spec
    custom_openapi_spec: ChatCompletionToolParam = ChatCompletionToolParam(
        type="function",
        function={
            "name": func.__name__,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
            },
        },
    )

    return custom_openapi_spec
