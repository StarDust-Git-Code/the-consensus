export const DEFAULT_MODELS = {
  text: 'gemma-4-31b-it',
  image: 'gemini-3.1-flash-image-preview',
  music: 'lyria-3-clip-preview',
  video: 'veo-3.1-lite-generate-preview'
} as const;

export const AVAILABLE_MODELS = {
  text: [
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite'
  ],
  image: [
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
    'gemini-2.5-flash-image'
  ],
  music: [
    'lyria-3-clip-preview',
    'lyria-3-pro-preview'
  ],
  video: [
    'veo-3.1-lite-generate-preview',
    'veo-3.1-fast-generate-preview',
    'veo-3.1-generate-preview'
  ]
} as const;

export type ModelType = keyof typeof AVAILABLE_MODELS;

// ── Smart Model Routing ──────────────────────────────────────

export type TaskCategory = 'chat' | 'orchestrate' | 'execute' | 'deliver';

/**
 * Model routing config for free-tier optimization.
 * Each category has a primary model and a fallback chain.
 * Models are tried in order — if rate-limited, the next is used.
 *
 * CRITICAL: Gemma models do NOT support function calling.
 * They can only be used for chat (no tools needed).
 * Orchestrate/execute/deliver REQUIRE tools → Gemini models only.
 *
 * Free-tier RPD budget:
 * - Gemma 4 31B/26B: 1500 RPD each (chat only, no tools)
 * - Flash Lite: 500 RPD (supports tools)
 * - Flash/2.5 Flash: 20 RPD each (supports tools)
 * - Live API: unlimited RPD (primary chat channel)
 */
export const MODEL_ROUTING: Record<TaskCategory, string[]> = {
  // Chat: Live API first (unlimited), then Gemma fallback (no tools needed)
  chat: ['gemma-4-31b-it', 'gemma-4-26b-a4b-it', 'gemini-3.1-flash-lite-preview'],

  // Orchestration (spark, propose_task): NEEDS tools → Gemini only
  orchestrate: ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'],

  // Task execution (complete_task): NEEDS tools → Gemini only
  execute: ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'],

  // Delivery (deliver_project): NEEDS tools → Gemini only
  deliver: ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'],
};

/**
 * Actual free-tier RPD limits per model.
 * Source: AI Studio rate limits page (2026-05-15).
 * Users can override these in the Quota Dashboard.
 */
export const DEFAULT_RPD_LIMITS: Record<string, number> = {
  'gemma-4-31b-it': 1500,
  'gemma-4-26b-a4b-it': 1500,
  'gemini-3.1-flash-lite-preview': 500,
  'gemini-2.5-flash': 20,
  'gemini-3-flash-preview': 20,
  'gemini-2.5-flash-lite': 20,
  'gemini-3.1-pro-preview': 0,
  // Multimodal (all 0 RPD on free tier)
  'gemini-3.1-flash-image-preview': 0,
  'gemini-3-pro-image-preview': 0,
  'gemini-2.5-flash-image': 0,
  'lyria-3-clip-preview': 0,
  'lyria-3-pro-preview': 0,
  'veo-3.1-lite-generate-preview': 0,
  'veo-3.1-fast-generate-preview': 0,
  'veo-3.1-generate-preview': 0,
};

/** Live API models — unlimited RPD/RPM on free tier */
export const LIVE_MODELS = {
  primary: 'gemini-2.5-flash-native-audio-latest',
  fallback: 'gemini-3.1-flash-live-preview',
} as const;
