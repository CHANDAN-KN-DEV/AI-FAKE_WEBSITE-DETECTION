// ─── Auth ───
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'validator' | 'expert' | 'authority' | 'admin';
  trustScore: number;
  claimsChecked: number;
  joinedAt: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Theme ───
export type Theme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// ─── Language ───
export type Language = 'en' | 'hi' | 'kn';

export interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// ─── Claims ───
export type VerdictType = 'verified' | 'misleading' | 'false' | 'unverified';
export type InputType = 'text' | 'url' | 'whatsapp' | 'image' | 'video' | 'voice';

export interface Claim {
  id: string;
  text: string;
  inputType: InputType;
  language: string;
  submittedAt: string;
  submittedBy: string;
  status: 'pending' | 'processing' | 'completed';
}

export interface ClaimResult {
  id: string;
  claim: Claim;
  verdict: VerdictType;
  confidence: number;
  explanation: string;
  explainLikeIm10: string;
  suspiciousSentences: SuspiciousSentence[];
  emotionalSignals: EmotionalSignal[];
  manipulationTriggers: string[];
  sourceCredibility: SourceCredibility[];
  verifiedCorrection: string;
  communityVotes: CommunityVotes;
  consensus: ConsensusData;
  aiCredibilityScores: AICredibilityScore[];
  timeline: TimelineEvent[];
  auditTrail: AuditEntry[];
  authorityVerdict?: AuthorityVerdict;
  instagramMeta?: InstagramMeta;
}

// ─── Authority Verdict ───
export type AuthorityVerdictStatus = 'confirmed_fake' | 'verified_real' | 'misleading' | 'under_investigation';

export interface AuthorityVerdict {
  status: AuthorityVerdictStatus;
  reviewedBy: string;
  organization?: string;
  reviewedAt: string;
  notes?: string;
}

// ─── Instagram Meta ───
export interface InstagramMeta {
  platform: 'instagram';
  mediaType: 'reel' | 'post' | 'story';
  username?: string;
  caption?: string;
  hashtags?: string[];
  thumbnailUrl?: string;
  uploadedAt?: string;
  authenticityScore?: number;
}

export interface AICredibilityScore {
  provider: string;
  score: number;
}

export interface SuspiciousSentence {
  text: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface EmotionalSignal {
  type: string;
  intensity: number;
  description: string;
}

export interface SourceCredibility {
  name: string;
  url: string;
  trustScore: number;
  stance: 'supports' | 'contradicts' | 'neutral';
}

export interface CommunityVotes {
  verified: number;
  misleading: number;
  false: number;
  total: number;
}

export interface ConsensusData {
  score: number;
  totalValidators: number;
  expertCount: number;
  communityCount: number;
  agreement: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  platform: string;
  description: string;
  reach: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

// ─── Dashboard ───
export interface TopPick {
  id: string;
  claim: string;
  verdict: VerdictType;
  confidence: number;
  trending: boolean;
  category: string;
}

export interface CategoryStat {
  category: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RegionInsight {
  region: string;
  claimCount: number;
  topCategory: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  score: number;
  claimsVerified: number;
  accuracy: number;
}

// ─── Expert & Admin ───
export interface ExpertApplication {
  name: string;
  email: string;
  expertise: string;
  credentials: string;
  motivation: string;
  linkedIn?: string;
}

export interface ReviewItem {
  id: string;
  claim: Claim;
  result: ClaimResult;
  flagReason: string;
  flaggedBy: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ─── Notification ───
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}
