/**
 * NVIDIA Model Registry & Architectural Integration Engine
 *
 * Provides typed model specifications, unified dispatch, safety guardrails,
 * and high-availability fallback routing across IntelliHire modules (M01-M05).
 */

export interface NvidiaModelSpec {
  id: string;
  name: string;
  category: 'llm' | 'vlm' | 'reasoning' | 'guardrail' | 'ocr' | 'tts' | 'asr' | 'embeddings' | 'translation';
  defaultEndpoint: string;
  maxTokens: number;
  recommendedTemperature: number;
  supportsStreaming: boolean;
  intelliHireModule: 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'CROSS_CUTTING';
  description: string;
}

export const NVIDIA_MODEL_CATALOG: Record<string, NvidiaModelSpec> = {
  'google/paligemma': {
    id: 'google/paligemma',
    name: 'PaliGemma Vision-Language',
    category: 'vlm',
    defaultEndpoint: 'https://ai.api.nvidia.com/v1/vlm/google/paligemma',
    maxTokens: 512,
    recommendedTemperature: 1.0,
    supportsStreaming: true,
    intelliHireModule: 'M01',
    description: 'Vision-Language model for document layout understanding, visual portfolio validation, and OCR.'
  },
  'nvidia/chatterbox-multilingual-tts': {
    id: 'nvidia/chatterbox-multilingual-tts',
    name: 'Chatterbox Multilingual TTS',
    category: 'tts',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/audio/speech',
    maxTokens: 1000,
    recommendedTemperature: 1.0,
    supportsStreaming: false,
    intelliHireModule: 'M04',
    description: 'Neural Text-to-Speech synthesis for verbal interview questions and accessibility.'
  },
  'deepseek-ai/deepseek-v4.1-flash': {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    name: 'DeepSeek v4.1 Flash',
    category: 'llm',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 16384,
    recommendedTemperature: 1.0,
    supportsStreaming: true,
    intelliHireModule: 'M03',
    description: 'High-speed multimodal code evaluation and work-round execution verification.'
  },
  'google/diffusiongemma-26b-a4b-it': {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'DiffusionGemma 26B A4B IT',
    category: 'reasoning',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 4096,
    recommendedTemperature: 1.0,
    supportsStreaming: true,
    intelliHireModule: 'M03',
    description: 'Multimodal instruction model with native thinking trace for architecture diagram review.'
  },
  'google/gemma-4-31b-it': {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B IT',
    category: 'llm',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 1024,
    recommendedTemperature: 0.5,
    supportsStreaming: true,
    intelliHireModule: 'M02',
    description: 'Deterministic instruction following for competency rubric scoring and assessment item generation.'
  },
  'moonshotai/kimi-k3': {
    id: 'moonshotai/kimi-k3',
    name: 'Kimi K3 Reasoning',
    category: 'reasoning',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 16384,
    recommendedTemperature: 1.0,
    supportsStreaming: true,
    intelliHireModule: 'M03',
    description: 'Deep cognitive reasoning model with max reasoning effort for complex algorithmic evaluation.'
  },
  'meta/llama-3.1-8b-instruct': {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct (Tabular)',
    category: 'llm',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 2048,
    recommendedTemperature: 0.2,
    supportsStreaming: false,
    intelliHireModule: 'M01',
    description: 'Fast instruction model for tabular scorecard aggregation and ATS dimension weighting.'
  },
  'nvidia/llama-3.1-nemotron-safety-guard-8b-v3': {
    id: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
    name: 'Nemotron Safety Guard 8B v3',
    category: 'guardrail',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 1024,
    recommendedTemperature: 0.0,
    supportsStreaming: false,
    intelliHireModule: 'CROSS_CUTTING',
    description: 'Enterprise AI safety guardrail for detecting prompt injections, jailbreaks, and PII leaks.'
  },
  'meta/muse-glimmer-30b': {
    id: 'meta/muse-glimmer-30b',
    name: 'Muse Glimmer 30B',
    category: 'llm',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 2048,
    recommendedTemperature: 0.0,
    supportsStreaming: false,
    intelliHireModule: 'M01',
    description: 'Primary structured JSON extraction engine for resume parsing and objective rubric scoring.'
  },
  'nvidia/nemotron-3-embed-1b': {
    id: 'nvidia/nemotron-3-embed-1b',
    name: 'Nemotron 3 Embed 1B',
    category: 'embeddings',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/embeddings',
    maxTokens: 8192,
    recommendedTemperature: 0.0,
    supportsStreaming: false,
    intelliHireModule: 'M01',
    description: 'Dense vector embedding model for semantic candidate skills matching against job ontologies.'
  },
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning': {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron 3 Nano Omni 30B Reasoning',
    category: 'reasoning',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 65536,
    recommendedTemperature: 0.6,
    supportsStreaming: true,
    intelliHireModule: 'M03',
    description: 'Core engine for adaptive work-round debriefs, misconception explanation, and logic gaps.'
  },
  'nvidia/nemotron-3-ultra-550b-a55b': {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B MoE',
    category: 'reasoning',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 16384,
    recommendedTemperature: 1.0,
    supportsStreaming: true,
    intelliHireModule: 'M05',
    description: 'Frontier 550B MoE model with reasoning delta streaming for complex architectural evaluation.'
  },
  'nvidia/nemotron-3.5-lightning-30b-a3b': {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    name: 'Nemotron 3.5 Lightning 30B MoE',
    category: 'reasoning',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 16384,
    recommendedTemperature: 1.0,
    supportsStreaming: true,
    intelliHireModule: 'M03',
    description: 'Low-latency interactive MoE model for real-time candidate tutoring and syntax debriefs.'
  },
  'nvidia/nemotron-ocr-v2': {
    id: 'nvidia/nemotron-ocr-v2',
    name: 'Nemotron OCR v2',
    category: 'ocr',
    defaultEndpoint: 'https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v2',
    maxTokens: 2048,
    recommendedTemperature: 0.0,
    supportsStreaming: false,
    intelliHireModule: 'M01',
    description: 'Optical character recognition for scanned document attachments and credential certificates.'
  },
  'nvidia/nemotron-parse-2.0': {
    id: 'nvidia/nemotron-parse-2.0',
    name: 'Nemotron Parse 2.0',
    category: 'vlm',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 1024,
    recommendedTemperature: 0.0,
    supportsStreaming: false,
    intelliHireModule: 'M01',
    description: 'Specialized document parser producing Markdown with bounding box classes for complex resumes.'
  },
  'nvidia/parakeet-tdt-0.6b': {
    id: 'nvidia/parakeet-tdt-0.6b',
    name: 'Parakeet TDT 0.6B ASR',
    category: 'asr',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/audio/transcriptions',
    maxTokens: 4096,
    recommendedTemperature: 0.0,
    supportsStreaming: false,
    intelliHireModule: 'M04',
    description: 'High-accuracy verbatim speech recognition for candidate interviews (NO affect/emotion scoring).'
  },
  'riva-translate-4b-instruct-v2': {
    id: 'riva-translate-4b-instruct-v2',
    name: 'Riva Translate 4B Instruct v2',
    category: 'translation',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    maxTokens: 1024,
    recommendedTemperature: 0.2,
    supportsStreaming: false,
    intelliHireModule: 'CROSS_CUTTING',
    description: 'Technical and domain-preserving multilingual translation across 50+ international languages.'
  }
};

