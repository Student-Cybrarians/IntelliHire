# Official NVIDIA Agent Skills Catalog & Architectural Mapping

## Executive Summary

- **Upstream Repository**: https://github.com/NVIDIA/skills
- **Total Catalog Size**: 401 agent skills across NVIDIA platforms
- **Licensing**: Dual-licensed under Apache 2.0 (`LICENSE-APACHE`) and Creative Commons Attribution 4.0 International (`LICENSE-CC-BY-4.0`)
- **Standard**: Follows the Open Agent Skills specification (`SKILL.md` with YAML frontmatter)

## IntelliHire Architecture Mapping

IntelliHire integrates NVIDIA skills to supercharge its multi-stage hiring and evaluation pipeline while strictly enforcing its constitutional governance invariants:

| IntelliHire Lifecycle Phase | NVIDIA Skill Families | Strategic Function | Governance Invariant |
| :--- | :--- | :--- | :--- |
| **M01: Resume Studio & Ingestion** | `nemotron-retrieval-recipes`, `rag-blueprint`, `tao-train-ocrnet` | Document OCR, structured layout extraction, dense semantic skill parsing | Evidence-First: Distinguish extracted candidate facts from model interpretation |
| **M02: Assessment & Adaptive Testing** | `nemotron-customize`, `rag-eval`, `nemotron-policy-generator` | Taxonomy-aligned item generation, deterministic rubric validation | Bayesian Proficiency: Uncertainty tracking per competency |
| **M03: Universal Technical Work Rounds** | `nemotron-customize`, `launch-nemo-rl`, `nemotron-retrieval-recipes` | Continuous work round intelligence, multi-surface execution debriefs | One Task at a Time: Deep feedback, misconception explanation |
| **M04: Candidate Interview Engine** | `nemotron-voice-agent-builder`, `nemotron-speech`, `nemotron-asr-finetune` | Conversational verbal interviews, high-accuracy verbatim ASR transcription | **NO BIOMETRIC/EMOTION SCORING**: Strict ban on facial/vocal affect inference |
| **M05: Final Review & Decision Package** | `rag-eval`, `nemotron-policy-generator` | Faithfulness scoring, hallucination mitigation, audit packaging | **THE HUMAN AUTHORITY INVARIANT**: AI advises; humans decide |

## Core Vendored Skills in IntelliHire

The following 6 foundational skills are vendored directly in `skills/nvidia/`:
1. `nemotron-retrieval-recipes`: Advanced dense retrieval, context window management, and reranking recipes.
2. `nemotron-customize`: Fine-tuning workflows and alignment recipes for enterprise domain customization.
3. `nemotron-policy-generator`: Guardrail policy derivation for strict compliance and prompt safety.
4. `nemotron-voice-agent-builder`: Modular architecture for speech-to-speech agent pipelines.
5. `rag-blueprint`: Reference architecture for high-precision retrieval augmented generation.
6. `rag-eval`: Evaluation framework for grounding, factuality, and context recall.

## Comprehensive 401 Skills Index by Category

### TAO Toolkit (Transfer Learning, Vision & Perception) (75 skills)

| Skill Name | Description |
| :--- | :--- |
| `tao-analyze-changenet-rca` | Performs deep Root Cause Analysis (RCA) on NVIDIA TAO Visual ChangeNet classification experiments with |
| `tao-analyze-detection-kpi` | >- |
| `tao-analyze-gaps-od-map` | >- |
| `tao-analyze-gaps-visual-changenet` | Performs gap analysis on NVIDIA TAO VCN Classify (Visual Component Net) experiments by invoking the pinned TAO data-services container directly via `docker run … gap_analysis vcn_aoi …` — picks the optimal decision threshold, ranks per-sample weakness, and emits a top-K weakest parquet expanded per-lighting for downstream augmentation. Use when analyzing VCN classification failures, picking SDA augmentation targets, or auditing PASS/NO_PASS boundary cases. |
| `tao-analyze-gaps-vlm-bcq` | Extract false-positive and false-negative gaps from VLM binary-classification-question (BCQ, yes/no) predictions. |
| `tao-artifacts` | The contract home for TAO's SDK-free execution pipeline — authoritative JSON Schemas for the four typed artifacts (spec-bundle, job-record, results_dir layout, best_rec) plus the fixed job-status vocabulary and the nested-not-dotted spec rule. Use when authoring or validating a spec-bundle before submit, writing or reading a .tao/jobs job-record, resolving where results land, or consuming AutoML's best_rec.json. Trigger phrases include "validate the spec bundle", "job record schema", "status vocabulary", "results_dir layout", "best_rec schema". |
| `tao-convert-dataset-format` | Run `tao-daft convert` to convert NVIDIA TAO DAFT datasets between supported formats. Do not use for non-DAFT data. |
| `tao-data-io` | The data-mover for TAO jobs — decides the storage tier (A pre-positioned mount with zero fetch / B volume-from-S3 / C ephemeral in-compute fetch), stages inputs (bulk + annotation-selective + archive extract + HF/NGC PTM), maps credentials to env, routes outputs 3-way with upload-excludes, and runs the compute-frame verify gate. A support skill other platform skills (docker, kubernetes, slurm, brev, virtualenv) call to get data to and from the compute container without the TAO SDK. Trigger phrases include "stage inputs", "mount the dataset", "upload TAO results", "download only referenced files", "resolve results_dir", "verify the container can read the data". |
| `tao-finetune-clip` | CLIP vision-language model for image-text retrieval, zero-shot classification, embedding extraction, ONNX |
| `tao-finetune-cosmos-embed` | >- |
| `tao-finetune-cosmos-reason` | >- |
| `tao-finetune-huggingface-model` | > |
| `tao-finetune-nv-tesseract-ad-diffusion` | >- |
| `tao-finetune-nv-tesseract-forecasting` | >- |
| `tao-finetune-video-clip` | >- |
| `tao-generate-anomalies` | >- |
| `tao-generate-image-embeddings` | >- |
| `tao-generate-image-grounding` | Two-step image grounding pipeline: extracts referring expressions from (image, caption) pairs and grounds them |
| `tao-generate-referring-expressions` | Four-step image referring-expression pipeline: turns images plus KITTI bounding-box labels into region |
| `tao-generate-video-reasoning-annotations` | >- |
| `tao-launch-workflow` | >- |
| `tao-list-capabilities` | >- |
| `tao-mine-aoi-images` | Runs the DEFT embed-then-mine workflow for VCN AOI iterations — embeds the gap-analysis target parquet, embeds a source pool, and mines nearest-neighbour source images for downstream augmentation. Use as the immediate next step after `tao-route-visual-changenet-samples` when expanding a real-image augmentation queue from the mining subset. |
| `tao-mine-nearest-neighbors` | >- |
| `tao-mine-od-images` | >- |
| `tao-port-huggingface-model` | > |
| `tao-route-visual-changenet-samples` | Routes the weakest VCN samples (output of `tao-analyze-gaps-visual-changenet`) into per-augmentation-module |
| `tao-run-automl` | Run container-backed AutoML / hyperparameter optimization (HPO) for NVIDIA TAO networks using AutoMLRunner. Handles algorithm |
| `tao-run-automl-deft-pipeline` | > |
| `tao-run-deft-aoi` | > |
| `tao-run-deft-aoi-cosmos3` | > |
| `tao-run-deft-cr-its-mining` | >- |
| `tao-run-deft-object-detection` | > |
| `tao-run-deft-pas` | > |
| `tao-run-inference-service` | > |
| `tao-run-on-brev` | Run a TAO training/evaluation/inference container on an NVIDIA Brev GPU instance. Instance provisioning (create/search/stop/delete/login) is delegated to the official brev-cli agent skill or the Brev MCP server; this skill covers only the TAO-specific part — running the container over `brev exec` via the four-verb docker contract. Trigger phrases include "run on Brev", "Brev GPU instance", "TAO on Brev", "submit job to Brev". |
| `tao-run-on-docker` | The Docker execution platform for TAO jobs — a local daemon or a remote GPU box via DOCKER_HOST=ssh://user@host. Implements the four-verb consumer contract (submit/status/logs/cancel) over the docker CLI, wired to the job-record, tao-data-io staging, and the redact lint, on top of the underlying docker conventions (--gpus, mounts, NGC auth, inspection, data-root relocation, error modes). Use to run any single-node TAO container action on Docker without the SDK. Trigger keywords — docker, docker run, run on docker, DOCKER_HOST, remote docker, nvcr.io, --gpus, single-node GPU job. |
| `tao-run-on-kubernetes` | Kubernetes execution platform — submits TAO container jobs as k8s Jobs with NVIDIA GPU scheduling; single-pod |
| `tao-run-on-slurm` | Remote SLURM GPU cluster execution over SSH with sbatch/srun, Pyxis/Enroot containers, and Lustre-backed |
| `tao-run-on-virtualenv` | Run a Python training/eval script directly in an existing local virtualenv — no docker, no container. Implements the four-verb consumer contract (submit/status/logs/cancel) over a vendored process-lifecycle runner with durable on-disk state, PID-reuse-safe identity, and process-group cleanup. Use for docker-free local execution, plain-Python model scripts, fast HPO/AutoML trial smokes, or hosts where containers are unavailable. Trigger phrases include "run in my venv", "no docker", "virtualenv execution", "local python training", "run this training script directly". |
| `tao-setup` | One-time session setup and orchestration map for the TAO skill bank. Run this first when the TAO skills were installed individually (e.g. from a public skills catalog) so the session gets the cross-skill discovery flow, credential checks, and host preflight that the bundled plugin hook would otherwise inject automatically. Trigger phrases include "set up TAO skills", "TAO session setup", "prepare TAO environment", "TAO getting started". |
| `tao-setup-nvidia-gpu-host` | >- |
| `tao-train-action-recognition` | Action recognition from video sequences. Supports RGB, optical flow, and joint (multi-stream) input types for |
| `tao-train-bevfusion` | BEVFusion for multi-sensor 3D object detection. Fuses LiDAR point clouds and camera images in bird's-eye-view |
| `tao-train-centerpose` | CenterPose for keypoint / pose estimation. Detects object centers and regresses keypoint locations for 6-DoF |
| `tao-train-codetr` | Co-DETR (CoDINO) for object detection. A DETR-family detector with collaborative hybrid |
| `tao-train-deformable-detr` | Deformable DETR for 2D object detection. Uses deformable attention for efficient multi-scale feature processing, |
| `tao-train-depth-anything-v2` | Monocular depth estimation using Metric Depth Anything v2 or Relative Depth Anything architectures. Predicts |
| `tao-train-dino` | DINO (DETR with Improved DeNoising Anchor Boxes) for 2D object detection. Transformer-based detector with |
| `tao-train-dinov3` | DINOv3 continual self-supervised pre-training. Domain-adapts public DINOv3 ViT backbones |
| `tao-train-fast-foundation-stereo` | Real-time stereo depth estimation using FastFoundationStereo (FFS), the distilled bp2 commercial variant of |
| `tao-train-foundation-stereo` | Stereo depth estimation using FoundationStereo. Predicts disparity maps from stereo image pairs for 3D |
| `tao-train-grounding-dino` | Grounding DINO for open-set object detection. Combines DINO-style detection with a BERT text encoder for |
| `tao-train-image-classification` | PyTorch-based TAO image classification. Supports a wide range of backbones (FAN, EfficientNet, ResNet, etc.) |
| `tao-train-mask-auto-encoder` | Masked Auto-Encoder (MAE) for self-supervised pretraining and fine-tuning. Masks random patches and reconstructs |
| `tao-train-mask-auto-label` | MAL (Mask Auto-Label) for weakly-supervised segmentation. Produces segmentation masks from minimal annotations |
| `tao-train-mask-grounding-dino` | Mask Grounding DINO for grounded instance segmentation. Extends Grounding DINO with a mask-prediction head for |
| `tao-train-mask2former` | Mask2Former for universal image segmentation (panoptic, instance, and semantic). Transformer-based with |
| `tao-train-metric-learning-recognition` | Metric-learning recognition (ml-recog) for fine-grained visual recognition. Learns embeddings for |
| `tao-train-nvdinov2` | NVDINOv2 for self-supervised visual representation learning. Trains vision transformers via self-distillation |
| `tao-train-nvpanoptix3d` | NVPanoptix3D for panoptic 3D scene reconstruction from posed RGB images. Produces 3D panoptic segmentation |
| `tao-train-ocdnet` | OCDNet for scene text detection. Detects arbitrary-oriented text regions in natural images using a |
| `tao-train-ocrnet` | OCRNet for scene text recognition. Recognizes text content from cropped text-region images and supports CTC |
| `tao-train-oneformer` | OneFormer for universal image segmentation. Unifies panoptic, instance, and semantic segmentation with a |
| `tao-train-optical-inspection` | Optical Inspection for defect detection using Siamese networks. Compares image pairs to detect manufacturing |
| `tao-train-pointpillars` | PointPillars for 3D object detection from LiDAR point clouds. Encodes point clouds into a pseudo-image via a |
| `tao-train-pose-classification` | Pose classification using ST-GCN (Spatial Temporal Graph Convolutional Network). Classifies skeleton sequences |
| `tao-train-reid` | Person re-identification (ReID). Learns discriminative embeddings to match the same person across different |
| `tao-train-rtdetr` | RT-DETR (Real-Time DEtection TRansformer) for 2D object detection. Designed for real-time inference with |
| `tao-train-segformer` | SegFormer for semantic segmentation. Lightweight transformer-based architecture with hierarchical feature |
| `tao-train-single-step` | Standard single-step train/eval/export workflow for any TAO model. Use when training a TAO model on a dataset |
| `tao-train-sparse4d` | Sparse4D for multi-camera temporal 3D object detection and tracking. Uses sparse queries with deformable |
| `tao-train-visual-changenet` | Visual ChangeNet for binary image classification and segmentation in AOI defect detection. Use when training, |
| `tao-validate-dataset-format` | Run `tao-daft validate` to check NVIDIA TAO DAFT datasets for structure, schema, and cross-reference errors. Do |
| `tao-validate-recipe-transfer` | Port a published computer vision paper's official code and training recipe onto a customer's own dataset, or diagnose why such a transfer produced bad numbers. Use this whenever someone wants to reproduce a CV paper, run a paper's repo on their own images, fine-tune a published detection/segmentation/classification/keypoint model on customer data, adapt a training recipe to a new dataset, or figure out why a fine-tuned vision model scores well on validation but fails in production. Also use for post-mortems on any failed or disappointing CV training run, and whenever a user mentions mAP that looks too good, a model that "worked in training but not in deployment", or transferring hyperparameters from a paper to their own data. Trigger even if the user only says "train a model on my dataset" and a published architecture or repo is involved. |

