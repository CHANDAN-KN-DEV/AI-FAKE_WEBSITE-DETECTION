/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and session management
 *   - name: Claims
 *     description: Submit and retrieve claims for verification
 *   - name: AI
 *     description: AI analysis endpoints (Gemini, Grok, OpenRouter, Jina)
 *   - name: Community
 *     description: Community voting and validation
 *   - name: Experts
 *     description: Expert application and management
 *   - name: Admin
 *     description: Admin-only moderation endpoints
 *   - name: Consensus
 *     description: Consensus engine results
 *   - name: Corrections
 *     description: Trusted correction summaries
 *   - name: Dashboard
 *     description: Dashboard and analytics data
 *   - name: Featured
 *     description: Featured fake-news tracker
 *   - name: i18n
 *     description: Translation and transcription
 */

// ─── AUTH ──────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already registered
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive a JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (JWT is stateless – invalidation via sessions table in future)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 */

// ─── CLAIMS ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/claims/submit:
 *   post:
 *     tags: [Claims]
 *     summary: Submit a new claim for verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contentType]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Vaccine causes 5G activation"
 *               contentType:
 *                 type: string
 *                 enum: [text, url, whatsapp, image, video, voice]
 *                 example: text
 *               text:
 *                 type: string
 *                 example: "Forward this urgent message..."
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/article"
 *     responses:
 *       201:
 *         description: Claim submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 claim:
 *                   $ref: '#/components/schemas/Claim'
 */

/**
 * @swagger
 * /api/claims/history:
 *   get:
 *     tags: [Claims]
 *     summary: Get claim history for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of claims
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 claims:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Claim'
 */

/**
 * @swagger
 * /api/claims/{id}:
 *   get:
 *     tags: [Claims]
 *     summary: Get a specific claim by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Claim details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       404:
 *         description: Claim not found
 */

// ─── AI ────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/analyze-text:
 *   post:
 *     tags: [AI]
 *     summary: Directly analyze a piece of text (claim extraction, fact check)
 *     description: Runs through the provider registry (Gemini → Grok → OpenRouter) with fallback.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Scientists say drinking bleach cures COVID-19."
 *     responses:
 *       200:
 *         description: AI analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/ProviderResult'
 */

/**
 * @swagger
 * /api/ai/analyze-url:
 *   post:
 *     tags: [AI]
 *     summary: Analyze content at a given URL
 *     description: Fetches content via Jina Reader then runs AI analysis.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/viral-article"
 *     responses:
 *       200:
 *         description: AI analysis result
 */

/**
 * @swagger
 * /api/ai/analyze-media:
 *   post:
 *     tags: [AI]
 *     summary: Analyze media (image/video) - placeholder for Gemini multimodal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mediaUrl]
 *             properties:
 *               mediaUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       501:
 *         description: Not yet implemented
 */

/**
 * @swagger
 * /api/ai/extract-claims:
 *   post:
 *     tags: [AI]
 *     summary: Extract factual claims from a submitted claim record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claimId]
 *             properties:
 *               claimId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Extracted claims
 *       404:
 *         description: Claim not found
 */

/**
 * @swagger
 * /api/ai/emotional-manipulation:
 *   post:
 *     tags: [AI]
 *     summary: Detect emotional manipulation in a submitted claim
 *     description: Returns fear/anger/urgency/scarcity/outrage/authority/shareBait scores plus trigger phrases.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claimId]
 *             properties:
 *               claimId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Emotional manipulation scores
 */

/**
 * @swagger
 * /api/ai/source-score:
 *   post:
 *     tags: [AI]
 *     summary: Score the credibility of a source URL attached to a claim
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claimId]
 *             properties:
 *               claimId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Source credibility result
 *       400:
 *         description: No URL on claim
 */

/**
 * @swagger
 * /api/ai/provider-compare:
 *   post:
 *     tags: [AI]
 *     summary: Compare all AI providers for a given task in parallel
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task]
 *             properties:
 *               task:
 *                 type: string
 *                 enum: [claim-extraction, emotional-manipulation-analysis, source-credibility, final-verdict-summary]
 *               text:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Array of results from each provider
 */

