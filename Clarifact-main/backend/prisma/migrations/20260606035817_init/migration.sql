-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'unknown',
    "region" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "normalizedKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "contentType" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'unknown',
    "category" TEXT,
    "region" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimInput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rawText" TEXT,
    "rawUrl" TEXT,
    "rawMeta" JSONB,
    "mediaUrl" TEXT,
    "mimeType" TEXT,
    "sha256" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimInput_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "task" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "inputSummary" TEXT,
    "extractedClaims" JSONB,
    "fakeProbability" REAL,
    "confidence" REAL,
    "suspiciousSentences" JSONB,
    "sourceCredibility" REAL,
    "explanation" TEXT,
    "eli10" TEXT,
    "rawJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAnalysis_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmotionalSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "fear" REAL NOT NULL DEFAULT 0,
    "anger" REAL NOT NULL DEFAULT 0,
    "urgency" REAL NOT NULL DEFAULT 0,
    "scarcity" REAL NOT NULL DEFAULT 0,
    "outrage" REAL NOT NULL DEFAULT 0,
    "authority" REAL NOT NULL DEFAULT 0,
    "shareBait" REAL NOT NULL DEFAULT 0,
    "triggerPhrases" JSONB,
    "highlighted" JSONB,
    "riskLabel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmotionalSignal_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustedSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "publisher" TEXT,
    "type" TEXT NOT NULL DEFAULT 'other',
    "trust" REAL,
    "excerpt" TEXT,
    "retrievedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrustedSource_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerifiedUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "correction" TEXT,
    "evidenceSnapshot" JSONB,
    "generatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VerifiedUpdate_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityVote_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoteEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voteId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'link',
    "url" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoteEvidence_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "CommunityVote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidatorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "trustLevel" REAL NOT NULL DEFAULT 0.5,
    "badgesSummary" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ValidatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpertApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "institutionEmail" TEXT,
    "profileUrl" TEXT,
    "expertiseStatement" TEXT NOT NULL,
    "proofLinks" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderatedByUserId" TEXT,
    "moderationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpertApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpertApplication_moderatedByUserId_fkey" FOREIGN KEY ("moderatedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0.5,
    "reasons" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrustScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsensusResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "aiScore" REAL,
    "communityScore" REAL,
    "sourceReliability" REAL,
    "finalScore" REAL NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidencePercent" REAL NOT NULL,
    "disagreementIndex" REAL NOT NULL DEFAULT 0,
    "reasonSummary" TEXT,
    "evidenceSnapshot" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsensusResult_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeaturedClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "featuredScore" REAL NOT NULL,
    "whyFeatured" JSONB,
    "category" TEXT,
    "riskLevel" TEXT,
    "sourceTrust" REAL,
    "virality" REAL,
    "userEngagement" REAL,
    "featuredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeaturedClaim_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FactcheckSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "claimReviewUrl" TEXT,
    "trust" REAL NOT NULL DEFAULT 0.5,
    "region" TEXT,
    "categories" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClaimCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT,
    "centroidText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClaimClusterMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clusterId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "similarity" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimClusterMember_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ClaimCluster" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClaimClusterMember_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT,
    "runKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemsFetched" INTEGER NOT NULL DEFAULT 0,
    "itemsUpserted" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngestionLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "FactcheckSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "claimId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alert_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "totalClaims" INTEGER NOT NULL DEFAULT 0,
    "falseClaims" INTEGER NOT NULL DEFAULT 0,
    "misleadingClaims" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RegionStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" DATETIME NOT NULL,
    "region" TEXT NOT NULL,
    "totalClaims" INTEGER NOT NULL DEFAULT 0,
    "falseClaims" INTEGER NOT NULL DEFAULT 0,
    "misleadingClaims" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "importanceScore" REAL,
    "urgencyScore" REAL,
    "intensityScore" REAL,
    "credibilityScore" REAL,
    "ambiguityScore" REAL,
    "triageLabel" TEXT,
    "triageReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_triage',
    "sentToAuthority" BOOLEAN NOT NULL DEFAULT false,
    "authorityUserId" TEXT,
    "authorityVerdict" TEXT,
    "authorityNote" TEXT,
    "authorityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunityPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityPostComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "authorId" TEXT,
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "commentType" TEXT NOT NULL DEFAULT 'verdict',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Claim_userId_idx" ON "Claim"("userId");

-- CreateIndex
CREATE INDEX "Claim_createdAt_idx" ON "Claim"("createdAt");

-- CreateIndex
CREATE INDEX "Claim_normalizedKey_idx" ON "Claim"("normalizedKey");

-- CreateIndex
CREATE INDEX "ClaimInput_claimId_idx" ON "ClaimInput"("claimId");

-- CreateIndex
CREATE INDEX "ClaimInput_type_idx" ON "ClaimInput"("type");

-- CreateIndex
CREATE INDEX "AIAnalysis_claimId_idx" ON "AIAnalysis"("claimId");

-- CreateIndex
CREATE INDEX "AIAnalysis_provider_task_idx" ON "AIAnalysis"("provider", "task");

-- CreateIndex
CREATE INDEX "AIAnalysis_createdAt_idx" ON "AIAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "EmotionalSignal_claimId_idx" ON "EmotionalSignal"("claimId");

-- CreateIndex
CREATE INDEX "TrustedSource_claimId_idx" ON "TrustedSource"("claimId");

-- CreateIndex
CREATE INDEX "TrustedSource_url_idx" ON "TrustedSource"("url");

-- CreateIndex
CREATE INDEX "VerifiedUpdate_claimId_idx" ON "VerifiedUpdate"("claimId");

-- CreateIndex
CREATE INDEX "CommunityVote_claimId_idx" ON "CommunityVote"("claimId");

-- CreateIndex
CREATE INDEX "CommunityVote_userId_idx" ON "CommunityVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityVote_claimId_userId_key" ON "CommunityVote"("claimId", "userId");

-- CreateIndex
CREATE INDEX "VoteEvidence_voteId_idx" ON "VoteEvidence"("voteId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidatorProfile_userId_key" ON "ValidatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertApplication_userId_key" ON "ExpertApplication"("userId");

-- CreateIndex
CREATE INDEX "ExpertApplication_status_idx" ON "ExpertApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "TrustScore_userId_idx" ON "TrustScore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsensusResult_claimId_key" ON "ConsensusResult"("claimId");

-- CreateIndex
CREATE INDEX "FeaturedClaim_featuredAt_idx" ON "FeaturedClaim"("featuredAt");

-- CreateIndex
CREATE INDEX "FeaturedClaim_featuredScore_idx" ON "FeaturedClaim"("featuredScore");

-- CreateIndex
CREATE INDEX "FeaturedClaim_claimId_idx" ON "FeaturedClaim"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "FactcheckSource_url_key" ON "FactcheckSource"("url");

-- CreateIndex
CREATE INDEX "ClaimClusterMember_clusterId_idx" ON "ClaimClusterMember"("clusterId");

-- CreateIndex
CREATE INDEX "ClaimClusterMember_claimId_idx" ON "ClaimClusterMember"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimClusterMember_clusterId_claimId_key" ON "ClaimClusterMember"("clusterId", "claimId");

-- CreateIndex
CREATE INDEX "IngestionLog_createdAt_idx" ON "IngestionLog"("createdAt");

-- CreateIndex
CREATE INDEX "IngestionLog_runKey_idx" ON "IngestionLog"("runKey");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_claimId_idx" ON "Alert"("claimId");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "CategoryStat_day_idx" ON "CategoryStat"("day");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryStat_day_category_region_key" ON "CategoryStat"("day", "category", "region");

-- CreateIndex
CREATE INDEX "RegionStat_day_idx" ON "RegionStat"("day");

-- CreateIndex
CREATE UNIQUE INDEX "RegionStat_day_region_key" ON "RegionStat"("day", "region");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "CommunityPost_userId_idx" ON "CommunityPost"("userId");

-- CreateIndex
CREATE INDEX "CommunityPost_status_idx" ON "CommunityPost"("status");

-- CreateIndex
CREATE INDEX "CommunityPost_triageLabel_idx" ON "CommunityPost"("triageLabel");

-- CreateIndex
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_sentToAuthority_idx" ON "CommunityPost"("sentToAuthority");

-- CreateIndex
CREATE INDEX "CommunityPostComment_postId_idx" ON "CommunityPostComment"("postId");
