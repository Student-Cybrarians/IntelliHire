# NVIDIA Model API Reference Examples

This directory contains sanitized, standalone reference scripts for 17 NVIDIA API models downloaded from the NVIDIA API catalog.

## Security & Sanitization Notice

All scripts in this directory have been sanitized in accordance with IntelliHire security standards:
- **Zero hardcoded credentials**: All credentials use `os.getenv("NVIDIA_API_KEY")`.
- **Zero hardcoded endpoints**: Base URLs default to `https://integrate.api.nvidia.com/v1` or are configurable via `os.getenv("NVIDIA_BASE_URL")`.
- **Lean payloads**: Embedded multi-hundred-kilobyte binary payloads have been externalized to sample inputs or configurable paths.
- **Syntactically verified**: Every file compiles cleanly with Python 3.10+.

## Requirements

To run any reference script directly:

```bash
export NVIDIA_API_KEY="your_api_key_here"
# On Windows PowerShell:
$env:NVIDIA_API_KEY="your_api_key_here"
```

Required Python dependencies:
- `openai>=1.0.0` (for OpenAI-compatible endpoints)
- `requests` (for direct REST endpoints)

## Inventory of Reference Scripts

1. `paligemma.py` — Vision-Language Model (`google/paligemma`)
2. `chatterbox_multilingual_tts.py` — Multilingual Text-to-Speech (`nvidia/chatterbox-multilingual-tts`)
3. `deepseek_v4.1_flash.py` — High-speed multimodal LLM (`deepseek-ai/deepseek-v4.1-flash`)
4. `diffusiongemma_26b_a4b_it.py` — Multimodal instruction model with thinking trace (`google/diffusiongemma-26b-a4b-it`)
5. `gemma_4_31b_it.py` — Instruction-following LLM (`google/gemma-4-31b-it`)
6. `kimi_k3.py` — High-depth reasoning vision-language model (`moonshotai/kimi-k3`)
7. `kumo_tabular.py` — Tabular data reasoning model (`meta/llama-3.1-8b-instruct`)
8. `llama_3.1_nemotron_safety_guard_8b_v3.py` — AI Content & Prompt Safety Guardrail (`nvidia/llama-3.1-nemotron-safety-guard-8b-v3`)
9. `muse_glimmer_30b.py` — Evaluation and instruction LLM (`meta/muse-glimmer-30b`)
10. `nemotron_3_embed_1b.py` — Text Embedding Model (`nvidia/nemotron-3-embed-1b`)
11. `nemotron_3_nano_omni_30b_a3b_reasoning.py` — Cognitive reasoning model with reasoning budget (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`)
12. `nemotron_3_ultra_550b_a55b.py` — MoE frontier LLM with reasoning delta streaming (`nvidia/nemotron-3-ultra-550b-a55b`)
13. `nemotron_3.5_lightning_30b_a3b.py` — Low-latency reasoning MoE (`nvidia/nemotron-3.5-lightning-30b-a3b`)
14. `nemotron_ocr_v2.py` — Computer Vision OCR (`nvidia/nemotron-ocr-v2`)
15. `nemotron_parse_2.0.py` — Document Structure & Markdown Parser (`nvidia/nemotron-parse-2.0`)
16. `parakeet_tdt_0.6b.py` — Speech Recognition / ASR wrapper (`nvidia/parakeet-tdt-0.6b`)
17. `riva_translate_4b_instruct_v2.py` — Multilingual translation model (`riva-translate-4b-instruct-v2`)