// ─── COMMUNITY ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/community/vote:
 *   post:
 *     tags: [Community]
 *     summary: Submit a community vote on a claim
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claimId, verdict]
 *             properties:
 *               claimId:
 *                 type: string
 *                 format: uuid
 *               verdict:
 *                 type: string
 *                 enum: [true, false, misleading]
 *               reasoning:
 *                 type: string
 *               sourceUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Vote recorded
 */

/**
 * @swagger
 * /api/community/votes/{claimId}:
 *   get:
 *     tags: [Community]
 *     summary: Get all votes for a claim
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: claimId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Votes list
 */

// ─── EXPERTS ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/experts/apply:
 *   post:
 *     tags: [Experts]
 *     summary: Apply for expert status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, institution, profileUrl, statement]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [health, tech, policy, journalism, validator]
 *               institution:
 *                 type: string
 *               profileUrl:
 *                 type: string
 *                 format: uri
 *               statement:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted
 */

/**
 * @swagger
 * /api/experts/me:
 *   get:
 *     tags: [Experts]
 *     summary: Get current user's expert application status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expert application details
 */

// ─── ADMIN ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/expert-applications:
 *   get:
 *     tags: [Admin]
 *     summary: List all pending expert applications (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expert applications list
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/admin/experts/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve an expert application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expert approved
 */

/**
 * @swagger
 * /api/admin/experts/{id}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Reject an expert application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expert rejected
 */

/**
 * @swagger
 * /api/admin/experts/{id}/suspend:
 *   post:
 *     tags: [Admin]
 *     summary: Suspend an expert
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expert suspended
 */

/**
 * @swagger
 * /api/admin/featured/refresh:
 *   post:
 *     tags: [Admin]
 *     summary: Trigger a manual refresh of the featured fake-news tracker
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refresh triggered
 */

// ─── CONSENSUS ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/consensus/{claimId}:
 *   get:
 *     tags: [Consensus]
 *     summary: Get current consensus result for a claim
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: claimId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Consensus result
 */

/**
 * @swagger
 * /api/consensus/recalculate/{claimId}:
 *   post:
 *     tags: [Consensus]
 *     summary: "Recalculate consensus — weighted formula: 0.45 AI + 0.40 Community + 0.15 Source"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: claimId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Updated consensus
 */

// ─── CORRECTIONS ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/corrections/{claimId}:
 *   get:
 *     tags: [Corrections]
 *     summary: Get correction summary for a claim
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: claimId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Correction data
 */

/**
 * @swagger
 * /api/corrections/generate:
 *   post:
 *     tags: [Corrections]
 *     summary: Generate a trusted correction for a claim
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claimId]
 *             properties:
 *               claimId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Generated correction
 */

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/dashboard/top-picks:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get the top featured fake-news picks right now
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top picks
 */

/**
 * @swagger
 * /api/dashboard/trending:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get trending misinformation today
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trending items
 */

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Category-wise misinformation stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category stats
 */

/**
 * @swagger
 * /api/dashboard/regions:
 *   get:
 *     tags: [Dashboard]
 *     summary: Region-wise misinformation view
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Region stats
 */

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     tags: [Dashboard]
 *     summary: Alerts for user if they engaged with fake claims
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts
 */

// ─── FEATURED ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/featured/history:
 *   get:
 *     tags: [Featured]
 *     summary: History of featured fake-news items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Featured history
 */

/**
 * @swagger
 * /api/featured/{id}:
 *   get:
 *     tags: [Featured]
 *     summary: Get a specific featured item by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Featured item detail
 */

// ─── i18n ──────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/i18n/translate:
 *   post:
 *     tags: [i18n]
 *     summary: Translate text to English, Hindi, or Kannada
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, targetLang]
 *             properties:
 *               text:
 *                 type: string
 *               targetLang:
 *                 type: string
 *                 enum: [en, hi, kn]
 *     responses:
 *       200:
 *         description: Translation result
 */

/**
 * @swagger
 * /api/i18n/transcribe:
 *   post:
 *     tags: [i18n]
 *     summary: Transcribe audio to text (voice input support)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audioUrl]
 *             properties:
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *               targetLang:
 *                 type: string
 *                 enum: [en, hi, kn]
 *     responses:
 *       200:
 *         description: Transcript result
 */

export {};
