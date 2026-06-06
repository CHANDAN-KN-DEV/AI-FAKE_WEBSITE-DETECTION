import type {
  ClaimResult,
  TopPick,
  CategoryStat,
  RegionInsight,
  Alert,
  LeaderboardEntry,
  Notification,
  ReviewItem,
} from '@/types';

// ─── Mock Claim Result ───
export const mockClaimResult: ClaimResult = {
  id: 'result-001',
  claim: {
    id: 'claim-001',
    text: '5G towers are spreading COVID-19 through radio waves, and the government is covering it up.',
    inputType: 'text',
    language: 'en',
    submittedAt: '2026-05-06T14:30:00Z',
    submittedBy: 'user-1',
    status: 'completed',
  },
  verdict: 'false',
  confidence: 96,
  explanation:
    'This claim is demonstrably false. 5G radio waves are non-ionizing electromagnetic radiation and cannot carry or transmit viruses. COVID-19 is caused by the SARS-CoV-2 virus, which spreads through respiratory droplets. Multiple peer-reviewed studies and health organizations, including the WHO and CDC, have confirmed there is no link between 5G technology and the spread of COVID-19.',
  explainLikeIm10:
    "Imagine your walkie-talkie at home — it sends invisible signals through the air so you can talk. 5G works the same way, just faster. Those signals can't carry germs, just like a flashlight beam can't make you sick. COVID spreads when someone who is sick coughs near you, not from phone towers!",
  suspiciousSentences: [
    {
      text: '5G towers are spreading COVID-19 through radio waves',
      reason: 'Makes a scientifically impossible causal claim linking radio waves to virus transmission.',
      severity: 'high',
    },
    {
      text: 'the government is covering it up',
      reason: 'Uses conspiratorial framing to bypass factual scrutiny.',
      severity: 'medium',
    },
  ],
  emotionalSignals: [
    { type: 'Fear', intensity: 0.85, description: 'Invokes fear of invisible technology-based harm.' },
    { type: 'Distrust', intensity: 0.78, description: 'Undermines trust in government institutions.' },
    { type: 'Urgency', intensity: 0.62, description: 'Implies an immediate, hidden danger.' },
  ],
  manipulationTriggers: [
    'Appeal to fear of technology',
    'Government conspiracy framing',
    'False causation (5G → virus)',
    'Lack of any scientific citation',
  ],
  sourceCredibility: [
    { name: 'World Health Organization', url: 'https://who.int', trustScore: 97, stance: 'contradicts' },
    { name: 'CDC', url: 'https://cdc.gov', trustScore: 95, stance: 'contradicts' },
    { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org', trustScore: 92, stance: 'contradicts' },
    { name: 'Reuters Fact Check', url: 'https://reuters.com/fact-check', trustScore: 94, stance: 'contradicts' },
  ],
  verifiedCorrection:
    'COVID-19 is caused by the SARS-CoV-2 virus and spreads through respiratory droplets and aerosols. 5G is a telecommunications standard for broadband cellular networks using non-ionizing radio frequencies that have no mechanism to generate, carry, or transmit biological pathogens.',
  communityVotes: { verified: 12, misleading: 3, false: 284, total: 299 },
  consensus: {
    score: 94,
    totalValidators: 47,
    expertCount: 8,
    communityCount: 39,
    agreement: 96,
  },
  aiCredibilityScores: [
    { provider: 'grok', score: 96 },
    { provider: 'openrouter', score: 91 },
    { provider: 'gemini', score: 89 },
  ],
  timeline: [
    { id: 't1', date: '2025-03-15', platform: 'Facebook', description: 'First appeared in fringe groups', reach: 15000 },
    { id: 't2', date: '2025-04-02', platform: 'WhatsApp', description: 'Viral forward chain detected', reach: 250000 },
    { id: 't3', date: '2025-04-18', platform: 'Twitter/X', description: 'Amplified by influencer accounts', reach: 1200000 },
    { id: 't4', date: '2025-05-01', platform: 'YouTube', description: 'Debunked by major fact-checkers', reach: 800000 },
  ],
  auditTrail: [
    { id: 'a1', timestamp: '2026-05-06T14:30:05Z', action: 'Claim submitted', actor: 'User', details: 'Text input received' },
    { id: 'a2', timestamp: '2026-05-06T14:30:06Z', action: 'Language detected', actor: 'AI', details: 'English (99.8%)' },
    { id: 'a3', timestamp: '2026-05-06T14:30:08Z', action: 'AI analysis started', actor: 'AI Engine', details: 'Running fact-check pipeline' },
    { id: 'a4', timestamp: '2026-05-06T14:30:12Z', action: 'Sources verified', actor: 'AI Engine', details: '4 trusted sources checked' },
    { id: 'a5', timestamp: '2026-05-06T14:30:15Z', action: 'Verdict generated', actor: 'AI Engine', details: 'FALSE — 96% confidence' },
    { id: 'a6', timestamp: '2026-05-06T14:31:00Z', action: 'Community validation', actor: 'Community', details: '47 validators participated' },
  ],
};

// ─── Mock Top Picks ───
export const mockTopPicks: TopPick[] = [
  { id: 'tp1', claim: 'Drinking bleach cures COVID-19', verdict: 'false', confidence: 99, trending: true, category: 'Health' },
  { id: 'tp2', claim: 'New study links coffee to longevity', verdict: 'misleading', confidence: 72, trending: true, category: 'Health' },
  { id: 'tp3', claim: 'Government announces free laptop scheme for students', verdict: 'misleading', confidence: 68, trending: false, category: 'Politics' },
  { id: 'tp4', claim: 'NASA confirms water on Mars surface', verdict: 'verified', confidence: 94, trending: true, category: 'Science' },
  { id: 'tp5', claim: 'Electric cars produce more emissions than gas cars', verdict: 'false', confidence: 88, trending: false, category: 'Environment' },
  { id: 'tp6', claim: 'AI will replace all jobs by 2030', verdict: 'misleading', confidence: 75, trending: true, category: 'Technology' },
];

// ─── Mock Category Stats ───
export const mockCategoryStats: CategoryStat[] = [
  { category: 'Health', count: 1245, trend: 'up' },
  { category: 'Politics', count: 892, trend: 'stable' },
  { category: 'Science', count: 567, trend: 'up' },
  { category: 'Technology', count: 423, trend: 'up' },
  { category: 'Environment', count: 334, trend: 'down' },
  { category: 'Finance', count: 278, trend: 'stable' },
];

// ─── Mock Region Insights ───
export const mockRegionInsights: RegionInsight[] = [
  { region: 'North America', claimCount: 3421, topCategory: 'Politics', riskLevel: 'medium' },
  { region: 'South Asia', claimCount: 2876, topCategory: 'Health', riskLevel: 'high' },
  { region: 'Europe', claimCount: 2105, topCategory: 'Technology', riskLevel: 'low' },
  { region: 'Southeast Asia', claimCount: 1890, topCategory: 'Health', riskLevel: 'high' },
  { region: 'Africa', claimCount: 1234, topCategory: 'Politics', riskLevel: 'medium' },
];

// ─── Mock Alerts ───
export const mockAlerts: Alert[] = [
  { id: 'al1', title: 'Viral health scam detected', description: 'A new miracle cure claim is spreading rapidly on WhatsApp in South Asia.', severity: 'critical', timestamp: '2026-05-07T08:00:00Z', read: false },
  { id: 'al2', title: 'Election misinformation spike', description: 'Fake voter registration links circulating on social media.', severity: 'warning', timestamp: '2026-05-07T06:30:00Z', read: false },
  { id: 'al3', title: 'New fact-check sources added', description: '12 new verified sources added to the credibility database.', severity: 'info', timestamp: '2026-05-06T20:00:00Z', read: true },
];

// ─── Mock Leaderboard ───
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, user: { id: 'u1', name: 'Dr. Priya Sharma', avatar: undefined, role: 'expert' }, score: 9850, claimsVerified: 342, accuracy: 98.2 },
  { rank: 2, user: { id: 'u2', name: 'Alex Chen', avatar: undefined, role: 'expert' }, score: 8720, claimsVerified: 298, accuracy: 97.5 },
  { rank: 3, user: { id: 'u3', name: 'Maria Rodriguez', avatar: undefined, role: 'user' }, score: 7340, claimsVerified: 267, accuracy: 96.1 },
  { rank: 4, user: { id: 'u4', name: 'Rahul Krishnan', avatar: undefined, role: 'user' }, score: 6890, claimsVerified: 234, accuracy: 95.8 },
  { rank: 5, user: { id: 'u5', name: 'Emma Watson', avatar: undefined, role: 'expert' }, score: 6210, claimsVerified: 210, accuracy: 94.7 },
  { rank: 6, user: { id: 'u6', name: 'Takeshi Mori', avatar: undefined, role: 'user' }, score: 5870, claimsVerified: 198, accuracy: 93.9 },
  { rank: 7, user: { id: 'u7', name: 'Fatima Al-Hassan', avatar: undefined, role: 'expert' }, score: 5430, claimsVerified: 187, accuracy: 95.2 },
  { rank: 8, user: { id: 'u8', name: 'James Okafor', avatar: undefined, role: 'user' }, score: 4980, claimsVerified: 165, accuracy: 92.4 },
];

