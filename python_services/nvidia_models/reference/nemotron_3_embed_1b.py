import os

from openai import OpenAI


client = OpenAI(
	base_url="https://integrate.api.nvidia.com/v1",
	api_key=os.environ.get("NVIDIA_API_KEY", ""),
)

response = client.embeddings.create(
	model="nvidia/nemotron-3-embed-1b",
	input=["Describe the document you want to embed."],
)

print(response.data[0].embedding)






