### DOCA (Data Center Infrastructure & Networking) (60 skills)

| Skill Name | Description |
| :--- | :--- |
| `doca-aes-gcm` | > |
| `doca-argp` | > |
| `doca-argus` | > |
| `doca-bare-metal-deployment` | > |
| `doca-bench` | > |
| `doca-bench-extension` | > |
| `doca-bf3-deployment` | > |
| `doca-bf4-deployment` | > |
| `doca-caps` | > |
| `doca-collectx-deployment` | > |
| `doca-comch` | > |
| `doca-comm-channel-admin` | > |
| `doca-common` | > |
| `doca-compress` | > |
| `doca-container-deployment` | > |
| `doca-debug` | > |
| `doca-devemu` | > |
| `doca-dma` | > |
| `doca-dms` | > |
| `doca-dpa` | > |
| `doca-dpa-hl-tracer` | > |
| `doca-dpdk-bridge` | > |
| `doca-erasure-coding` | > |
| `doca-eth` | > |
| `doca-firefly` | > |
| `doca-flow` | > |
| `doca-flow-dpa-perf` | > |
| `doca-flow-dpa-provider` | > |
| `doca-flow-grpc-server` | > |
| `doca-flow-perf` | > |
| `doca-flow-tune` | > |
| `doca-gpi` | > |
| `doca-gpunetio` | > |
| `doca-gpunetio-ib-write-bw` | > |
| `doca-gpunetio-ib-write-lat` | > |
| `doca-hardware-safety` | > |
| `doca-mgmt` | > |
| `doca-pcc` | > |
| `doca-pcc-counters` | > |
| `doca-pcc-ztr-rttcc-algo` | > |
| `doca-programming-guide` | > |
| `doca-public-knowledge-map` | > |
| `doca-rdma` | > |
| `doca-rdmi` | > |
| `doca-rmax` | > |
| `doca-setup` | > |
| `doca-sha` | > |
| `doca-sha-offload-engine` | > |
| `doca-socket-relay` | > |
| `doca-spcx-cc` | > |
| `doca-sta` | > |
| `doca-structured-tools-contract` | > |
| `doca-telemetry` | > |
| `doca-telemetry-exporter` | > |
| `doca-telemetry-utils` | > |
| `doca-upgrade` | > |
| `doca-urom` | > |
| `doca-urom-svc` | > |
| `doca-verbs` | > |
| `doca-version` | > |

### NeMo (Conversational AI, Distributed Training & Megatron) (42 skills)

