"""Minimal client for NVIDIA's hosted API."""

import json
import os
from urllib.request import Request, urlopen


NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_API_URL = os.getenv(
	"NVIDIA_API_URL", "https://integrate.api.nvidia.com/v1/chat/completions"
)


def chat_completion(
	messages: list[dict[str, str]],
	model: str = "meta/llama-3.1-8b-instruct",
	**options,
) -> dict:
	"""Send a chat-completion request to the NVIDIA API."""
	if not NVIDIA_API_KEY:
		raise RuntimeError("Set the NVIDIA_API_KEY environment variable first.")

	payload = {"model": model, "messages": messages, **options}
	request = Request(
		NVIDIA_API_URL,
		data=json.dumps(payload).encode("utf-8"),
		headers={
			"Authorization": f"Bearer {NVIDIA_API_KEY}",
			"Content-Type": "application/json",
			"Accept": "application/json",
		},
		method="POST",
	)
	with urlopen(request, timeout=60) as response:
		return json.loads(response.read().decode("utf-8"))


if __name__ == "__main__":
	result = chat_completion(
		[{"role": "user", "content": "Hello from NVIDIA API."}],
		max_tokens=32,
	)
	print(result["choices"][0]["message"]["content"])
