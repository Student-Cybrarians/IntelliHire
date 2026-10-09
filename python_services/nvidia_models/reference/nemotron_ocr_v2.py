import os
import requests
import base64

invoke_url = "https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v2"

# 1x1 pixel PNG placeholder fallback if no local file is provided
SAMPLE_TINY_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

image_path = os.getenv("SAMPLE_IMAGE_PATH", "paddleocr1.png")
if os.path.exists(image_path):
    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()
else:
    image_b64 = SAMPLE_TINY_PNG

headers = {
    "Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY', '')}",
    "Accept": "application/json"
}

payload = {
    "input": [
        {
            "type": "image_url",
            "url": f"data:image/png;base64,{image_b64}"
        }
    ]
}

response = requests.post(invoke_url, headers=headers, json=payload)
print(response.json())