| Skill Name | Description |
| :--- | :--- |
| `nemo-automodel-distributed-training` | Guide for selecting and configuring distributed training strategies in NeMo AutoModel, including FSDP2, Megatron FSDP, DDP, and parallelism settings. |
| `nemo-automodel-launcher-config` | Configure NeMo AutoModel job launches for interactive runs, Slurm clusters, and SkyPilot cloud execution. |
| `nemo-automodel-model-onboarding` | Guide for onboarding new model architectures into NeMo AutoModel, including architecture discovery, implementation patterns, registration, and validation. |
| `nemo-automodel-recipe-development` | Create and modify NeMo AutoModel training and evaluation recipes, including YAML structure, builders, and execution flow. |
| `nemo-fabric-build-adapter` | Build, migrate, review, and maintain third-party NVIDIA NeMo Fabric adapters against the public adapter contract. Use when creating adapter or target descriptors, mapping AgentConfig into an agent harness or custom-agent runtime, implementing start/invoke/stop, declaring schemas and capabilities, packaging discovery metadata, or assessing adapter conformance. Do not use for consumer applications that only call the NVIDIA NeMo Fabric SDK. |
| `nemo-fabric-integrate` | Use this skill when integrating NVIDIA NeMo Fabric into a consumer application, service, evaluation harness, or platform through the typed Python SDK — translating the consumer's own application, job, or deployment config into an in-memory FabricConfig, choosing the single-invocation convenience API or an explicitly started runtime, validating with plan and doctor, and consuming normalized results, artifacts, and telemetry. |
| `nemo-mbridge-mlm-bridge-training` | Run Megatron-LM (MLM) and Megatron Bridge training with mock or real data. Covers correlation testing, available recipes, and multi-GPU examples. |
| `nemo-mbridge-multi-node-slurm` | Convert single-node scripts to multi-node Slurm sbatch jobs and debug common multi-node failures. Covers srun-native vs uv run torch.distributed approaches, container setup, NCCL timeouts, OOM sizing for MoE models, and interactive allocation. |
| `nemo-mbridge-perf-activation-recompute` | >- |
| `nemo-mbridge-perf-cpu-offloading` | Validate and use CPU offloading in Megatron Bridge, including layer-level activation offloading and fractional optimizer state offloading with HybridDeviceOptimizer. |
| `nemo-mbridge-perf-cuda-graphs` | Validate and use CUDA graph capture in Megatron Bridge, including local full-iteration graphs and Transformer Engine scoped graphs for attention, MLP, and MoE modules. |
| `nemo-mbridge-perf-expert-parallel-overlap` | Validate and use MoE expert-parallel communication overlap in Megatron-Bridge, including overlap_moe_expert_parallel_comm, delay_wgrad_compute, and flex dispatcher backends such as DeepEP and HybridEP. |
| `nemo-mbridge-perf-hierarchical-context-parallel` | Operational guide for enabling hierarchical context parallelism in Megatron-Bridge, including config knobs, code anchors, pitfalls, and verification. |
| `nemo-mbridge-perf-megatron-fsdp` | Operational guide for enabling Megatron FSDP in Megatron-Bridge, including config knobs, code anchors, pitfalls, and verification. |
| `nemo-mbridge-perf-memory-tuning` | Techniques for reducing peak GPU memory in Megatron Bridge — expandable segments, PEFT + SP input re-gather, parallelism resizing, activation recompute, CPU offloading constraints, and common OOM fixes. |
| `nemo-mbridge-perf-moe-comm-overlap` | MoE expert-parallel communication overlap in Megatron Bridge. Covers dispatch/combine overlap, flex dispatcher backends, and expert wgrad scheduling. |
| `nemo-mbridge-perf-moe-dispatcher-selection` | Choose the right MoE token dispatcher (`alltoall`, DeepEP, or HybridEP) for the hardware, EP degree, and optimization stage. Summarizes patterns from DSV3, Qwen3, Qwen3-Next, and VLM bring-up work. |
| `nemo-mbridge-perf-moe-hardware-configs` | Representative, point-in-time MoE training playbooks by hardware and model family. Use them as candidate seeds, then revalidate the exact runtime, semantics, topology, and steady-state throughput. |
| `nemo-mbridge-perf-moe-long-context` | Long-context MoE training guidance for Megatron Bridge. Covers CP sizing, selective recompute, dispatcher choices, and practical patterns from DSV3, Qwen3, and Qwen3-Next long-context experiments. |
| `nemo-mbridge-perf-moe-optimization-workflow` | Evidence-gated workflow for MoE performance optimization in Megatron Bridge. Covers measurement contracts, the Three Walls framework, parallel folding, profiling, matched A/B tuning, and final validation. |
| `nemo-mbridge-perf-moe-vlm-training` | Practical guidance for training MoE VLMs in Megatron Bridge. Compares FSDP and 3D-parallel approaches, using rounded lessons from Qwen3-VL, Qwen3-Next, and other multimodal experiments. |
| `nemo-mbridge-perf-parallelism-strategies` | Operational guide for choosing and combining parallelism strategies in Megatron Bridge, including sizing rules, hardware topology mapping, and combined parallelism configuration. |
| `nemo-mbridge-perf-sequence-packing` | Validate and use packed sequences and long-context training in Megatron-Bridge, including offline LLM packing, collate-time VLM packing, Energon online packing, and CP constraints. |
| `nemo-mbridge-perf-tp-dp-comm-overlap` | Operational guide for enabling TP, DP, and PP communication overlap in Megatron-Bridge, including config knobs, code anchors, pitfalls, and verification. |
| `nemo-mbridge-recipe-recommender` | Recommend and customize Megatron Bridge library and benchmark recipes for a user's model, GPU count, hardware, sequence length, and pretrain/SFT/PEFT goal. Use when selecting a starting recipe, comparing library and benchmark configs, resizing parallelism for a GPU allocation, or distinguishing convergence changes, semantics-preserving execution tuning, and benchmark-only shortcuts. |
| `nemo-mbridge-resiliency` | Resiliency features in Megatron Bridge including fault tolerance, straggler detection, in-process restart, preemption, and re-run state machine. |
| `nemo-relay-debug-runtime-integration` | Use this skill when NeMo Relay is installed or imported but application-side runtime behavior is missing or incorrect, including load failures, inactive scopes, missing events, and plugin or adaptive wiring problems. |
| `nemo-relay-get-started` | Use this skill when first-time NeMo Relay users want to try Relay, choose the least-complex supported quick start, or verify initial value through the CLI, a maintained integration, or direct Python, Node.js, or Rust instrumentation before production setup. |
| `nemo-relay-install` | Use this skill when choosing or running NeMo Relay installation for the CLI, Python, Node.js, Rust, OpenClaw, Hermes, or maintained framework integrations before runtime configuration or quick-start setup. |
| `nemo-relay-instrument-calls` | Use this skill when an application owns tool or LLM/provider call sites and needs to wrap them with NeMo Relay scopes and managed execution APIs for lifecycle events, middleware, or guardrails. |
| `nemo-relay-instrument-context-isolation` | Use this skill when concurrent requests, async tasks, threads, workers, goroutines, or agents need independent NeMo Relay scope stacks and correct ancestry propagation. |
| `nemo-relay-instrument-typed-wrappers` | Use this skill when adding NeMo Relay typed wrappers, domain types, or provider codecs while preserving JSON middleware semantics and caller-visible behavior. |
| `nemo-relay-migrate-from-flow` | Use this skill when migrating applications, examples, integrations, documentation, manifests, or repository code from NeMo Flow to NeMo Relay across Python, Rust, Node.js, Go, C FFI, CLI, configuration, and observability surfaces. |
| `nemo-relay-plugin-adaptive-tuning` | Use this skill when baseline NeMo Relay instrumentation exists and the user wants to configure or evaluate adaptive plugin behavior, including telemetry, state, adaptive_hints, tool_parallelism, ACG, hint consumption, or measured rollout. |
| `nemo-relay-plugin-build` | Use this skill when building or packaging reusable NeMo Relay runtime behavior as an embedded configuration component or a manifest-backed `rust_dynamic` native or `worker` gRPC plugin, with deterministic validation and rollback-safe registration. |
| `nemo-relay-plugin-observability` | Use this skill when choosing or configuring NeMo Relay 0.6 or 0.7 observability through the built-in plugin, subscribers, or exporters, including raw ATOF events, ATIF trajectories, OpenTelemetry, OpenInference, or custom event handling. |
| `nemo-retriever` | Use when searching, extracting, ingesting, or querying a document collection with the NeMo Retriever 26.8.1 CLI, including local LanceDB indexes and deployed Retriever services. Use for PDFs, images, Office files, HTML, text, audio, and video; not for editing documents or web search. |
| `nemo-retriever-mcp` | Use when a task needs to search or add documents through NeMo Retriever MCP. |
| `nemo-rl-auto-research` | Autonomous NeMo-RL research agent workflow for directed hypothesis testing and open-ended discovery. Guides agents through the full experiment lifecycle: understanding recipes and environments, wiring RL or NeMo-gym runs, launching reproducible baselines and iterations, analyzing results, preserving human oversight, and using git plus TSV logs as the research ledger. Do NOT use for: bug fixes, code review, documentation, refactoring, dependency updates, or single-file changes. |
| `nemo-rl-brev-etiquette` | Brev instance operating guidance for NeMo-RL agents working in /home/ubuntu/RL with limited workspace disk, a larger /ephemeral volume, and optional /home/ubuntu/RL/.env secrets. Use when running nemo-rl-auto-research campaigns, experiments, training jobs, model or dataset downloads, shared cache-heavy commands, log-producing runs, checkpoint generation, W&B or Hugging Face authenticated workflows, or any workflow that may create large files on Brev. |
| `nemo-rl-docs` | Documentation conventions for NeMo-RL. Covers docs/index.md updates and docstring format. Do NOT use for: bug fixes, test fixes, dependency bumps, refactoring, CI/CD changes, performance tuning, or any task that does not involve writing or updating documentation. |
| `nemo-rl-session-memory` | Manage durable working-session memory for coding agents. Use when a user asks to preserve or recover agent context across disconnects, VS Code restarts, long-running work, handoffs, or any session where important state should be written periodically under the repo's session directory. Do NOT use for: simple questions, short tasks, one-off commands, linting, or code review. |

### Jetson (Edge AI, Embedded Robotics & Orin) (38 skills)

