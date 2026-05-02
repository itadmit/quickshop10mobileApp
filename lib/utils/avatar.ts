import { designTokens } from '@/components/ui/theme';

const PALETTE = designTokens.colors.avatar;

function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function avatarColor(seed: string | null | undefined): string {
  if (!seed) return PALETTE[0];
  return PALETTE[hashCode(seed) % PALETTE.length];
}

export function avatarInitial(name: string | null | undefined, fallback = '?'): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}
