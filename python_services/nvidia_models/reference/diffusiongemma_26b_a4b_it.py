import os
import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False

headers = {
    "Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY', '')}",
    "Accept": "text/event-stream" if stream else "application/json",
}

payload = {
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What is in this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://assets.ngc.nvidia.com/products/api-catalog/phi-3-5-vision/example1b.jpg"
          }
        }
      ]
    }
  ],
  "model": "google/diffusiongemma-26b-a4b-it",
  "chat_template_kwargs": {
    "enable_thinking": True
  },
  "max_tokens": 4096,
  "stream": stream,
  "temperature": 1,
  "top_p": 0.95
}

response = requests.post(invoke_url, headers=headers, json=payload, stream=stream)
if stream:
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))
else:
    print(response.json())