| Skill Name | Description |
| :--- | :--- |
| `jetson-build-source` | >- |
| `jetson-customize-camera` | >- |
| `jetson-customize-clocks` | Use to lock/cap Jetson CPU/GPU/EMC clocks, toggle EMC/CPU DVFS, or change cpufreq governors by editing BPMP DTB and nvpower.sh pre-flash. Do NOT use for live tuning or nvpmodel edits. |
| `jetson-customize-fan` | >- |
| `jetson-customize-mgbe` | >- |
| `jetson-customize-nvpmodel` | >- |
| `jetson-customize-pcie` | >- |
| `jetson-customize-pinmux` | >- |
| `jetson-customize-uphy` | Configure Jetson UPHY lane allocation (uphy0/uphy1-config) on Orin/Thor custom carriers. Do NOT use for pinmux or PCIe-only edits. |
| `jetson-customize-usb` | Enable/disable Jetson USB2/USB3 SS ports via kernel-DT overlay. Do NOT use for UPHY lane allocation or ODMDATA edits. |
| `jetson-derive-carrier` | >- |
| `jetson-diagnostic` | Read-only Jetson health snapshot for identity, memory, GPU, thermal, power, storage, services, and top processes. |
| `jetson-download-bsp` | >- |
| `jetson-flash-image` | Use to flash a promoted BSP image to a Jetson DUT in RCM mode via flash.sh or l4t_initrd_flash.sh. Do NOT use for BSP customization, image promotion, or carrier derivation. |
| `jetson-generate-kb` | >- |
| `jetson-headless-mode` | Plan and apply safe Jetson headless-mode changes to reclaim GUI and daemon memory. |
| `jetson-inference-mem-tune` | Pick the serving stack and per-runtime memory flags (vLLM, SGLang, llama.cpp, TensorRT Edge-LLM) for an LLM/VLM workload on any NVIDIA Jetson. |
| `jetson-init-image` | >- |
| `jetson-init-source` | >- |
| `jetson-init-target` | >- |
| `jetson-link-docs` | >- |
| `jetson-llm-benchmark` | Benchmark Jetson LLM/VLM serving performance across vLLM, llama.cpp, and Ollama with structured JSON output. |
| `jetson-llm-serve` | Stand up vLLM or SGLang serving on Jetson, using upstream vLLM on Thor and Orin JetPack 7.2+, and NVIDIA-AI-IOT vLLM on older Orin. |
| `jetson-memory-audit` | Measure Jetson DRAM/NvMap usage and verify before/after memory reclamation with live audit data. |
| `jetson-optimize-memory` | >- |
| `jetson-package` | Pick Jetson-compatible containers, vLLM runtime images, and Jetson AI Lab PyPI indexes; maps Orin SM 8.7 vs Thor SM 11.0 and JetPack-specific package choices. |
| `jetson-print-bsp-info` | Use when you need to print Jetson BSP info (L4T version, board configs, rootfs state) from a Linux_for_Tegra root on the host PC. This is an example skill. |
| `jetson-print-device-info` | Use when you need to print Jetson device info (module model, L4T version, kernel, OS version, current power mode) from a running Jetson target. This is an example skill. |
| `jetson-promote-image` | >- |
| `jetson-quick-start` | >- |
| `jetson-set-target` | >- |
| `jetson-speculative-decoding` | Add EAGLE-3 or draft-model speculative decoding to a Jetson vLLM server when TPOT is the bottleneck. |
| `jetson-validate-image` | >- |
| `jetson-video-benchmark` | >- |
| `jetson-video-capability` | >- |
| `jetson-video-pipeline` | >- |
| `jetson-video-recipe` | >- |
| `jetson-video-setup` | >- |

### BioNeMo (Drug Discovery & Molecular Biology) (21 skills)

| Skill Name | Description |
| :--- | :--- |
| `bionemo-boltz2-nim` | > |
| `bionemo-diffdock-nim` | > |
| `bionemo-drug-discovery-pipeline` | > |
| `bionemo-evo2-nim` | > |
| `bionemo-genmol-nim` | > |
| `bionemo-kermt-add-cmim-pretrain` | Convert a grover_base checkpoint (encoder-only or encoder + vocab heads) into a hybrid checkpoint by adding a randomly-initialized cMIM decoder + latent_dist, then continue pretraining on the user's corpus as hybrid (vocab + contrast). Effectively kermt-continue-pretrain with a one-time ckpt-conversion step prepended. |
| `bionemo-kermt-continue-pretrain` | Continue KERMT pretraining on a custom SMILES corpus with a grover_base, cmim, or hybrid checkpoint. Use a local checkpoint or optionally download a pinned Hugging Face model bundle using HF_TOKEN if configured. Run containerized training and write model bundles, prepared data, logs, and checkpoints to user-selected host directories. |
| `bionemo-kermt-embed` | Extract per-molecule embeddings from any encoder-bearing KERMT checkpoint. Use a local checkpoint or optionally download a pinned Hugging Face model bundle using HF_TOKEN if configured. Run containerized embedding extraction and write model bundles, per-readout .npy embeddings, canonical SMILES, and validity arrays to user-selected host directories. |
| `bionemo-kermt-finetune` | Finetune a pretrained KERMT encoder on a labeled CSV. Validate the checkpoint and data, prepare features, and run containerized training. Use a local checkpoint or optionally download a pinned Hugging Face model bundle using HF_TOKEN if configured. Write model bundles, prepared data, logs, and trained models to user-selected host directories. |
| `bionemo-kermt-infer` | Run predictions with a finetuned KERMT checkpoint on a SMILES-only CSV. The skill validates that the input ckpt has task FFN heads (refuses pretrain ckpts with a redirect to kermt-finetune), validates the CSV, prepares the data (clean + rdkit_2d features), then launches main.py predict inside the kermt container (blocking, minutes-scale). |
| `bionemo-kermt-monitor` | Check progress for a detached KERMT run (pretrain, finetune, or any kermt_run_detached invocation). Reads run.json, queries docker for container state, tails the pretrain/finetune log, and parses progress lines (epoch, step, val loss). |
| `bionemo-kermt-pretrain-scratch` | Pretrain a fresh KERMT model from scratch on a user-provided corpus. Builds a new vocabulary from the corpus, instantiates the model architecture from defaults, and launches pretrain_ddp.py inside the kermt container (detached for long runs). Unlike kermt-continue-pretrain, no starting checkpoint is loaded — the model is randomly initialized. |
| `bionemo-kermt-setup` | Bootstrap the KERMT agent environment — verify host docker + nvidia-container-toolkit, build the kermt:latest image from the repo's Dockerfile if it doesn't yet exist, and run a GPU smoke test inside the container. Every other kermt-* skill depends on this; invoke it first. |
| `bionemo-molmim-nim` | > |
| `bionemo-msa-search-nim` | > |
| `bionemo-msa-structure-prediction-pipeline` | > |
| `bionemo-nvmolkit-usage` | >- |
| `bionemo-openfold2-nim` | > |
| `bionemo-openfold3-nim` | > |
| `bionemo-proteinmpnn-nim` | > |
| `bionemo-rfdiffusion-nim` | > |

### Video Storage & Streaming (Visual Analytics) (15 skills)

| Skill Name | Description |
| :--- | :--- |
| `vss-ask-video` | Use this skill to ask the VSS agent's video_understanding tool a fresh visual question about a recorded clip. Not for prior tool output, search hits, or metadata-answerable questions. |
| `vss-deploy-dense-captioning` | Use this skill when deploying standalone RT-VLM dense captioning or calling its REST API (uploads, captions, streams, chat-completions, Kafka). Not for VSS profile deploy or video-search ingestion. |
| `vss-deploy-detection-tracking-2d` | Use this skill when the user wants to deploy, run, debug, tear down, or call the REST API of the RTVI-CV 2D detection / tracking microservice. Trigger when the user says things like 'deploy rtvi-cv', 'start warehouse 2d', 'add a stream', 'check rtvi-cv health', or 'stop the perception container'. Not for VLM, embedding, or analytics — use the matching vss-* skill. |
| `vss-deploy-detection-tracking-3d` | > |
| `vss-deploy-profile` | Use to select, configure, deploy, verify, debug, or tear down a VSS profile (base, search, lvs, warehouse, edge). Not for standalone microservices — use the vss-deploy-* skill. |
| `vss-deploy-video-embedding` | > |
| `vss-generate-video-calibration` | Use to run AutoMagicCalib on local MP4s, RTSP, or the bundled sample dataset, and to deploy vss-auto-calibration when needed. Do not use for non-AMC calibration or runtime analytics. |
| `vss-generate-video-report` | Use this skill when producing a VSS analysis report — Mode A per-clip VLM, Mode B incident-range via video-analytics. Not for standalone video summarization, real-time alerts or ad-hoc Q&A. |
| `vss-manage-alerts` | Use for VSS alert workflows — real-time monitoring, Alert-Bridge subscriptions, Slack notifications, incident queries, camera onboarding. Not for non-alert analytics. |
| `vss-manage-video-io-storage` | Use to call the VIOS REST API (sensor list, timelines, clip extraction, snapshots, add/delete sensors and streams). Not for VLM inference or search. |
| `vss-query-analytics` | Use this skill when reading video-analytics metrics, incidents, alerts, and sensor data via the VA-MCP server (port 9901). Not for live VLM or incident-range narrative reports. |
| `vss-search-archive` | Use this skill to run top-level VSS fusion search on archived video, or to ingest video files / RTSP streams for search. Do NOT use for ad-hoc visual Q&A (use vss-ask-video), live captioning (use vss-deploy-dense-captioning), or video summarization and reports (use vss-summarize-video). |
| `vss-setup-behavior-analytics` | Use to deploy the vss-behavior-analytics service standalone (entrypoint, config-source, optional calibration). Not for the full warehouse deploy. |
| `vss-setup-video-analytics-api` | Use to deploy the vss-video-analytics-api REST service standalone (config-source, data-log bind, Elasticsearch, optional Kafka). Not for full warehouse deploy. |
| `vss-summarize-video` | Use to summarize a recorded video via the LVS summarization microservice (HITL-gated) with a VLM fallback. Not for report generation or live RTSP captioning. |

