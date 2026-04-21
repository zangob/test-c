import type { ModelName } from './model.js'
import type { APIProvider } from './providers.js'

export type ModelConfig = Record<APIProvider, ModelName>

// @[MODEL LAUNCH]: Add a new CLAUDE_*_CONFIG constant here. Double check the correct model strings
// here since the pattern may change.

export const CLAUDE_3_7_SONNET_CONFIG = {
  firstParty: 'claude-3-7-sonnet-20250219',
  bedrock: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  vertex: 'claude-3-7-sonnet@20250219',
  foundry: 'claude-3-7-sonnet',
  zai: 'claude-3-7-sonnet-20250219',
  openrouter: 'claude-3-7-sonnet-20250219',
  lmstudio: 'claude-3-7-sonnet-20250219',
  poe: 'claude-3-7-sonnet-20250219',
} as const satisfies ModelConfig

export const CLAUDE_3_5_V2_SONNET_CONFIG = {
  firstParty: 'claude-3-5-sonnet-20241022',
  bedrock: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  vertex: 'claude-3-5-sonnet-v2@20241022',
  foundry: 'claude-3-5-sonnet',
  zai: 'claude-3-5-sonnet-20241022',
  openrouter: 'claude-3-5-sonnet-20241022',
  lmstudio: 'claude-3-5-sonnet-20241022',
  poe: 'claude-3-5-sonnet-20241022',
} as const satisfies ModelConfig

export const CLAUDE_3_5_HAIKU_CONFIG = {
  firstParty: 'claude-3-5-haiku-20241022',
  bedrock: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  vertex: 'claude-3-5-haiku@20241022',
  foundry: 'claude-3-5-haiku',
  zai: 'claude-3-5-haiku-20241022',
  openrouter: 'claude-3-5-haiku-20241022',
  lmstudio: 'claude-3-5-haiku-20241022',
  poe: 'claude-3-5-haiku-20241022',
} as const satisfies ModelConfig

export const CLAUDE_HAIKU_4_5_CONFIG = {
  firstParty: 'claude-haiku-4-5-20251001',
  bedrock: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  vertex: 'claude-haiku-4-5@20251001',
  foundry: 'claude-haiku-4-5',
  zai: 'claude-haiku-4-5-20251001',
  openrouter: 'claude-haiku-4-5-20251001',
  lmstudio: 'claude-haiku-4-5-20251001',
  poe: 'claude-haiku-4-5-20251001',
} as const satisfies ModelConfig

export const CLAUDE_SONNET_4_CONFIG = {
  firstParty: 'claude-sonnet-4-20250514',
  bedrock: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
  vertex: 'claude-sonnet-4@20250514',
  foundry: 'claude-sonnet-4',
  zai: 'claude-sonnet-4-20250514',
  openrouter: 'claude-sonnet-4-20250514',
  lmstudio: 'claude-sonnet-4-20250514',
  poe: 'claude-sonnet-4-20250514',
} as const satisfies ModelConfig

export const CLAUDE_SONNET_4_5_CONFIG = {
  firstParty: 'claude-sonnet-4-5-20250929',
  bedrock: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  vertex: 'claude-sonnet-4-5@20250929',
  foundry: 'claude-sonnet-4-5',
  zai: 'claude-sonnet-4-5-20250929',
  openrouter: 'claude-sonnet-4-5-20250929',
  lmstudio: 'claude-sonnet-4-5-20250929',
  poe: 'claude-sonnet-4-5-20250929',
} as const satisfies ModelConfig

export const CLAUDE_OPUS_4_CONFIG = {
  firstParty: 'claude-opus-4-20250514',
  bedrock: 'us.anthropic.claude-opus-4-20250514-v1:0',
  vertex: 'claude-opus-4@20250514',
  foundry: 'claude-opus-4',
  zai: 'claude-opus-4-20250514',
  openrouter: 'claude-opus-4-20250514',
  lmstudio: 'claude-opus-4-20250514',
  poe: 'claude-opus-4-20250514',
} as const satisfies ModelConfig

