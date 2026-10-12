import { db, isSupabaseConfigured } from './supabase';

export const VALID_FEEDBACK_CATEGORIES = ['bug', 'suggestion', 'content', 'other'] as const;
export type FeedbackCategory = (typeof VALID_FEEDBACK_CATEGORIES)[number];

export interface FeedbackInput {
  category: string;
  message: string;
  pageContext?: string | null;
  /** Anonymous player hash, used by the backend for rate limiting. */
  fingerprint?: string | null;
}

export type FeedbackResult = { ok: true } | { ok: false; error: string };

/**
 * Validates and inserts a feedback row directly into Supabase.
 *
 * Previously this ran in the /api/feedback route; the static GitHub Pages build
 * has no server, so validation runs here and per-browser rate limiting is the
 * cooldown kept by FeedbackModal.
 */
export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const { category, message, pageContext, fingerprint } = input;

  if (!category || !message) {
    return { ok: false, error: 'Category and message are required' };
  }
  if (!(VALID_FEEDBACK_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: 'Invalid category' };
  }
  if (message.length > 1000) {
    return { ok: false, error: 'Message too long (max 1000 characters)' };
  }
  if (message.trim().length < 10) {
    return { ok: false, error: 'Message too short (min 10 characters)' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Feedback is unavailable: the backend is not configured.' };
  }

  const { error } = await db()
    .from('feedback')
    .insert({
      category,
      message: message.trim(),
      page_context: pageContext || null,
      fingerprint: fingerprint || null,
    });

  if (error) {
    console.error('Feedback insert error:', error);
    return { ok: false, error: 'Failed to submit feedback' };
  }

  return { ok: true };
}
