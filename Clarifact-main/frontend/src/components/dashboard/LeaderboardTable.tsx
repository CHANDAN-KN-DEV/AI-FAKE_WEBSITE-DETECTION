import { Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';
import ValidatorBadge from '@/components/results/ValidatorBadge';

interface Props {
  entries: LeaderboardEntry[];
}

export default function LeaderboardTable({ entries }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-foreground/50">
            <th className="text-left py-3 px-4 font-medium">#</th>
            <th className="text-left py-3 px-4 font-medium">User</th>
            <th className="text-right py-3 px-4 font-medium">Score</th>
            <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Verified</th>
            <th className="text-right py-3 px-4 font-medium hidden md:table-cell">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.user.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
              <td className="py-3 px-4">
                {entry.rank <= 3 ? (
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    entry.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-foreground/50 font-medium pl-1.5">{entry.rank}</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {entry.user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{entry.user.name}</p>
                    <ValidatorBadge role={entry.user.role} />
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-primary">{entry.score.toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-foreground/60 hidden sm:table-cell">{entry.claimsVerified}</td>
              <td className="py-3 px-4 text-right text-foreground/60 hidden md:table-cell">{entry.accuracy}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