export const CLAUDE_OPUS_4_1_CONFIG = {
  firstParty: 'claude-opus-4-1-20250805',
  bedrock: 'us.anthropic.claude-opus-4-1-20250805-v1:0',
  vertex: 'claude-opus-4-1@20250805',
  foundry: 'claude-opus-4-1',
  zai: 'claude-opus-4-1-20250805',
  openrouter: 'claude-opus-4-1-20250805',
  lmstudio: 'claude-opus-4-1-20250805',
  poe: 'claude-opus-4-1-20250805',
} as const satisfies ModelConfig

export const CLAUDE_OPUS_4_5_CONFIG = {
  firstParty: 'claude-opus-4-5-20251101',
  bedrock: 'us.anthropic.claude-opus-4-5-20251101-v1:0',
  vertex: 'claude-opus-4-5@20251101',
  foundry: 'claude-opus-4-5',
  zai: 'claude-opus-4-5-20251101',
  openrouter: 'claude-opus-4-5-20251101',
  lmstudio: 'claude-opus-4-5-20251101',
  poe: 'claude-opus-4-5-20251101',
} as const satisfies ModelConfig

export const CLAUDE_OPUS_4_6_CONFIG = {
  firstParty: 'claude-opus-4-6',
  bedrock: 'us.anthropic.claude-opus-4-6-v1',
  vertex: 'claude-opus-4-6',
  foundry: 'claude-opus-4-6',
  zai: 'claude-opus-4-6',
  openrouter: 'claude-opus-4-6',
  lmstudio: 'claude-opus-4-6',
  poe: 'claude-opus-4-6',
} as const satisfies ModelConfig

export const CLAUDE_SONNET_4_6_CONFIG = {
  firstParty: 'claude-sonnet-4-6',
  bedrock: 'us.anthropic.claude-sonnet-4-6',
  vertex: 'claude-sonnet-4-6',
  foundry: 'claude-sonnet-4-6',
  zai: 'claude-sonnet-4-6',
  openrouter: 'claude-sonnet-4-6',
  lmstudio: 'claude-sonnet-4-6',
  poe: 'claude-sonnet-4-6',
} as const satisfies ModelConfig

export const KIMI_K2_5_CONFIG = {
  firstParty: 'moonshotai/kimi-k2.5',
  bedrock: 'moonshotai/kimi-k2.5',
  vertex: 'moonshotai/kimi-k2.5',
  foundry: 'moonshotai/kimi-k2.5',
  zai: 'moonshotai/kimi-k2.5',
  openrouter: 'moonshotai/kimi-k2.5',
  lmstudio: 'moonshotai/kimi-k2.5',
  poe: 'moonshotai/kimi-k2.5',
} as const satisfies ModelConfig

export const OPENAI_GPT_5_3_CODEX_CONFIG = {
  firstParty: 'openai/gpt5.3-codex',
  bedrock: 'openai/gpt5.3-codex',
  vertex: 'openai/gpt5.3-codex',
  foundry: 'openai/gpt5.3-codex',
  zai: 'openai/gpt5.3-codex',
  openrouter: 'openai/gpt-5.3-codex',
  lmstudio: 'openai/gpt-5.3-codex',
  poe: 'gpt-5.3-codex-spark',
} as const satisfies ModelConfig

export const OPENAI_GPT_5_4_CONFIG = {
  firstParty: 'openai/gpt-5.4',
  bedrock: 'openai/gpt-5.4',
  vertex: 'openai/gpt-5.4',
  foundry: 'openai/gpt-5.4',
  zai: 'openai/gpt-5.4',
  openrouter: 'openai/gpt-5.4',
  lmstudio: 'openai/gpt-5.4',
  poe: 'gpt-5.4',
} as const satisfies ModelConfig

export const OPENAI_GPT_5_1_CONFIG = {
  firstParty: 'openai/gpt-5.1',
  bedrock: 'openai/gpt-5.1',
  vertex: 'openai/gpt-5.1',
  foundry: 'openai/gpt-5.1',
  zai: 'openai/gpt-5.1',
  openrouter: 'openai/gpt-5.1',
  lmstudio: 'openai/gpt-5.1',
  poe: 'gpt-5.1',
} as const satisfies ModelConfig

