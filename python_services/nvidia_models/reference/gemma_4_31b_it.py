import os
import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False

headers = {
    "Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY', '')}",
    "Accept": "text/event-stream" if stream else "application/json",
}

payload = {
  "model": "google/gemma-4-31b-it",
  "max_tokens": 1024,
  "stream": stream,
  "temperature": 0.5,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "seed": 0,
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is 17 * 23?"
    }
  ]
}

response = requests.post(invoke_url, headers=headers, json=payload, stream=stream)
if stream:
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))
else:
    print(response.json())