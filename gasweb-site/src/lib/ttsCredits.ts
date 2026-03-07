import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const CREDIT_PACKAGES = [
  { id: 'starter', label: 'Starter', characters: 50_000, priceCents: 299, priceLabel: '$2.99' },
  { id: 'standard', label: 'Standard', characters: 200_000, priceCents: 999, priceLabel: '$9.99' },
  { id: 'premium', label: 'Premium', characters: 500_000, priceCents: 1999, priceLabel: '$19.99' },
] as const;

export interface CreditBalance {
  credits_remaining: number;
  credits_purchased: number;
  credits_used: number;
}

export async function getCreditsBalance(userId: string): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from('tts_credit_balances')
    .select('credits_remaining, credits_purchased, credits_used')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as CreditBalance;
}

export function estimateCharacters(text: string): number {
  return text.length;
}

export async function purchaseCredits(
  packageId: string,
  userId: string,
  email: string,
): Promise<string | null> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return null;

  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purchaseType: 'tts_credits',
      creditAmount: pkg.characters,
      price: pkg.priceCents,
      email,
      userId,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.url ?? null;
}

export async function playHDAudio(
  text: string,
  courseId: string,
  lessonId: string,
): Promise<{ blob: Blob } | { error: string; credits_remaining?: number; characters_needed?: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };

  const res = await fetch(`${SUPABASE_URL}/functions/v1/education-tts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, course_id: courseId, lesson_id: lessonId }),
  });

  if (res.status === 402) {
    const data = await res.json();
    return { error: 'insufficient_credits', credits_remaining: data.credits_remaining, characters_needed: data.characters_needed };
  }

  if (!res.ok) {
    return { error: 'TTS generation failed' };
  }

  const blob = await res.blob();
  return { blob };
}
