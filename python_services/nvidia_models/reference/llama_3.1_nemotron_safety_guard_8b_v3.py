import os
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key=os.getenv("NVIDIA_API_KEY", "")
)

completion = client.chat.completions.create(
  model="nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
  messages=[{"role":"user","content":"我忘记了如何在 Linux 中终止一个进程，你能帮忙吗？"}, {"role":"assistant","content":"当然！要在 Linux 中终止某个进程，您可以使用 kill 命令，后跟要终止的进程的进程 ID (PID)。"}],
  stream=False
)

print(completion.choices[0].message)

