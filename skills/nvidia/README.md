# NVIDIA Agent Skills for IntelliHire

This directory contains vendored agent skills from the official [NVIDIA Skills Repository](https://github.com/NVIDIA/skills).

## Licensing & Provenance

- **Upstream Source**: https://github.com/NVIDIA/skills
- **Licenses**:
  - Apache License 2.0 (`LICENSE-APACHE`) for code and configuration
  - Creative Commons Attribution 4.0 International (`LICENSE-CC-BY-4.0`) for documentation and skill specifications
- **Format**: Open Agent Skill Specification standard (`SKILL.md` with YAML frontmatter)

## Vendored Core Skills

We have selectively vendored 6 core skills that directly advance IntelliHire's AI recruiting, assessment, and candidate journey infrastructure:

| Skill Directory | Focus Area | IntelliHire Module Mapping | Architectural Role |
| :--- | :--- | :--- | :--- |
| `nemotron-retrieval-recipes` | Semantic Retrieval & RAG | **M01** (Resume Studio) & **M02** (Assessment) | Optimized chunking, dense vector retrieval with `nemotron-3-embed-1b`, and context reranking for resume-to-JD alignment. |
| `nemotron-customize` | Model Adaptation & Fine-Tuning | **M02** & **M03** (Technical Work Rounds) | Instruction fine-tuning recipes to align Nemotron models to specialized hiring taxonomies and multi-turn coding debriefs. |
| `nemotron-policy-generator` | Guardrails & Policy Generation | **Cross-Cutting Safety** & **M05** | Formulates deterministic safety policies for `llama-3.1-nemotron-safety-guard-8b-v3` to enforce compliance and eliminate prompt injection. |
| `nemotron-voice-agent-builder` | Conversational Voice Agent | **M04** (Candidate Interview) | Modular voice pipeline (ASR $\to$ LLM $\to$ TTS). Governed strictly under IntelliHire's invariant: verbatim transcription only, no facial/voice emotion scoring. |
| `rag-blueprint` | Production RAG Architecture | **M01** & **M05** (Evidence & Audit) | End-to-end blueprint for grounding assessment questions in verified candidate experience and authoritative skill standards. |
| `rag-eval` | Retrieval Evaluation & Grounding | **M05** (Final Review & Decision Invariant) | Evaluates context faithfulness and groundedness, ensuring model interpretations never invent unverified claims. |

## Full Catalog

For documentation on all 401 skills from the NVIDIA catalog, see [`docs/skills/NVIDIA_SKILLS_CATALOG.md`](../../docs/skills/NVIDIA_SKILLS_CATALOG.md).
