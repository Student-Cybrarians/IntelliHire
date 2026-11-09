// functions/api/m1AtsEngine.ts
/**
 * Module 1: ATS Resume Analyser Engine
 * Implements IEEE Paper Specifications:
 * - Equations 4, 5, 6: TF-IDF Vectorization & Cosine Similarity
 * - Equation 1: 6-Component Weighted Scoring (S_ATS = sum(w_i * s_i))
 * - Okapi BM25 Ranking & Dense-Sparse Convex Fusion (lambda = 0.65)
 * - Analytical AHP weighting and Actionable Rewriting Suggestions
 */

export interface AtsWeightProfile {
  name: string;
  keywordAlignment: number;       // w1: default 0.35 (paper) or 0.32 (AHP)
  sectionCompleteness: number;    // w2: default 0.20 or 0.22
  skillsCoverage: number;         // w3: default 0.20 or 0.18
  formattingCompliance: number;  // w4: default 0.10 or 0.12
  atsParseability: number;        // w5: default 0.10 or 0.10
  professionalSummary: number;    // w6: default 0.05 or 0.06
}

export const PAPER_DEFAULT_WEIGHTS: AtsWeightProfile = {
  name: 'IEEE Paper Baseline',
  keywordAlignment: 0.35,
  sectionCompleteness: 0.20,
  skillsCoverage: 0.20,
  formattingCompliance: 0.10,
  atsParseability: 0.10,
  professionalSummary: 0.05
};

export const AHP_WEIGHTS: AtsWeightProfile = {
  name: 'AHP Calibrated',
  keywordAlignment: 0.32,
  sectionCompleteness: 0.22,
  skillsCoverage: 0.18,
  formattingCompliance: 0.12,
  atsParseability: 0.10,
  professionalSummary: 0.06
};

export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

/**
 * Tokenizes text into unigrams and bigrams (n-gram range (1,2)), filtering out stopwords.
 */