### Industrial & Edge (Smart Manufacturing) (14 skills)

| Skill Name | Description |
| :--- | :--- |
| `i4h-lerobot-viz` | Serve and visually inspect a converted LeRobot dataset in the browser. Use for videos and state/action timelines; do not use for raw workflow HDF5 or incomplete conversion output. |
| `i4h-workflow` | Orient users to the i4h workflow runtime and route them to the correct stage skill. Use for architecture, support, or where-to-start questions; do not execute a known stage. |
| `i4h-workflow-create` | Create a minimal blank Workflow scaffold with a Scene containing ground and light plus an idle run mode. Use for fast new Workflow scaffolding. |
| `i4h-workflow-dataset-annotate` | Grade or filter workflow HDF5 episodes with an OpenAI-compatible vision model. Use for visual success labels; do not use for replay, policy evaluation, or recordings without frames. |
| `i4h-workflow-dataset-convert` | Convert workflow HDF5 recordings to LeRobot datasets for training or browser inspection. Use for conversion; do not use for replay, augmentation, or raw-data repair. |
| `i4h-workflow-dataset-mimic` | Expand workflow HDF5 demonstrations with action jitter, optionally scoped to node segments. Use for synthetic variants; do not use to collect data, alter state directly, or generate new images. |
| `i4h-workflow-dataset-replay` | Replay a workflow HDF5 episode through its original Scene. Use for visual trajectory and recording verification; do not use for policy evaluation or LeRobot data. |
| `i4h-workflow-dataset-teleop` | Record demonstrations through a workflow's teleop Task into workflow HDF5. Use for keyboard, leader, VR, or bus input; do not use for policy evaluation or autonomous rule-based Tasks. |
| `i4h-workflow-e2e` | Run the maintained workflow data-to-policy pipeline from recording through checkpoint validation. Use for full end-to-end requests; do not use for one individual stage. |
| `i4h-workflow-finetune` | Fine-tune a manifest-backed GR00T or openpi remote Task on compatible LeRobot data. Use for training; do not use for inference-only Tasks or checkpoint rollout. |
| `i4h-workflow-scene-edit` | Edit an existing workflow Scene or task contract. Use for assets, layout, cameras, randomization, task text, or success rules; do not use to create a new workflow. |
| `i4h-workflow-setup` | Preflight and set up the root-level workflow runtime. Use for installation, missing component environments, or third-party failures; do not use for rollout validation. |
| `i4h-workflow-train-rl` | Use when training, evaluating, or exporting Workflow policies with online RSL-RL or RLinf, including RL checkpoint and Workflow handoff. |
| `i4h-workflow-validate` | Run the root-level workflow runtime policy or rule-based rollouts and verify simulator success. Use for evaluation, checkpoints, or local controllers; do not use for replay or dataset annotation. |

### NV Tools & Workflows (10 skills)

| Skill Name | Description |
| :--- | :--- |
| `nv-generate-ct-rflow` | Used for generating synthetic CT volumes and masks with NV-Generate-CTMR rflow-ct. Not for production training data without review. |
| `nv-generate-mr` | Used for generating synthetic body MRI volumes with NV-Generate-CTMR rflow-mr. Not for paired masks or production training data. |
| `nv-generate-mr-brain` | Used for generating synthetic T1, T2, FLAIR, SWI, or MRA brain MRI volumes with NV-Generate-CTMR MR-Brain v1. Not for production training data. |
| `nv-generate-mr-brain-finetune` | Used for finetuning NV-Generate-CTMR MR-Brain v1 for T1, T2, FLAIR, SWI, or MRA data from a NIfTI datalist. Not for clinical or production data approval. |
| `nv-generate-vae-finetune` | Used for finetuning the NV-Generate-CTMR MAISI VAE from CT/MRI NIfTI datalists. Not for clinical or production data approval. |
| `nv-reason-ct` | Run NV-Reason-CT inference on user-provided 3D NIfTI chest or abdominal CT volumes for engineering and research workflows. Not for diagnosis, treatment, or clinical reporting. |
| `nv-reason-cxr` | Used for command-shape or live NV-Reason-CXR chest X-ray reasoning smoke tests. Not for diagnosis or clinical reporting. |
| `nv-segment-ct` | Used for running NV-Segment-CT VISTA3D on CT NIfTI volumes and recording label-map evidence. |
| `nv-segment-ct-finetune` | Runs standard or fixed-channel softmax finetuning of NV-Segment-CT VISTA3D on CT NIfTI image/label datasets, with optional MONAI-native MLflow tracking and checkpoint evidence. Uses softmax for predefined, mutually exclusive classes; keeps the standard workflow when point prompts or runtime-variable classes are needed. Not for clinical validation. |
| `nv-segment-ctmr` | Used for running NV-Segment-CTMR on CT or MRI NIfTI volumes and recording label-map evidence. Not for clinical interpretation. |

### NVFlare (Federated Learning & Privacy-Preserving AI) (9 skills)

| Skill Name | Description |
| :--- | :--- |
| `nvflare-autofl` | Use for agent-assisted Auto-FL optimization of an existing NVFLARE job in simulation, POC, or production. Do not use for code conversion, diagnosis-only work, or deployment setup. |
| `nvflare-autofl-report` | Generate a reproducible final report, literature-outcome synthesis, JSON summary, and refreshed progress plot for a stopped or interrupted NVFLARE Auto-FL campaign. |
| `nvflare-convert-huggingface` | Convert existing Hugging Face Transformers Trainer or TRL SFTTrainer training code into an NVFLARE federated job using flare.patch(trainer), local validation, and job export; use when the user names Hugging Face or preliminary source inspection identifies one Hugging Face owner, and not for manual PyTorch loops, Lightning, inference-only pipelines, deployment, or experiment workflows. |
| `nvflare-convert-lightning` | Convert existing PyTorch Lightning training code into an NVFLARE federated job using the Lightning Client API patch, local validation, and job export; use only when the request names federated/NVFLARE conversion or asks multiple sites to train collaboratively while keeping each site's data local, and either names PyTorch Lightning or preliminary source inspection identifies one Lightning owner; do not use for non-federated Lightning work such as DDP, profiling, inference serving, or training-loop changes, nor for plain PyTorch, TensorFlow/Keras, other frameworks, deployment, POC/production lifecycle, or experiment workflows. |
| `nvflare-convert-pytorch` | Convert existing plain or manual PyTorch training code into an NVFLARE federated job using Client API model exchange, local validation, and job export; use when the user names plain PyTorch or preliminary source inspection identifies one plain-PyTorch owner, and not for Lightning, other frameworks, deployment, POC/production lifecycle, or experiment workflows. |
| `nvflare-diagnose-job` | Use when the user asks why a reported NVFLARE job failure signal occurred: the job failed, stalled, timed out, lost clients, ended with EXECUTION_EXCEPTION, or produced suspicious errors. Diagnose in simulation, POC, or production by collecting bounded evidence and mapping failure patterns to recovery actions. |
| `nvflare-fed-stats` | Compute federated statistics over tabular data (count, sum, mean, stddev, var, histogram, quantile, noise-protected min/max) and image data (count, failure_count, pixel-intensity histogram) across NVFLARE sites via FedStatsRecipe — automatic and non-interactive from the dataset, feature names (header or supplied), and optionally a README or notes declaring which statistics to compute; do not use for model training conversion, hierarchical statistics, deployment, POC/production lifecycle, or failed-job diagnosis. |
| `nvflare-orient` | Route open-ended NVFLARE advice and only conversion requests whose preliminary source inspection reports unresolved or conflicting ownership; never load this skill merely to inspect a concrete conversion request before selecting its detected framework converter. |
| `nvflare-shared` | Internal NVFLARE conversion references and templates. Use only when another NVFLARE skill directs you to a shared workflow, policy, or asset. |

### cuOpt (Combinatorial Logistics & Optimization) (7 skills)

| Skill Name | Description |
| :--- | :--- |
| `cuopt-developer` | Modify, build, test, debug, and contribute to NVIDIA cuOpt (C++/CUDA, Python, server, CI). Use for solver internals, PRs, DCO, and code conventions. |
| `cuopt-install` | Install cuOpt for Python, C, or server via pip, conda, or Docker; verify the install. For building cuOpt from source, see cuopt-developer. |
| `cuopt-multi-objective-exploration` | Trace, complete, and interpret the Pareto frontier across competing objectives using repeated single-objective cuOpt solves (weighted-sum and ε-constraint). |
| `cuopt-numerical-optimization-api` | LP, MILP, and QP (beta) with cuOpt — Python, C, and CLI. Use when the user is solving LP, MILP, or QP with any cuOpt interface. |
| `cuopt-numerical-optimization-formulation` | LP, MILP, QP — concepts, problem-text parsing, and formulation patterns (parameters, constraints, decisions, objective). Concepts only; no API. |
| `cuopt-routing-api-python` | Vehicle routing (VRP, TSP, PDP) with cuOpt — Python API only. Use when the user is building or solving routing in Python. |
| `cuopt-server-api-python` | cuOpt REST server — start server, endpoints, Python/curl client examples. Use when the user is deploying or calling the REST API. |