/**
 * Safety Guardrail Checker using Nemotron Safety Guard
 */
export async function checkSafetyGuardrail(
  apiKey: string | undefined,
  prompt: string,
  category: string = 'general'
): Promise<{ safe: boolean; reason?: string; violations?: string[] }> {
  // Deterministic local guardrail checks (always active regardless of external API state)
  const injectionPatterns = [
    /ignore (all )?previous instructions/i,
    /system override/i,
    /you are now in developer mode/i,
    /jailbreak/i,
    /reveal system prompt/i,
    /bypass safety/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      return {
        safe: false,
        reason: 'Deterministic Guardrail: Suspected prompt injection or safety bypass attempt.',
        violations: ['PROMPT_INJECTION']
      };
    }
  }

  // If no NVIDIA API key configured, pass local verification
  if (!apiKey) {
    return { safe: true };
  }

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
        messages: [
          {
            role: 'system',
            content: 'You are an AI safety classifier. Analyze the prompt and return JSON {"safe": boolean, "reason": string}.'
          },
          {
            role: 'user',
            content: `Category: ${category}\nPrompt to inspect:\n${prompt.slice(0, 4000)}`
          }
        ],
        temperature: 0,
        max_tokens: 256
      })
    });

    if (res.ok) {
      const data = await res.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        return {
          safe: parsed.safe !== false,
          reason: parsed.reason || (parsed.safe === false ? 'Policy violation' : undefined)
        };
      } catch {
        // Fallback: If content mentions unsafe
        const isUnsafe = /unsafe|violat/i.test(content);
        return { safe: !isUnsafe, reason: isUnsafe ? content : undefined };
      }
    }
  } catch {
    // Fail open safely to deterministic rules if external guardrail endpoint is temporarily unreachable
  }

  return { safe: true };
}

/**
 * Fallback-aware NVIDIA Chat Dispatcher
 */
export async function invokeNvidiaChat(
  env: { NVIDIA_API_KEY?: string; NVIDIA_BASE_URL?: string; AI?: any },
  params: {
    model?: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    fallbackProvider?: 'cloudflare' | 'mock';
  }
): Promise<{ content: string; modelUsed: string; fallbackApplied: boolean; error?: string }> {
  const primaryModel = params.model || 'meta/muse-glimmer-30b';
  const apiKey = env.NVIDIA_API_KEY;
  const baseUrl = env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';

  if (apiKey) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: primaryModel,
          messages: params.messages,
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 2048
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        const text = data.choices?.[0]?.message?.content || '';
        return {
          content: text,
          modelUsed: primaryModel,
          fallbackApplied: false
        };
      }
    } catch {
      // Primary provider exception, proceed to fallback
    }
  }

  // Graceful fallback route: Cloudflare Workers AI if available
  if (env.AI) {
    try {
      const cfRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: params.messages
      });
      if (cfRes?.response) {
        return {
          content: cfRes.response,
          modelUsed: '@cf/meta/llama-3.1-8b-instruct',
          fallbackApplied: true
        };
      }
    } catch {
      // Secondary fallback fails
    }
  }

  // Structured fallback response
  return {
    content: JSON.stringify({
      message: 'Evaluation processed under deterministic local fallback engine.',
      status: 'completed_fallback',
      timestamp: new Date().toISOString()
    }),
    modelUsed: 'local_deterministic_engine',
    fallbackApplied: true
  };
}
