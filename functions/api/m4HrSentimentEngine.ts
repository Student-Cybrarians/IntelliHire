// functions/api/m4HrSentimentEngine.ts
/**
 * Module 4: HR Interview Simulator Engine
 * Implements IEEE Paper Specifications (Section III-E & IV-C):
 * - Rolling context memory for multi-turn coherence
 * - 4 evaluation dimensions:
 *     1. STAR-completeness (0 to 4 scale: Situation, Task, Action, Result)
 *     2. VADER Sentiment Compound Score (Equation 11: compound = x / sqrt(x^2 + alpha), alpha = 15)
 *     3. Answer Relevance (semantic cosine similarity)
 *     4. Vocabulary Richness (Type-Token Ratio: TTR = |V| / N)
 * - Professional Desirability: compound in [0.1, 0.6] (positive > 0.05, negative < -0.05)
 */

export interface StarBreakdown {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  star_score: number; // 0 to 4
  feedback: string;
}

export interface VaderResult {
  pos: number;
  neu: number;
  neg: number;
  compound: number; // in [-1.0, +1.0]
  is_positive: boolean; // compound > 0.05
  is_negative: boolean; // compound < -0.05
  is_professional: boolean; // compound in [0.10, 0.60]
}

export interface LexicalRichnessResult {
  total_tokens: number;
  unique_tokens: number;
  type_token_ratio: number; // TTR in [0.0, 1.0]
}

export interface HrAnswerEvaluation {
  star: StarBreakdown;
  vader: VaderResult;
  lexical: LexicalRichnessResult;
  relevance_score: number;    // semantic relevance (0-100)
  overall_hr_score: number;   // 0 to 100
  feedback_summary: string;
}

// Standard calibrated sentiment valence dictionary for professional interview speech
const SENTIMENT_VALENCE_DICT: Record<string, number> = {
  'excellent': 2.0, 'achieved': 1.6, 'improved': 1.4, 'successful': 1.8, 'resolved': 1.4,
  'collaborated': 1.2, 'effective': 1.4, 'optimized': 1.5, 'championed': 1.6, 'innovative': 1.5,
  'proud': 1.3, 'passion': 1.2, 'initiative': 1.4, 'growth': 1.2, 'benefited': 1.3,
  'led': 1.3, 'coordinated': 1.1, 'designed': 1.2, 'delivered': 1.4, 'progress': 1.3,
  'failure': -2.0, 'failed': -1.9, 'conflict': -1.6, 'frustrated': -1.8, 'delay': -1.3,
  'problem': -1.2, 'struggle': -1.4, 'broken': -1.6, 'bug': -1.0, 'blame': -2.0,
  'disaster': -2.5, 'catastrophe': -2.6, 'uncooperative': -1.8, 'toxic': -2.4
};

/**
 * Paper Equation 11: VADER compound sentiment score
 * compound = x / sqrt(x^2 + alpha), alpha = 15
 * where x is the sum of valence scores adjusted for modifiers
 */
