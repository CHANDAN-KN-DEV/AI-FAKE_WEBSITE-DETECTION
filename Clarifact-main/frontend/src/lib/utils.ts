import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'verified': return 'text-verified';
    case 'misleading': return 'text-misleading';
    case 'false': return 'text-false';
    default: return 'text-foreground/60';
  }
}

export function getVerdictBg(verdict: string): string {
  switch (verdict) {
    case 'verified': return 'bg-verified/10 border-verified/30';
    case 'misleading': return 'bg-misleading/10 border-misleading/30';
    case 'false': return 'bg-false/10 border-false/30';
    default: return 'bg-secondary border-border';
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}