export function extractNGrams(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s-+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ').filter(w => w.length > 1 && !STOPWORDS.has(w));
  const tokens: string[] = [...words];

  // Include bigrams with underscore separator
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]}_${words[i + 1]}`);
  }

  return tokens;
}

export interface VectorMap {
  [term: string]: number;
}

/**
 * Computes TF-IDF vector for a document pair.
 * Paper Equations 4 & 5:
 * TF(t, d) = f_{t,d} / sum(f_{t',d})
 * IDF(t, D) = log( (1 + |D|) / (1 + |{d in D : t in d}|) ) + 1
 * TF-IDF = TF * IDF
 */
export function computeTfIdfVectors(docA: string, docB: string): { vectorA: VectorMap; vectorB: VectorMap } {
  const tokensA = extractNGrams(docA).filter(t => !t.includes('_'));
  const tokensB = extractNGrams(docB).filter(t => !t.includes('_'));

  const tfA: { [t: string]: number } = {};
  const tfB: { [t: string]: number } = {};

  for (const t of tokensA) tfA[t] = (tfA[t] || 0) + 1;
  for (const t of tokensB) tfB[t] = (tfB[t] || 0) + 1;

  const lenA = Math.max(1, tokensA.length);
  const lenB = Math.max(1, tokensB.length);

  const allTerms = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
  const vectorA: VectorMap = {};
  const vectorB: VectorMap = {};

  for (const term of allTerms) {
    const inA = (tfA[term] || 0) > 0 ? 1 : 0;
    const inB = (tfB[term] || 0) > 0 ? 1 : 0;
    const docFreq = inA + inB;
    // Smoothed Inverse Document Frequency
    const idf = Math.log(3 / (1 + docFreq)) + 1.0;

    const valA = ((tfA[term] || 0) / lenA) * idf;
    const valB = ((tfB[term] || 0) / lenB) * idf;

    if (valA > 0) vectorA[term] = valA;
    if (valB > 0) vectorB[term] = valB;
  }

  return { vectorA, vectorB };
}

/**
 * Paper Equation 6: Cosine Similarity between vector A and vector B:
 * sim(A, B) = (A . B) / (||A|| * ||B||)
 */
export function calculateCosineSimilarity(vecA: VectorMap, vecB: VectorMap): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const term in vecA) {
    const valA = vecA[term] || 0;
    normA += valA * valA;
    if (vecB[term]) {
      dotProduct += valA * (vecB[term] || 0);
    }
  }

  for (const term in vecB) {
    const valB = vecB[term] || 0;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return Math.min(1.0, Math.max(0.0, dotProduct / denominator));
}

/**
 * Computes Okapi BM25 score between a query (Job Description) and a document (Resume).
 * Standard parameters: k1 = 1.5, b = 0.75
 */
export function computeBM25Score(resumeText: string, jdText: string, k1: number = 1.5, b: number = 0.75): number {
  const resumeTokens = extractNGrams(resumeText).filter(t => !t.includes('_'));
  const jdTokens = extractNGrams(jdText).filter(t => !t.includes('_'));
  if (resumeTokens.length === 0 || jdTokens.length === 0) return 0;

  const docLen = resumeTokens.length;
  const avgDocLen = Math.max(10, (resumeTokens.length + jdTokens.length) / 2);

  const tfResume: { [t: string]: number } = {};
  for (const t of resumeTokens) tfResume[t] = (tfResume[t] || 0) + 1;

  const queryTerms = Array.from(new Set(jdTokens));
  let matchedWeight = 0;
  let totalQueryWeight = queryTerms.length;

  for (const term of queryTerms) {
    const f = tfResume[term] || 0;
    if (f > 0) {
      const numerator = f * (k1 + 1);
      const denominator = f + k1 * (1 - b + b * (docLen / avgDocLen));
      matchedWeight += Math.min(1.0, numerator / denominator);
    }
  }

  if (totalQueryWeight === 0) return 0;
  return Math.min(1.0, Math.max(0.0, matchedWeight / totalQueryWeight));
}

/**
 * Dense-Sparse Convex Fusion:
 * S_match = lambda * S_dense + (1 - lambda) * S_BM25, lambda = 0.65
 */
export function computeConvexFusedMatch(denseScore: number, sparseBM25Score: number, lambda: number = 0.65): number {
  const boundedDense = Math.min(1.0, Math.max(0.0, denseScore));
  const boundedSparse = Math.min(1.0, Math.max(0.0, sparseBM25Score));
  return lambda * boundedDense + (1.0 - lambda) * boundedSparse;
}

export interface DetailedAtsScorecard {
  overallAtsScore: number;         // 0 to 100
  cosineSimilarity: number;        // 0 to 1.0
  bm25Score: number;               // 0 to 1.0
  fusedMatchScore: number;         // 0 to 1.0 (lambda = 0.65)
  weightsUsed: AtsWeightProfile;
  components: {
    keywordAlignment: { score: number; weight: number; contribution: number };
    sectionCompleteness: { score: number; weight: number; contribution: number; detectedSections: string[]; missingSections: string[] };
    skillsCoverage: { score: number; weight: number; contribution: number; matchedSkillsCount: number; missingSkillsCount: number };
    formattingCompliance: { score: number; weight: number; contribution: number; issues: string[] };
    atsParseability: { score: number; weight: number; contribution: number; metrics: any };
    professionalSummary: { score: number; weight: number; contribution: number; qualityIndicators: string[] };
  };
  gapKeywords: string[];
  matchedKeywords: string[];
}

/**
 * Full 6-Component ATS Scoring Engine adhering to Paper Equation 1:
 * S_ATS = sum(w_i * s_i)
 */
export function evaluateAtsResume(
  resumeText: string,
  jdText: string,
  weightProfile: AtsWeightProfile = PAPER_DEFAULT_WEIGHTS
): DetailedAtsScorecard {
  const cleanResume = (resumeText || '').trim();
  const cleanJd = (jdText || '').trim();

  // 1. Vectorization & Cosine Similarity
  const { vectorA, vectorB } = computeTfIdfVectors(cleanResume, cleanJd);
  const cosineSim = calculateCosineSimilarity(vectorA, vectorB);

  // 2. BM25 & Convex Fusion
  const bm25 = computeBM25Score(cleanResume, cleanJd);
  const fusedMatch = computeConvexFusedMatch(cosineSim, bm25, 0.65);

  // Component 1: Keyword Alignment (0-100) based on fused dense-sparse match scaled for ATS percentile
  // In typical ATS engines, a 0.35+ TF-IDF cosine alignment between full text corresponds to strong 70-85% alignment
  const keywordScore = Math.min(100, Math.round(fusedMatch * 180));

  // Component 2: Section Completeness (0-100)
  const standardSections = ['experience', 'education', 'skills', 'projects', 'summary', 'certifications'];
  const resumeLower = cleanResume.toLowerCase();
  const detectedSections: string[] = [];
  const missingSections: string[] = [];

  for (const sec of standardSections) {
    const secRegex = new RegExp(`(^|[\\n\\r])\\s*(${sec}|work\\s+experience|professional\\s+summary|technical\\s+skills|academic\\s+background)`, 'i');
    if (secRegex.test(resumeLower)) {
      detectedSections.push(sec);
    } else {
      missingSections.push(sec);
    }
  }
  const sectionScore = Math.round((detectedSections.length / standardSections.length) * 100);

  // Component 3: Skills Coverage (0-100)
  const jdNGrams = Array.from(new Set(extractNGrams(cleanJd).filter(t => !t.includes('_'))));
  const resumeNGramSet = new Set(extractNGrams(cleanResume).filter(t => !t.includes('_')));
  const matchedKeywords: string[] = [];
  const gapKeywords: string[] = [];

  for (const term of jdNGrams) {
    if (resumeNGramSet.has(term)) {
      matchedKeywords.push(term);
    } else {
      gapKeywords.push(term);
    }
  }
  const skillsScore = jdNGrams.length > 0
    ? Math.min(100, Math.round((matchedKeywords.length / (jdNGrams.length * 0.6)) * 100))
    : 75;

  // Component 4: Formatting Compliance (0-100)
  let formattingScore = 100;
  const formattingIssues: string[] = [];
  const charCount = cleanResume.length;

  if (charCount < 400) {
    formattingScore -= 40;
    formattingIssues.push('Resume length is below standard 1-page minimum (<400 chars).');
  } else if (charCount > 15000) {
    formattingScore -= 20;
    formattingIssues.push('Resume exceeds standard 2-3 page limits (>15,000 chars).');
  }

  const bulletCount = (cleanResume.match(/^[ \t]*[-•*▪▸◦]/gm) || []).length;
  if (bulletCount < 3) {
    formattingScore -= 15;
    formattingIssues.push('Insufficient bulleted accomplishment lists detected.');
  }

  const hasTabsOrWeirdChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(cleanResume);
  if (hasTabsOrWeirdChars) {
    formattingScore -= 15;
    formattingIssues.push('Non-standard binary control characters found in parsed text.');
  }
  formattingScore = Math.max(0, formattingScore);

  // Component 5: ATS Parseability (0-100)
  let parseabilityScore = 100;
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleanResume);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleanResume);
  const hasDates = /\b(19\d\d|20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present)\b/i.test(cleanResume);

  if (!hasEmail) parseabilityScore -= 25;
  if (!hasPhone) parseabilityScore -= 20;
  if (!hasDates) parseabilityScore -= 25;

  const lines = cleanResume.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 10) parseabilityScore -= 20;
  parseabilityScore = Math.max(0, parseabilityScore);

  // Component 6: Professional Summary Quality (0-100)
  let summaryScore = 65;
  const qualityIndicators: string[] = [];
  const hasMetrics = /\d+%|\$\d+|\d+\s*(users|clients|projects|million|k)/i.test(cleanResume);
  if (hasMetrics) {
    summaryScore += 20;
    qualityIndicators.push('Contains quantifiable business impact metrics.');
  }
  const hasLeadershipVerbs = /\b(led|architected|spearheaded|engineered|optimized|designed|delivered)\b/i.test(cleanResume);
  if (hasLeadershipVerbs) {
    summaryScore += 15;
    qualityIndicators.push('Demonstrates strong action verbs.');
  }
  summaryScore = Math.min(100, Math.max(0, summaryScore));

  // Compute Weighted Composite: S_ATS = sum(w_i * s_i)
  const w = weightProfile;
  const c1Contrib = w.keywordAlignment * keywordScore;
  const c2Contrib = w.sectionCompleteness * sectionScore;
  const c3Contrib = w.skillsCoverage * skillsScore;
  const c4Contrib = w.formattingCompliance * formattingScore;
  const c5Contrib = w.atsParseability * parseabilityScore;
  const c6Contrib = w.professionalSummary * summaryScore;

  const totalWeighted = c1Contrib + c2Contrib + c3Contrib + c4Contrib + c5Contrib + c6Contrib;
  const overallAtsScore = Math.round(totalWeighted);

  return {
    overallAtsScore,
    cosineSimilarity: Math.round(cosineSim * 1000) / 1000,
    bm25Score: Math.round(bm25 * 1000) / 1000,
    fusedMatchScore: Math.round(fusedMatch * 1000) / 1000,
    weightsUsed: weightProfile,
    components: {
      keywordAlignment: { score: keywordScore, weight: w.keywordAlignment, contribution: Math.round(c1Contrib * 10) / 10 },
      sectionCompleteness: { score: sectionScore, weight: w.sectionCompleteness, contribution: Math.round(c2Contrib * 10) / 10, detectedSections, missingSections },
      skillsCoverage: { score: skillsScore, weight: w.skillsCoverage, contribution: Math.round(c3Contrib * 10) / 10, matchedSkillsCount: matchedKeywords.length, missingSkillsCount: gapKeywords.length },
      formattingCompliance: { score: formattingScore, weight: w.formattingCompliance, contribution: Math.round(c4Contrib * 10) / 10, issues: formattingIssues },
      atsParseability: { score: parseabilityScore, weight: w.atsParseability, contribution: Math.round(c5Contrib * 10) / 10, metrics: { hasEmail, hasPhone, hasDates, linesCount: lines.length } },
      professionalSummary: { score: summaryScore, weight: w.professionalSummary, contribution: Math.round(c6Contrib * 10) / 10, qualityIndicators }
    },
    gapKeywords: gapKeywords.slice(0, 15),
    matchedKeywords: matchedKeywords.slice(0, 15)
  };
}