export const OPENAI_GPT_OSS_120B_CONFIG = {
  firstParty: 'openai/gpt-oss-120b',
  bedrock: 'openai/gpt-oss-120b',
  vertex: 'openai/gpt-oss-120b',
  foundry: 'openai/gpt-oss-120b',
  zai: 'openai/gpt-oss-120b',
  openrouter: 'openai/gpt-oss-120b',
  lmstudio: 'openai/gpt-oss-120b',
  poe: 'gpt-oss-120b',
} as const satisfies ModelConfig

export const Z_AI_GLM5_CONFIG = {
  firstParty: 'z-ai/glm5',
  bedrock: 'z-ai/glm5',
  vertex: 'z-ai/glm5',
  foundry: 'z-ai/glm5',
  zai: 'glm-5',
  openrouter: 'z-ai/glm-5',
  lmstudio: 'z-ai/glm-5',
  poe: 'z-ai/glm-5',
} as const satisfies ModelConfig

export const Z_AI_GLM4_7_CONFIG = {
  firstParty: 'glm-4.7',
  bedrock: 'glm-4.7',
  vertex: 'glm-4.7',
  foundry: 'glm-4.7',
  zai: 'glm-4.7',
  openrouter: 'z-ai/glm-4.7',
  lmstudio: 'z-ai/glm-4.7',
  poe: 'z-ai/glm-4.7',
} as const satisfies ModelConfig

export const Z_AI_GLM5_TURBO_CONFIG = {
  firstParty: 'glm-5-turbo',
  bedrock: 'glm-5-turbo',
  vertex: 'glm-5-turbo',
  foundry: 'glm-5-turbo',
  zai: 'glm-5-turbo',
  openrouter: 'z-ai/glm-5-turbo',
  lmstudio: 'z-ai/glm-5-turbo',
  poe: 'z-ai/glm-5-turbo',
} as const satisfies ModelConfig

export const Z_AI_GLM4_5_CONFIG = {
  firstParty: 'glm-4.5',
  bedrock: 'glm-4.5',
  vertex: 'glm-4.5',
  foundry: 'glm-4.5',
  zai: 'glm-4.5',
  openrouter: 'z-ai/glm-4.5',
  lmstudio: 'z-ai/glm-4.5',
  poe: 'z-ai/glm-4.5',
} as const satisfies ModelConfig

export const Z_AI_GLM4_5_AIR_CONFIG = {
  firstParty: 'glm-4.5-Air',
  bedrock: 'glm-4.5-Air',
  vertex: 'glm-4.5-Air',
  foundry: 'glm-4.5-Air',
  zai: 'glm-4.5-Air',
  openrouter: 'z-ai/glm-4.5-air',
  lmstudio: 'z-ai/glm-4.5-air',
  poe: 'z-ai/glm-4.5-air',
} as const satisfies ModelConfig

export const MINIMAX_M2_5_CONFIG = {
  firstParty: 'minimaxai/minimax-m2.5',
  bedrock: 'minimaxai/minimax-m2.5',
  vertex: 'minimaxai/minimax-m2.5',
  foundry: 'minimaxai/minimax-m2.5',
  zai: 'minimaxai/minimax-m2.5',
  openrouter: 'minimax/minimax-m2.5',
  lmstudio: 'minimax/minimax-m2.5',
  poe: 'minimaxai/minimax-m2.5',
} as const satisfies ModelConfig

// OpenRouter free models
export const QWEN36_PLUS_FREE_CONFIG = {
  firstParty: 'qwen/qwen3.6-plus:free',
  bedrock: 'qwen/qwen3.6-plus:free',
  vertex: 'qwen/qwen3.6-plus:free',
  foundry: 'qwen/qwen3.6-plus:free',
  zai: 'qwen/qwen3.6-plus:free',
  openrouter: 'qwen/qwen3.6-plus:free',
  lmstudio: 'qwen/qwen3.6-plus:free',
  poe: 'qwen/qwen3.6-plus:free',
  qwen_bridge: 'qwen/from Ehab',  // Must match exactly
} as const satisfies ModelConfig