### EARTH2STUDIO Tools & Workflows (7 skills)

| Skill Name | Description |
| :--- | :--- |
| `earth2studio-create-datasource` | > |
| `earth2studio-create-diagnostic` | > |
| `earth2studio-create-prognostic` | > |
| `earth2studio-data-fetch` | > |
| `earth2studio-deterministic-forecast` | > |
| `earth2studio-discover` | > |
| `earth2studio-install` | > |

### HSB Tools & Workflows (7 skills)

| Skill Name | Description |
| :--- | :--- |
| `hsb-app` | Discover and run Holoscan Sensor Bridge example applications on a connected devkit. Filters available apps by the user's platform, HSB software version, board type, and sensors. Supports timed execution, failure analysis, code-edit suggestions, and iterative re-runs. |
| `hsb-flash` | Flash the FPGA on an HSB board connected to an NVIDIA devkit. Supports HSB Lattice boards (FPGA versions 2407, 2412, 2507, 2510) and Leopard Imaging VB1940 "all-in-one" cameras (FPGA versions 2507, 2510). Uses release-specific YAML manifests and board-type-specific program commands. Lattice and VB1940 commands must never be mixed. |
| `hsb-ip-create-top` | Create or explain fixed-format HSB FPGA_top.sv wrappers from validated HOLOLINK_def.svh files. Do not use for def generation or validation. |
| `hsb-ip-def` | Generate, validate, compare, or explain HSB HOLOLINK_def.svh macros. Do not use for FPGA_top.sv wrappers or packetizer-only derivation. Generation runs bundled Python scripts locally through shell commands and writes validated .svh output files after user-confirmed paths. |
| `hsb-ip-packetizer` | Choose or explain HSB Sensor RX packetizer fields for HOLOLINK_def.svh. Do not use for full defs, validation, or runtime APB programming. |
| `hsb-setup` | Clone the latest NVIDIA Holoscan Sensor Bridge repo, ask which supported devkit is being used, configure the host per platform, build the correct demo container, run it, and verify HSB connectivity by pinging 192.168.0.2. Use for Holoscan Sensor Bridge setup, build, container launch, and first-connectivity bring-up. |
| `hsb-test` | Execute QA test plans on Holoscan Sensor Bridge hardware. Reads a user-provided test document, filters tests by the user's setup, determines which tests can run automatically, executes them with pass/fail evaluation, and produces a structured test results report. |

### TileGym (GPU Kernel Optimization & Triton) (7 skills)

| Skill Name | Description |
| :--- | :--- |
| `tilegym-adding-cutile-kernel` | Add a new cuTile GPU kernel operator to TileGym. Covers dispatch registration in ops.py, cuTile backend implementation, __init__.py exports, test creation, and benchmark in tests/benchmark. Use when adding, creating, or implementing a new cuTile operator/kernel in TileGym, or when asking how to register a new cuTile op. |
| `tilegym-converting-cutile-to-julia` | Converts cuTile Python GPU kernels (@ct.kernel) to cuTile.jl Julia equivalents. Handles kernel syntax translation, 0-indexed to 1-indexed conversion, broadcasting differences, memory layout (row-major to column-major), type system mapping, and launch API differences. Use when converting, porting, or translating cuTile Python kernels to Julia cuTile.jl, or debugging/optimizing existing Julia cuTile translations. |
| `tilegym-converting-cutile-to-triton` | Converts cuTile GPU kernels (@ct.kernel) to Triton (@triton.jit). Handles standard in-repo conversion, debugging (cudaErrorIllegalAddress, shape mismatch, numerical mismatch), and mapping cuTile idioms (ct.load/ct.store, ct.Constant, ct.launch) to Triton equivalents. Covers dual-kernel layout flags (e.g. transpose=True/False + autotune grid via META) per translations/advanced-patterns.md. Use when converting, porting, or translating cuTile kernels to Triton, or debugging existing Triton translations. |
| `tilegym-cutile-autotuning` | Use when adding, modifying, optimizing, or debugging CuTile autotuning code. Trigger signals: `exhaustive_search` / `replace_hints` / `hints_fn` / `cuda.tile.tune` in code, `autotune` in filenames, or correctness/performance issues in autotuned CuTile kernels. Covers: tune-once/cache/launch pattern, per-architecture configs (sm80–sm120), parameter space design (tile sizes, occupancy, num_ctas), and 7 common pitfalls with solutions. |
| `tilegym-cutile-python` | Expert cuTile programming assistant. Write high-performance GPU kernels using cuTile's tile-based programming model with proper validation and optimization. Supports deep agent orchestration for complex multi-kernel tasks. |
| `tilegym-improve-cutile-kernel-perf` | Iteratively optimize cuTile kernel performance through systematic profiling, bottleneck analysis, IR comparison, and targeted tuning. Covers tile sizes, occupancy, autotune configs, TMA, latency hints, persistent scheduling, num_ctas, flush_to_zero, and IR-level debugging. Use when asked to "optimize cutile kernel", "improve kernel perf", "tune cutile performance", "make kernel faster", or iteratively benchmark and refine a cuTile GPU kernel in the TileGym project. |
| `tilegym-monkey-patch-kernels-to-transformers` | Integrate TileGym kernels into Hugging Face `transformers` models by replacing the library's submodule(s) and certain class(es)' implementations, and patching certain class(es)' init/forward/load weight methods prior to instantiating models. Used when the user requires integrating TileGym kernels into `transformers` models. |

### DeepStream (High-Throughput Vision Pipelines) (6 skills)

| Skill Name | Description |
| :--- | :--- |
| `deepstream-dev` | NVIDIA DeepStream SDK development with Python pyservicemaker API. Use when building video analytics pipelines, GStreamer-based video processing, TensorRT inference integration, object detection/tracking, or Kafka/message broker integration. |
| `deepstream-generate-pipeline` | Build DeepStream GStreamer pipelines interactively. Use when the user asks about pipelines for video/image inference, detection, tracking, or streaming — including natural phrases like 'pipeline to infer on image', 'run inference on video', 'detect objects in stream', 'save inference output', 'deepstream pipeline', 'gst-launch pipeline', 'process video with detection', 'build a pipeline', or any request involving GStreamer/DeepStream elements (nvinfer, nvstreammux, nvtracker, etc.). |
| `deepstream-import-vision-model` | > |
| `deepstream-profile-pipeline` | Profile a DeepStream pipeline with Nsight Systems and derive its configs from the measurement. Use when the user asks for an efficient, performant, or profiled pipeline — or to benchmark, tune, or measure FPS. |
| `deepstream-run-mv3dt` | Run and operate the DeepStream Multi-View 3D Tracking reference app, also known as MV3DT. Use when the user asks to set up prerequisites, run shipped MV3DT samples, run Multi-View 3D Tracking on custom synchronized MP4 datasets, import camera calibration, delegate missing calibration to AutoMagicCalib, inspect OSD or BEV visualization, consume MV3DT Kafka metadata, or clean up MV3DT run state in the DeepStream MV3DT app directory. |
| `deepstream-sop` | > |

### Holoscan (Real-Time Sensor Processing & Healthcare) (6 skills)

| Skill Name | Description |
| :--- | :--- |
| `holoscan-install-conda` | Install Holoscan SDK v4.3+ via Conda in a CUDA 13 environment. Use for Conda installs; redirect CUDA 12 hosts to container/wheel. |
| `holoscan-install-container` | Install Holoscan SDK via the NGC Docker container. Use for container-based installs; not for native apt/pip/Conda installs. |
| `holoscan-install-debian` | Install Holoscan SDK natively on Ubuntu via apt. Use for C++ installs on Ubuntu; pair with /holoscan-install-wheel for Python. |
| `holoscan-install-source` | Build Holoscan SDK from source via the in-tree ./run script. Use only when published packages don't meet the user's needs. |
| `holoscan-install-wheel` | Install Holoscan SDK Python wheel via pip into a venv. Use for Python installs; not for native C++/apt or Conda installs. |
| `holoscan-setup` | Guides Holoscan SDK installation: inspects the host, assesses platform compatibility, recommends an install method, and delegates to the matching install skill. |

### Nemotron (Reasoning, Guardrails & LLM Alignment) (6 skills)