// ─── Mock Notifications ───
export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Claim verified', message: 'Your submitted claim about 5G has been verified as FALSE.', type: 'success', timestamp: '2026-05-07T09:15:00Z', read: false, link: '/result/result-001' },
  { id: 'n2', title: 'New badge earned', message: 'You earned the "Truth Seeker" badge!', type: 'info', timestamp: '2026-05-07T07:00:00Z', read: false },
  { id: 'n3', title: 'Community vote needed', message: 'A claim near your expertise needs your vote.', type: 'warning', timestamp: '2026-05-06T18:30:00Z', read: true, link: '/community' },
  { id: 'n4', title: 'Weekly digest', message: 'Your weekly misinformation report is ready.', type: 'info', timestamp: '2026-05-05T10:00:00Z', read: true },
];

// ─── Mock Review Items ───
export const mockReviewItems: ReviewItem[] = [
  {
    id: 'r1',
    claim: { id: 'c-r1', text: 'Eating ice cream causes cancer', inputType: 'text', language: 'en', submittedAt: '2026-05-06T12:00:00Z', submittedBy: 'user-5', status: 'completed' },
    result: mockClaimResult,
    flagReason: 'AI verdict seems incorrect — community disagrees',
    flaggedBy: 'user-12',
    flaggedAt: '2026-05-06T14:00:00Z',
    status: 'pending',
  },
  {
    id: 'r2',
    claim: { id: 'c-r2', text: 'New tax law reduces income tax to 5% for everyone', inputType: 'text', language: 'en', submittedAt: '2026-05-05T09:00:00Z', submittedBy: 'user-8', status: 'completed' },
    result: mockClaimResult,
    flagReason: 'Needs expert review — political sensitivity',
    flaggedBy: 'user-3',
    flaggedAt: '2026-05-05T15:00:00Z',
    status: 'pending',
  },
];
