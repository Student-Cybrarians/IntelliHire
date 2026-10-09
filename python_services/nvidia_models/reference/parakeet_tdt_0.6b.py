import os

from openai import OpenAI


client = OpenAI(
	api_key=os.environ.get("NVIDIA_API_KEY", ""),
	base_url="https://integrate.api.nvidia.com/v1",
)

response = client.chat.completions.create(
	model="meta/llama-3.1-8b-instruct",
	messages=[{"role": "user", "content": "Hello"}],
)

print(response.choices[0].message.content)
