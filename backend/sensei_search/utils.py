from slugify import slugify
import uuid

def create_slug(input_string: str, max_length: int=30) -> str:
    """
    Creates a URL-friendly, capped-length, and unique slug from the given input string.
    """
    base_slug = slugify(input_string)[:max_length].rstrip('-')
    unique_suffix = str(uuid.uuid4())
    unique_slug = f"{base_slug}-{unique_suffix}"

    return unique_slug