import os
import requests
import base64

invoke_url = "https://ai.api.nvidia.com/v1/vlm/google/paligemma"
stream = True

SAMPLE_TINY_JPEG = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

image_path = os.getenv("SAMPLE_IMAGE_PATH", "dog.jpeg")
if os.path.exists(image_path):
    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()
else:
    image_b64 = SAMPLE_TINY_JPEG

headers = {
    "Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY', '')}",
    "Accept": "text/event-stream" if stream else "application/json"
}

payload = {
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Describe the image."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}"
                    }
                }
            ]
        }
    ],
    "max_tokens": 512,
    "temperature": 1.00,
    "top_p": 0.70,
    "stream": stream
}

response = requests.post(invoke_url, headers=headers, json=payload)

if stream:
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))
else:
    print(response.json())
