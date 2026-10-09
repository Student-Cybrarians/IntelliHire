import os
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key=os.getenv("NVIDIA_API_KEY", "")
)

messages = [
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "</s><s><predict_bbox><predict_classes><output_markdown><predict_text_in_pic>"
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "https://assets.ngc.nvidia.com/products/api-catalog/nemoretriever-parse/example_1.jpg"
        }
      }
    ]
  }
]

completion = client.chat.completions.create(
  model="nvidia/nemotron-parse-2.0",
  messages=messages,
  temperature=0,
  top_p=1,
  max_tokens=1024,
  stream=False
)

print(completion.choices[0].message.content)