| Skill Name | Description |
| :--- | :--- |
| `nemotron-asr-finetune` | Orchestration skill for NVIDIA Nemotron Speech (Riva) / NeMo ASR domain and language adaptation. Given a goal like "improve/fine-tune ASR for my domain or language", it scopes the task, picks the cheapest sufficient path (word boosting → n-gram LM → fine-tuning), delegates each stage to the right sub-skill (data generation, training, evaluation, deployment), and answers cost/time/data questions along the way. |
| `nemotron-customize` | Plan, configure, and chain repo-native Nemotron customization steps into single-step or multi-step pipelines: curation, translation, SFT/PEFT (AutoModel or Megatron-Bridge), pretraining/CPT, RL alignment (DPO/RLVR/GRPO/RLHF), BYOB/MCQ benchmarks, checkpoint conversion, ModelOpt optimization, env profiles, and evaluation of trained checkpoints or existing/hosted endpoints. Use when a request names a Nemotron step or workflow, or asks to clean, translate, train, fine-tune, align, convert, optimize, evaluate, or compose these into a pipeline. Do NOT use for frontend/dashboard/visualization work, generic ML advice, billing/access, or non-Nemotron coding tasks. |
| `nemotron-policy-generator` | Generates BYO custom safety policies for NVIDIA Nemotron content-safety guardrails — Nemotron-Content-Safety-Reasoning-4B (text) and multimodal Nemotron-3-Content-Safety. Produces a Markdown policy, JSON taxonomy, and drop-in inference prompts. Maps rough words or an existing policy to V2 categories, adding custom categories or topic-following rules. |
| `nemotron-retrieval-recipes` | Use when planning, debugging, tuning, evaluating, exporting, or deploying public Nemotron `embed`/`rerank` retrieval recipes. |
| `nemotron-speech` | Routes NVIDIA Nemotron Speech (Formerly Riva) NIM tasks — deploys, runs, and tests ASR, TTS, and NMT NIMs on build.nvidia.com or self-hosted. |
| `nemotron-voice-agent-builder` | Create, refine, or fix NVIDIA voice agents (Cascaded or Omni) with Pipecat or LiveKit. Use when building, scaffolding, or iterating on a real-time voice-agent pipeline, including speech (ASR/TTS) customization and cloud or local deployment. Not for offline/batch speech-to-text, text-only chat or RAG, or generic Docker or CUDA work unrelated to a voice agent. |

### NVIDIA Tools & Workflows (6 skills)

| Skill Name | Description |
| :--- | :--- |
| `nvidia-app` | > |
| `nvidia-broadcast` | Use when controlling NVIDIA Broadcast through MCP to apply effects, process local media, select devices, or change camera resolution, or when Broadcast is missing or too old to expose the gateway and the user wants it installed; not for Broadcast app settings outside the MCP gateway. |
| `nvidia-ontology-management` | >- |
| `nvidia-ontology-query` | >- |
| `nvidia-ontology-setup` | >- |
| `nvidia-skill-finder` | >- |

### PAIDF Tools & Workflows (6 skills)

| Skill Name | Description |
| :--- | :--- |
| `paidf-augmentation` | >- |
| `paidf-auto-labeling` | >- |
| `paidf-cosmos-predict` | >- |
| `paidf-curation-and-retrieval` | >- |
| `paidf-orchestration-setup` | Audit, prepare, and deploy PAIDF Orchestration on a Kubernetes GPU cluster - single-GPU H100/L40S hosts, managed Kubernetes, kubeadm, and similar. Select for requests to set up, install, deploy, configure, or check a PAIDF Orchestration environment; run a workflow on a new or unverified GPU host; connect via kubeconfig; validate GPU compute; deploy the Airflow controller; or choose external versus in-cluster model services. A plain SSH host is not a supported backend. |
| `paidf-orchestration-write-dag` | Use when a user describes a custom PAIDF Orchestration pipeline — a specific ordered combination of stages such as augmentation only, auto-labeling only, detection+captioning only, or image attribute augmentation without full auto-labeling — that no existing DAG in airflow/dags/workflows/ covers, and asks for a new Kubernetes DAG. Also use to check that a generated or existing DAG's model/container/prompt choices match an external spec document (e.g. a PAIDF `launchable.md`). |

### PHYSICAL Tools & Workflows (6 skills)

| Skill Name | Description |
| :--- | :--- |
| `physical-ai-defect-image-generation` | >- |
| `physical-ai-event-video-generation` | Run the PAIDF Orchestration Event Video Generation DAG on Kubernetes - image-to-video anomaly generation, auto-labeling, and anomaly dataset generation. Select for requests about event video generation, anomaly video generation, image-to-video synthesis, Cosmos3 image2video, anomaly dataset creation, safety/surveillance SDG, or generating person-falling, person-climbing, person-running, fighting, smoking/vaping, fire/smoke, or shoplifting video clips from a seed image. Runs environment setup first when controller readiness is unknown. Not for person-crop clothing/attribute augmentation (that is image-attribute-augmentation-workflow) and not for video style transfer. |
| `physical-ai-image-attribute-augmentation` | Run the PAIDF Orchestration Image Attribute Augmentation DAG on Kubernetes - person-crop clothing augmentation, attribute search, and augmented dataset generation. Select for requests about image attribute augmentation, person attribute search, person re-identification data, clothing augmentation, attribute captions, augmentation payloads, run status, or result retrieval. Runs environment setup first when controller readiness is unknown. Not for video or defect-image generation. |
| `physical-ai-infrastructure-setup-and-resilient-scaling` | >- |
| `physical-ai-neural-reconstruction` | Router for NVIDIA NuRec/NRE: USDZ rendering, NCore conversion, 3DGS, gRPC sensor sim, carline adaptation, PhysicalAI HF datasets. Do NOT use for SimReady or infra setup. |
| `physical-ai-video-data-augmentation` | >- |

### MCORE Tools & Workflows (5 skills)

| Skill Name | Description |
| :--- | :--- |
| `mcore-create-issue` | Investigate a failing GitHub Actions run or job and create a GitHub issue for the failure. |
| `mcore-linting-and-formatting` | Linting and formatting for Megatron-LM. Covers running autoformat.sh, tools (ruff, black, isort, pylint, mypy), and code style rules. |
| `mcore-run-on-slurm` | How to launch distributed Megatron-LM training jobs on a SLURM cluster. Covers a minimal sbatch skeleton, environment-variable setup for torch.distributed.run, CUDA_DEVICE_MAX_CONNECTIONS rules across hardware and parallelism modes, container conventions, monitoring, and per-rank failure diagnosis. |
| `mcore-split-pr` | Split a PR into multiple PRs to reduce the number of required CODEOWNERS reviewer groups. |
| `mcore-testing` | Test system for Megatron-LM. Covers test layout, recipe YAML structure, adding and running unit and functional tests, golden values, marker filters, and CI parity. |

### AMC Tools & Workflows (4 skills)

| Skill Name | Description |
| :--- | :--- |
| `amc-run-rtsp-calibration` | Calibrate a new dataset from live RTSP camera streams via the AutoMagicCalib REST API. Use when the user provides RTSP URLs or asks to calibrate live cameras; VIOS records clips, AMC ingests them, then runs calibration. |
| `amc-run-sample-calibration` | Run end-to-end calibration on the shipped sample dataset (sdg_08_2_sample_data_010926.zip) against a running AMC microservice. Use when user says 'test sample dataset', 'run sample calibration', 'verify AMC install', or 'launch and test'. |
| `amc-run-video-calibration` | Calibrates pre-recorded `cam_*.mp4` datasets through the AutoMagicCalib REST API. Use for user-supplied local MP4s; route live RTSP streams to `amc-run-rtsp-calibration`. |
| `amc-setup-calibration-stack` | Launch AutoMagicCalib microservice and web UI from NGC release images via Docker Compose. Use when user says 'deploy auto calibration', 'launch auto calibration', 'launch AMC', 'start MS+UI', or 'set up auto-magic-calib'. Requires NGC API key. |

### DIGITAL Tools & Workflows (4 skills)

| Skill Name | Description |
| :--- | :--- |
| `digital-health-clinical-asr-build` | Stage 2 of the Clinical ASR Flywheel. Use when curating clinical terms, tagging IPA, and synthesizing a NeMo manifest. NOT for scoring (use /digital-health-clinical-asr-eval). |
| `digital-health-clinical-asr-eval` | Stage 3 of Clinical ASR Flywheel. Score a NeMo manifest, produce the five-section KER leaderboard (by-ipa_source diagnostic). Not for ASR auth (/riva-asr). |
| `digital-health-clinical-asr-finetune` | Stage 4 of the Clinical ASR Flywheel. Use when priority KER is above 0.3 to run stock NeMo SFT on Parakeet TDT v2 and offline cycle N+1 re-eval. NOT for generic word boosting (use /finetune-asr). |
| `digital-health-clinical-asr-setup` | Stage 1 of Clinical ASR Flywheel. Use when bootstrapping a cycle: NVCF+MW disclosure, NVIDIA_API_KEY check, deps install, TTS+ASR smoke test. |

### DYNAMO Tools & Workflows (4 skills)

| Skill Name | Description |
| :--- | :--- |
| `dynamo-interconnect-check` | Validate that a Dynamo deployment's NIXL/UCX/NCCL interconnect is ready for disaggregated serving over RDMA/NVLink. Use after recipe-runner brings a deployment up (especially disagg/multi-node) to confirm the KV transport is correct; use troubleshoot for diagnosing already-failed pods. |
| `dynamo-recipe-runner` | Select, validate, patch, and deploy existing NVIDIA Dynamo Kubernetes recipes. Use for model/backend/GPU/deployment-mode recipe bring-up; use router-starter for router-only mode work and troubleshoot for broken deployments. |
| `dynamo-router-starter` | Start or patch Dynamo router modes and run router endpoint smoke checks. Use for round-robin, KV-aware, least-loaded, or device-aware routing setup; use recipe-runner for recipe deployment and troubleshoot for failure diagnosis. |
| `dynamo-troubleshoot` | Diagnose failed or unhealthy Dynamo deployments. Use when pods, model-cache jobs, PVCs, workers, frontend/router health, endpoints, or benchmark jobs fail; use recipe-runner/router-starter before this for normal bring-up. |

