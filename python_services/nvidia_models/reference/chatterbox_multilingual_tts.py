"""Generate speech with NVIDIA's Chatterbox Multilingual TTS endpoint."""

import argparse
import base64
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


NVIDIA_API_URL = os.getenv(
	"NVIDIA_TTS_URL",
	"https://integrate.api.nvidia.com/v1/audio/speech",
)
NVIDIA_MODEL = os.getenv("NVIDIA_TTS_MODEL", "nvidia/chatterbox-multilingual-tts")


def synthesize(text, output_path="output.wav", voice="default", language="en-US"):
	api_key = os.getenv("NVIDIA_API_KEY")
	if not api_key:
		raise RuntimeError("NVIDIA_API_KEY is not set.")

	payload = json.dumps({
		"model": NVIDIA_MODEL,
		"input": text,
		"voice": voice,
		"language": language,
		"response_format": "wav",
	}).encode("utf-8")
	request = Request(
		NVIDIA_API_URL,
		data=payload,
		headers={
			"Authorization": f"Bearer {api_key}",
			"Content-Type": "application/json",
			"Accept": "audio/wav, application/json",
		},
		method="POST",
	)

	try:
		with urlopen(request, timeout=120) as response:
			audio = response.read()
			content_type = response.headers.get_content_type()
	except HTTPError as error:
		detail = error.read().decode("utf-8", errors="replace")
		raise RuntimeError(f"NVIDIA API error {error.code}: {detail}") from error
	except URLError as error:
		raise RuntimeError(f"Unable to connect to NVIDIA API: {error.reason}") from error

	if content_type == "application/json":
		result = json.loads(audio)
		encoded_audio = result.get("audio") or result.get("data")
		if not encoded_audio:
			raise RuntimeError(f"NVIDIA API returned no audio: {result}")
		audio = base64.b64decode(encoded_audio)

	with open(output_path, "wb") as output:
		output.write(audio)


if __name__ == "__main__":
	parser = argparse.ArgumentParser()
	parser.add_argument("text")
	parser.add_argument("-o", "--output", default="output.wav")
	parser.add_argument("--voice", default="default")
	parser.add_argument("--language", default="en-US")
	args = parser.parse_args()
	synthesize(args.text, args.output, args.voice, args.language)
