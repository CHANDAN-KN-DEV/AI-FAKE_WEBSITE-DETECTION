type ProviderScore = {
  provider: string;
  score: number;
  verdict?: string;
};

function getBarColor(score: number, verdict?: string): string {
  if (verdict === 'TRUE') return 'bg-emerald-500';
  if (verdict === 'FALSE') return 'bg-red-500';
  if (verdict === 'MISLEADING') return 'bg-amber-500';
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getVerdictBadgeStyle(verdict?: string): string {
  if (verdict === 'TRUE') return 'bg-emerald-500/15 text-emerald-400';
  if (verdict === 'FALSE') return 'bg-red-500/15 text-red-400';
  if (verdict === 'MISLEADING') return 'bg-amber-500/15 text-amber-400';
  return 'bg-secondary text-foreground/50';
}

function getVerdictLabel(verdict?: string): string {
  if (verdict === 'TRUE') return '✓ Verified';
  if (verdict === 'FALSE') return '✗ False';
  if (verdict === 'MISLEADING') return '⚠ Misleading';
  if (verdict === 'UNVERIFIED') return '? Unverified';
  return '';
}

// Convert percentage score (0–100) to 0–1 display string
function toDecimalScore(score: number): string {
  return (score / 100).toFixed(2);
}

export default function AICredibilityBreakdown({ scores }: { scores: ProviderScore[] }) {
  if (!scores.length) return null;

  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold">Verdict Confidence by Analysis Node</h4>
        <p className="text-xs text-foreground/50 mt-0.5">
          Credibility score (0 – 1) per node. Closer to 1 = higher confidence.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((item, index) => {
          const barColor = getBarColor(item.score, item.verdict);
          const verdictTag = item.verdict ? getVerdictLabel(item.verdict) : '';
          const decimalScore = toDecimalScore(item.score);

          return (
            <div key={item.provider} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                {/* Left: provider name + verdict badge (no true/false %) */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wide">
                    Analysis Node {index + 1}
                  </span>
                  {verdictTag && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getVerdictBadgeStyle(item.verdict)}`}>
                      {verdictTag}
                    </span>
                  )}
                </div>

                {/* Right: 0–1 decimal score only — no "Possibly False 0%" */}
                <span className="font-bold text-foreground/80 tabular-nums">
                  {decimalScore}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                  style={{ width: `${Math.max(2, Math.min(item.score, 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-foreground/30 pt-1 border-t border-border">
        Score represents AI confidence in the verdict (0 = uncertain, 1 = very confident).
      </p>
    </div>
  );
}
