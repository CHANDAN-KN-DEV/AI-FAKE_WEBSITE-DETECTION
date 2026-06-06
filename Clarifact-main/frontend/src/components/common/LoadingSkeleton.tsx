import { cn } from '@/lib/utils';

interface Props {
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ count = 3, className }: Props) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3">
          <div className="h-4 bg-secondary rounded-lg w-3/4" />
          <div className="h-3 bg-secondary rounded-lg w-full" />
          <div className="h-3 bg-secondary rounded-lg w-5/6" />
        </div>
      ))}
    </div>
  );
}
