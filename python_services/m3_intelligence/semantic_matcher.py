"""
Semantic Matching & Requirement Alignment NLP Engine
IntelliHire M03 - Phase 2
"""

import math
import re
from typing import List, Dict, Set, Tuple, Any

COMMON_STOPWORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with",
    "by", "as", "is", "are", "was", "were", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "of", "from", "that", "this", "these",
    "those", "which", "who", "whom", "whose", "it", "its", "their", "our",
    "your", "can", "could", "will", "would", "shall", "should", "may", "might",
    "must", "about", "above", "after", "again", "against", "all", "am", "any"
}


def tokenize(text: str) -> List[str]:
    """Tokenizes text into normalized lowercase alphanumeric tokens, stripping punctuation."""
    if not text:
        return []
    words = re.findall(r"\b[a-zA-Z0-9_\-\.\+#]{2,}\b", text.lower())
    return [w for w in words if w not in COMMON_STOPWORDS]


def generate_ngrams(tokens: List[str], n: int = 2) -> List[str]:
    """Generates contiguous n-grams from a token sequence."""
    if len(tokens) < n:
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def compute_tf_vector(tokens: List[str]) -> Dict[str, float]:
    """Computes normalized term frequency vector incorporating unigrams and bigrams."""
    counts: Dict[str, float] = {}
    all_terms = list(tokens) + generate_ngrams(tokens, 2)
    if not all_terms:
        return {}

    for t in all_terms:
        counts[t] = counts.get(t, 0.0) + 1.0

    max_freq = max(counts.values()) if counts else 1.0
    # Augmented frequency formula to prevent bias towards long documents
    return {term: 0.5 + 0.5 * (count / max_freq) for term, count in counts.items()}


def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Computes cosine similarity between two sparse term vectors."""
    if not vec1 or not vec2:
        return 0.0

    common_keys = set(vec1.keys()).intersection(set(vec2.keys()))
    if not common_keys:
        return 0.0

    dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
    norm1 = math.sqrt(sum(v * v for v in vec1.values()))
    norm2 = math.sqrt(sum(v * v for v in vec2.values()))

    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot_product / (norm1 * norm2)


def match_candidate_to_requirements(
    candidate_tokens_text: str,
    job_requirements: List[str]
) -> List[Dict[str, Any]]:
    """
    Evaluates semantic coverage of candidate text against each JD requirement.
    Returns structured alignment, matching terms, and coverage gaps.
    """
    cand_tokens = tokenize(candidate_tokens_text)
    cand_vec = compute_tf_vector(cand_tokens)
    cand_token_set = set(cand_tokens)

    alignments = []
    for req in job_requirements:
        req_tokens = tokenize(req)
        req_vec = compute_tf_vector(req_tokens)
        sim = cosine_similarity(cand_vec, req_vec)

        # Direct token overlap
        matched_tokens = sorted(list(cand_token_set.intersection(set(req_tokens))))
        missing_tokens = sorted(list(set(req_tokens) - cand_token_set))

        # Status categorisation
        if sim >= 0.45 or len(matched_tokens) >= max(1, len(req_tokens) // 2):
            status = "DEMONSTRATED"
        elif sim >= 0.20 or len(matched_tokens) > 0:
            status = "PARTIAL"
        else:
            status = "MISSING"

        alignments.append({
            "requirement": req,
            "similarity_score": round(sim, 3),
            "status": status,
            "matched_keywords": matched_tokens,
            "missing_keywords": missing_tokens
        })

    return alignments
