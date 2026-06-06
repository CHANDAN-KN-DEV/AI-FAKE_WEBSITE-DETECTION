import { ShieldCheck } from 'lucide-react';

interface Props {
  role: 'user' | 'validator' | 'expert' | 'authority' | 'admin';
  size?: 'sm' | 'md';
}

export default function ValidatorBadge({ role, size = 'sm' }: Props) {
  if (role === 'user') return null;
  const isAuthority = role === 'authority';
  const isExpert = role === 'expert';
  const isValidator = role === 'validator';
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${
      isAuthority ? 'bg-violet-500/20 text-violet-400'
      : isExpert ? 'bg-violet-500/20 text-violet-400'
      : isValidator ? 'bg-emerald-500/20 text-emerald-400'
      : 'bg-blue-500/20 text-blue-400'
    }`}>
      <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {isAuthority ? 'Verified Authority' : isExpert ? 'Expert' : isValidator ? 'Validator' : 'Admin'}
    </span>
  );
}
