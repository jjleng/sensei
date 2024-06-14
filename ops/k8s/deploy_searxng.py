import platform
import secrets
import string
import subprocess
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from paka.cluster.kubectl import KUBECTL_VERSION, ensure_kubectl_by_path # type: ignore[import-untyped]

REDIS_NAME = "searxng-redis"

current_file_path = Path(__file__).resolve()
cwd = current_file_path.parent


def ensure_kubectl() -> Path:
    system = platform.system().lower()
    bin_dir = cwd / ".bin"
    kubectl_path = bin_dir / f"kubectl-{KUBECTL_VERSION}" / "kubectl"
    if system == "windows":
        kubectl_path = kubectl_path.with_suffix(".exe")
    ensure_kubectl_by_path(kubectl_path)
    return kubectl_path


kubectl_path = ensure_kubectl()


def generate_random_string(length: int) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def execute_kubectl_command(kubectl_path: Path, command: str, config: str):
    full_command = [str(kubectl_path), command, "-f", "-"]

    process = subprocess.run(full_command, input=config, text=True, capture_output=True)

    if process.returncode != 0:
        print(f"Error executing kubectl command: {process.stderr}")
    else:
        print(process.stdout)


def kubectl_apply(config: str):
    execute_kubectl_command(kubectl_path, "apply", config)


def gen_deployment_yaml() -> str:
    template_dir = cwd / "searxng"
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("deployment.yaml.j2")
    variables = {
        "searxng_secret": generate_random_string(15),
        "redis_name": REDIS_NAME,
    }

    rendered_template = template.render(variables)

    return rendered_template


def gen_redis_yaml() -> str:
    template_dir = cwd / "searxng"
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("redis.yaml.j2")
    variables = {
        "redis_name": REDIS_NAME,
    }

    rendered_template = template.render(variables)

    return rendered_template


def gen_configmap_yaml() -> str:
    template_dir = cwd / "searxng"
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("configmap.yaml.j2")
    variables = {
        "searxng_safe_search": 1,
    }

    rendered_template = template.render(variables)

    return rendered_template


if __name__ == "__main__":
    kubectl_apply(gen_configmap_yaml())
    kubectl_apply(gen_redis_yaml())
    kubectl_apply(gen_deployment_yaml())