export const Z_AI_GLM4_5_AIR_FREE_CONFIG = {
  firstParty: 'z-ai/glm-4.5-air:free',
  bedrock: 'z-ai/glm-4.5-air:free',
  vertex: 'z-ai/glm-4.5-air:free',
  foundry: 'z-ai/glm-4.5-air:free',
  zai: 'z-ai/glm-4.5-air:free',
  openrouter: 'z-ai/glm-4.5-air:free',
  lmstudio: 'z-ai/glm-4.5-air:free',
  poe: 'z-ai/glm-4.5-air:free',
} as const satisfies ModelConfig

export const MINIMAX_M2_5_FREE_CONFIG = {
  firstParty: 'minimax/minimax-m2.5:free',
  bedrock: 'minimax/minimax-m2.5:free',
  vertex: 'minimax/minimax-m2.5:free',
  foundry: 'minimax/minimax-m2.5:free',
  zai: 'minimax/minimax-m2.5:free',
  openrouter: 'minimax/minimax-m2.5:free',
  lmstudio: 'minimax/minimax-m2.5:free',
  poe: 'minimax/minimax-m2.5:free',
} as const satisfies ModelConfig

// @[MODEL LAUNCH]: Register the new config here.
export const ALL_MODEL_CONFIGS = {
  kimiK25: KIMI_K2_5_CONFIG,
  openaiGpt53Codex: OPENAI_GPT_5_3_CODEX_CONFIG,
  openaiGpt54: OPENAI_GPT_5_4_CONFIG,
  openaiGpt51: OPENAI_GPT_5_1_CONFIG,
  openaiGptOss120b: OPENAI_GPT_OSS_120B_CONFIG,
  zAiGlm5: Z_AI_GLM5_CONFIG,
  zAiGlm5Turbo: Z_AI_GLM5_TURBO_CONFIG,
  zAiGlm47: Z_AI_GLM4_7_CONFIG,
  zAiGlm45: Z_AI_GLM4_5_CONFIG,
  zAiGlm45Air: Z_AI_GLM4_5_AIR_CONFIG,
  minimaxM25: MINIMAX_M2_5_CONFIG,
  qwen36PlusFree: QWEN36_PLUS_FREE_CONFIG,  // This has qwen_bridge: 'qwen/from Ehab' ✓
  zAiGlm45AirFree: Z_AI_GLM4_5_AIR_FREE_CONFIG,
  minimaxM25Free: MINIMAX_M2_5_FREE_CONFIG,
  haiku35: CLAUDE_3_5_HAIKU_CONFIG,
  haiku45: CLAUDE_HAIKU_4_5_CONFIG,
  sonnet35: CLAUDE_3_5_V2_SONNET_CONFIG,
  sonnet37: CLAUDE_3_7_SONNET_CONFIG,
  sonnet40: CLAUDE_SONNET_4_CONFIG,
  sonnet45: CLAUDE_SONNET_4_5_CONFIG,
  sonnet46: CLAUDE_SONNET_4_6_CONFIG,
  opus40: CLAUDE_OPUS_4_CONFIG,
  opus41: CLAUDE_OPUS_4_1_CONFIG,
  opus45: CLAUDE_OPUS_4_5_CONFIG,
  opus46: CLAUDE_OPUS_4_6_CONFIG,
} as const satisfies Record<string, ModelConfig>
export type ModelKey = keyof typeof ALL_MODEL_CONFIGS

/** Union of all canonical first-party model IDs, e.g. 'claude-opus-4-6' | 'claude-sonnet-4-5-20250929' | … */
export type CanonicalModelId =
  (typeof ALL_MODEL_CONFIGS)[ModelKey]['firstParty']

/** Runtime list of canonical model IDs — used by comprehensiveness tests. */
export const CANONICAL_MODEL_IDS = Object.values(ALL_MODEL_CONFIGS).map(
  c => c.firstParty,
) as [CanonicalModelId, ...CanonicalModelId[]]

/** Map canonical ID → internal short key. Used to apply settings-based modelOverrides. */
export const CANONICAL_ID_TO_KEY: Record<CanonicalModelId, ModelKey> =
  Object.fromEntries(
    (Object.entries(ALL_MODEL_CONFIGS) as [ModelKey, ModelConfig][]).map(
      ([key, cfg]) => [cfg.firstParty, key],
    ),
  ) as Record<CanonicalModelId, ModelKey>
