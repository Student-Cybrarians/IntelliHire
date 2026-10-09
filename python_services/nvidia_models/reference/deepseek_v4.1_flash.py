import json
import os
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = os.environ["NVIDIA_API_KEY"]
)

completion = client.chat.completions.create(
  model="deepseek-ai/deepseek-v4.1-flash",
  messages=[{"role":"user","content":[{"type":"text","text":"Describe the path in this image and propose the best way forward."},{"type":"image_url","image_url":{"url":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}}]}],
  temperature=1,
  top_p=0.95,
  max_tokens=262144,
  stream=False
)

print(completion.choices[0].message)