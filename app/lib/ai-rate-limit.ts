import type { SupabaseClient } from '@supabase/supabase-js'

export type AiRateLimitAction = 'chat' | 'flashcards' | 'quiz' | 'import_material'

export async function consumeAiRateLimit(supabase: SupabaseClient, action: AiRateLimitAction) {
  const { data, error } = await supabase.rpc('consume_ai_rate_limit', { p_action: action })

  if (error) {
    throw error
  }

  return data === true
}