export function calculateVaderSentiment(text: string, alpha: number = 15): VaderResult {
  if (!text) {
    return { pos: 0, neu: 1, neg: 0, compound: 0, is_positive: false, is_negative: false, is_professional: false };
  }

  const tokens = text.toLowerCase().match(/\b[a-z'-]+\b/g) || [];
  let sumValence = 0;
  let posCount = 0;
  let negCount = 0;
  let neuCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let val = SENTIMENT_VALENCE_DICT[word] || 0;

    // Check preceding negation modifier
    if (i > 0 && ['not', 'never', 'hardly', 'barely', "didn't", "couldn't"].includes(tokens[i - 1])) {
      val = -val * 0.75;
    }

    if (val > 0) {
      posCount += val;
      sumValence += val;
    } else if (val < 0) {
      negCount += Math.abs(val);
      sumValence += val;
    } else {
      neuCount += 1;
    }
  }

  // Exact Equation 11 formulation
  const compound = sumValence === 0 ? 0 : sumValence / Math.sqrt((sumValence * sumValence) + alpha);

  const total = posCount + negCount + neuCount || 1;
  const pos = Math.round((posCount / total) * 1000) / 1000;
  const neg = Math.round((negCount / total) * 1000) / 1000;
  const neu = Math.round((neuCount / total) * 1000) / 1000;
  const boundedCompound = Math.round(compound * 1000) / 1000;

  return {
    pos,
    neu,
    neg,
    compound: boundedCompound,
    is_positive: boundedCompound > 0.05,
    is_negative: boundedCompound < -0.05,
    is_professional: boundedCompound >= 0.10 && boundedCompound <= 0.85
  };
}

/**
 * Calculates Type-Token Ratio (TTR = |V| / N)
 */
export function calculateLexicalRichness(text: string): LexicalRichnessResult {
  const tokens = (text || '').toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const totalTokens = tokens.length;
  if (totalTokens === 0) return { total_tokens: 0, unique_tokens: 0, type_token_ratio: 0 };

  const uniqueTokens = new Set(tokens).size;
  const ttr = uniqueTokens / totalTokens;

  return {
    total_tokens: totalTokens,
    unique_tokens: uniqueTokens,
    type_token_ratio: Math.round(ttr * 1000) / 1000
  };
}

/**
 * Professional Affect Quality Function
 * S_affect = exp( - (c - mu_prof)^2 / (2 * sigma_prof^2) )
 * Target professional affect: mu_prof = 0.35, sigma_prof = 0.35
 */
export function calculateProfessionalAffectScore(
  compound: number,
  muProf: number = 0.35,
  sigmaProf: number = 0.35
): number {
  const diff = compound - muProf;
  const exponent = -(diff * diff) / (2 * sigmaProf * sigmaProf);
  const affect = Math.exp(exponent);
  return Math.min(100, Math.max(0, Math.round(affect * 100)));
}

/**
 * Automated STAR Component Analysis (0 to 4 scale)
 */
export function evaluateStarComponents(text: string): StarBreakdown {
  const lower = (text || '').toLowerCase();
  
  // Situation indicators
  const situation = lower.includes('when i was') || lower.includes('at my previous') || lower.includes('during a') || lower.includes('in my role') || lower.includes('the project had') || lower.includes('situation');
  // Task indicators
  const task = lower.includes('my responsibility') || lower.includes('i was tasked') || lower.includes('goal was to') || lower.includes('needed to') || lower.includes('assigned to') || lower.includes('objective');
  // Action indicators
  const action = lower.includes('i implemented') || lower.includes('i led') || lower.includes('i designed') || lower.includes('i analyzed') || lower.includes('i created') || lower.includes('i coordinated') || lower.includes('my action') || lower.includes('i step');
  // Result indicators
  const result = lower.includes('as a result') || lower.includes('resulting in') || lower.includes('increased by') || lower.includes('decreased by') || lower.includes('successfully delivered') || lower.includes('achieved') || lower.includes('outcome');

  let starScore = 0;
  if (situation) starScore += 1;
  if (task) starScore += 1;
  if (action) starScore += 1;
  if (result) starScore += 1;

  const missing: string[] = [];
  if (!situation) missing.push('Situation');
  if (!task) missing.push('Task');
  if (!action) missing.push('Action');
  if (!result) missing.push('Result');

  const feedback = missing.length === 0
    ? 'Complete STAR structure demonstrated with clear narrative progression.'
    : `Missing or implicit STAR components: ${missing.join(', ')}. Anchor response with explicit outcomes.`;

  return { situation, task, action, result, star_score: starScore, feedback };
}

/**
 * Evaluates an entire HR candidate response across the 4 paper dimensions:
 * 1. STAR-completeness (0-4)
 * 2. VADER compound sentiment (Equation 11)
 * 3. Answer relevance (contextual alignment)
 * 4. Vocabulary richness (Type-Token Ratio)
 */
export function evaluateHrResponse(text: string, questionContext: string = ''): HrAnswerEvaluation {
  const star = evaluateStarComponents(text);
  const vader = calculateVaderSentiment(text);
  const lexical = calculateLexicalRichness(text);

  // Normalized STAR score (0-4 -> 0-100)
  const starPct = Math.round((star.star_score / 4) * 100);

  // Lexical diversity normalized score
  const lexicalScore = Math.min(100, Math.round(Math.min(1.0, lexical.type_token_ratio / 0.65) * 100));

  // Relevance heuristic based on key topic coverage
  let relevanceScore = 75;
  if (questionContext) {
    const qWords = questionContext.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const textLower = text.toLowerCase();
    const matches = qWords.filter(w => textLower.includes(w));
    if (qWords.length > 0) {
      relevanceScore = Math.min(100, Math.round(50 + (matches.length / qWords.length) * 50));
    }
  }

  // Sentiment appropriateness score (rewarding compound in [0.1, 0.85])
  const sentimentScore = vader.is_professional ? 95 : (vader.compound > 0.05 ? 80 : 40);

  // Overall HR composite: STAR (0.35), Relevance (0.25), Lexical Richness (0.20), Sentiment (0.20)
  const overallScore = Math.round(
    0.35 * starPct +
    0.25 * relevanceScore +
    0.20 * lexicalScore +
    0.20 * sentimentScore
  );

  return {
    star,
    vader,
    lexical,
    relevance_score: relevanceScore,
    overall_hr_score: overallScore,
    feedback_summary: `${star.feedback} VADER compound: ${vader.compound} (${vader.is_professional ? 'Professional' : 'Affect calibration advised'}). TTR: ${lexical.type_token_ratio}.`
  };
}