### DICOM Tools & Workflows (3 skills)

| Skill Name | Description |
| :--- | :--- |
| `dicom-metadata-extract` | Used for extracting selected metadata from one DICOM file and flagging standard-tag PHI presence. Not for anonymization or clinical use. |
| `dicom-series-preflight` | Used for header-only preflight of one DICOM series folder before conversion or inference. Not for de-identification or clinical clearance. |
| `dicom-series-to-volume` | Used for converting one CT DICOM series folder to a HU NIfTI volume with affine evidence. Not for multi-frame DICOM or clinical use. |

### HOLOHUB Tools & Workflows (3 skills)

| Skill Name | Description |
| :--- | :--- |
| `holohub-app-lifecycle` | Use for non-failing HoloHub app work with ./holohub: scaffold, build, run, test, visual evidence, lint, and flow benchmarking. |
| `holohub-debug-build-run` | Use when a concrete ./holohub command fails, hangs, regresses, or returns wrong output and needs reproducible diagnosis and verification. |
| `holohub-module-lifecycle` | Use for reusable Holoscan Module work with ./holohub: scaffold, tests, editable install, DEB/WHEEL packaging, and clean-consumer proof. |

### OMNIVERSE Tools & Workflows (3 skills)

| Skill Name | Description |
| :--- | :--- |
| `omniverse-cad-to-simready` | Coordinate the end-to-end CAD/source-asset to SimReady workflow. Use for broad requests such as CAD to SimReady, source asset to simulation-ready USD, or prop packaging that require conversion, material/physics assignment, SimReady conformance, validation, and optional package creation; deploy or verify Content Agents services first when property assignment is enabled; route single-stage work through nested references. |
| `omniverse-realtime-viewer` | Use as the top-level router for Omniverse Realtime Viewer USD app requests and focused viewer reference documents. |
| `omniverse-usd-performance-tuning` | Top-level workflow skill for USD performance diagnosis and optimization. Handles slow loading, high memory, low FPS, and broad scene-optimization requests; delegates auth/runtime setup to Phase 0 owners. |

### Retrieval Augmented Generation (RAG Blueprints & Evals) (3 skills)

| Skill Name | Description |
| :--- | :--- |
| `rag-blueprint` | NVIDIA RAG Blueprint — deploy, configure, troubleshoot, and manage. Handles any RAG action: deploy, install, start, enable, disable, toggle, change, configure, troubleshoot, debug, fix, shutdown, stop, or tear down any RAG feature or service (Agentic RAG, VLM, guardrails, query rewriting, models, search, ingestion, observability, summarization, reasoning, and more). |
| `rag-eval` | >- |
| `rag-perf` | >- |

### RTVI Tools & Workflows (3 skills)

| Skill Name | Description |
| :--- | :--- |
| `rtvi-cv-customize-model` | How to swap the DeepStream CV detection model in the VSS Alerts Blueprint verification (2d_cv) mode - covers ONNX export, custom bbox parsers, compose mount gotchas, nvinfer config, runtime TRT engine build, deployment, and a segmentation-capable model addendum handoff. |
| `rtvi-cv-scaffold-vss-service` | > |
| `rtvi-vlm-customize-model` | How to swap the VLM in the VSS Alerts Blueprint — covers RTVI-VLM microservice deployment methods, all three VLM consumers (rtvi-vlm, vlm-as-verifier, vss-agent), and health checks. |

### NVIDIA Warp (Differentiable GPU Simulation) (3 skills)

| Skill Name | Description |
| :--- | :--- |
| `warp-compile-time-optimizer` | >- |
| `warp-debug-gradients` | >- |
| `warp-eval` | > |

### CUDAQ Tools & Workflows (2 skills)

| Skill Name | Description |
| :--- | :--- |
| `cudaq-guide` | Use for CUDA-Q setup, simulation targets, QPU access, and @cudaq.kernel authoring guidance. |
| `cudaq-importing` | Use when porting circuits from another framework (e.g. Qiskit) into CUDA-Q kernels while preserving the source algorithm and validation fidelity. |

### FOUNDATIONPOSE Tools & Workflows (2 skills)

| Skill Name | Description |
| :--- | :--- |
| `foundationpose-pipeline` | Adapt BOP datasets, run the FoundationPose perception pipeline with TAO depth, and evaluate or re-score pose results. Use for dataset runs and result comparisons; environment installation belongs to foundationpose-setup. |
| `foundationpose-setup` | Install or repair the FoundationPose perception pipeline and build its FoundationStereo TensorRT engines. Use for SAM3/TAO dependency conflicts, CUDA library failures, and depth-engine shape or precision decisions. |

### PHYSICSNEMO Tools & Workflows (2 skills)

| Skill Name | Description |
| :--- | :--- |
| `physicsnemo-discover` | Official NVIDIA-authored guidance for navigating PhysicsNeMo — pick the model, datapipe, or example for a SciML/AI4Science task (surrogates, forecasting, downscaling, physics-informed, inverse, generative). Points at existing files via live repo search; never writes code. Do NOT use for installation or environment setup, training-loop or other code authoring/scaffolding, contributor/CI/packaging questions, repo-specific questions in physicsnemo-sym/-cfd/-curator, or general (non-physics) ML/PyTorch. |
| `physicsnemo-shard-tensor` | Official NVIDIA-authored guidance for PhysicsNeMo ShardTensor domain parallelism — integrate domain parallelism into training/inference scripts (new or existing) with DDP or FSDP2, write and register shard patches to enable new layers/ops, and bootstrap multi-GPU correctness tests. Use when working with ShardTensor, scatter_tensor, domain parallelism, sequence/spatial sharding, ring attention, DeviceMesh + DDP/FSDP2 hybrid parallelism, or physicsnemo.domain_parallel. Do NOT use for generic PyTorch DDP/FSDP setup without domain parallelism, picking a PhysicsNeMo model or example (use physicsnemo-discover), or non-distributed training questions. |

### ACCELERATED Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `accelerated-computing-cudf` | Official NVIDIA-authored guidance for NVIDIA cuDF GPU DataFrames, pandas acceleration, dask-cuDF, ETL, joins, groupby, CSV/Parquet I/O, nullable semantics, and multi-GPU DataFrame workloads. |

### AMBIENT Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `ambient-healthcare-agent-with-nemotron-voice-agent` | Customize NVIDIA Nemotron Voice Agent's Generic Pipecat example for healthcare appointment, five-field patient intake, or custom tool-calling workflows without a separate backend. |

### DALI Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `dali-dynamic-mode` | DALI imperative dynamic mode (`nvidia.dali.experimental.dynamic`, ndd): use when working on ndd code or migrating pipelines; skip pipeline-only tasks. |

### DATA Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `data-designer` | Use when the user wants to create a dataset, generate synthetic data, or build a data generation pipeline. |

### G Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `g-assist-mcp-skill` | >- |

### ISAAC Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `isaac-mission-control-showcase` | Run and validate an end-to-end Mission Control showcase with a locally installed Isaac Sim launched in its GUI window, driven through the isaac-sim-remote Python server, with Nova Carter SIL. Use for demos, showcase replays, Mission Control driving a simulated robot, or diagnosing the integrated small-warehouse scenario. Detect existing Isaac Sim installations without modifying them, automatically select a usable runtime without prompting whenever compatibility can be confirmed, and delegate requested installation or version changes to isaac-sim-installation. Defaults to a canonical Isaac 6.1 warehouse and deterministic circular route when the user does not specify another scenario. |

### LAUNCH Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `launch-nemo-rl` | Playbook for launching, monitoring, stopping, and debugging NeMo-RL recipes on a Kubernetes cluster via the nrl-k8s CLI. Covers ephemeral vs long-lived RayCluster modes, iterating on runs, and debugging hung or failed training jobs. |

### MEDTECH Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `medtech-model-evidence-export` | Exports sanitized metadata, parameters, reproducibility details, quality metrics, and optional review artifacts from Medical AI inference runs or evidence packs to MLflow. Use after inference, including NV-Generate runs; not for live training tracking, model registration, or clinical use. |

### NEMOCLAW Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `nemoclaw-user-guide` | Guides human users' AI agents to the NemoClaw docs MCP server and canonical Fern documentation in Markdown form. Use when users ask how to install, configure, operate, troubleshoot, secure, or learn NemoClaw with an AI coding assistant. Trigger keywords - nemoclaw docs, use nemoclaw with ai agent, nemoclaw mcp docs, nemoclaw install help, nemoclaw quickstart, nemoclaw markdown docs, llms.txt, agent skills. |

### PORTFOLIO Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `portfolio-optimization` | Use when a user asks to build, optimize, backtest, rebalance, or analyze a stock portfolio with Mean-CVaR, Mean-Variance/SOCP variance caps, efficient frontiers, scenario generation, or NVIDIA cuOpt. |

### RTX Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `rtx-remix-modding` | Mod or remaster a game with RTX Remix - open and edit projects, swap textures and models. Connect to the Remix Toolkit App via MCP. Not for non-Remix game interaction. |

### SKILL Tools & Workflows (1 skills)

| Skill Name | Description |
| :--- | :--- |
| `skill-card-generator` | Use only to generate or update a governance skill card for a specified existing agent skill directory. Do not use for explaining, listing, comparing, or discussing skill capabilities. |
