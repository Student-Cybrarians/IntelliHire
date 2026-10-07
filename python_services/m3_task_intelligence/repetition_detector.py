"""
Repetition and Duplicate Detection Engine for M03 Universal Task Intelligence.
Prevents candidates from receiving repetitive or near-duplicate tasks
across multiple adaptive simulation rounds.
"""

import re
import math
from typing import Dict, Any, List, Tuple, Set

class RepetitionDetector:
    """Detects exact and semantic duplicates using tokenization, n-grams, and TF-IDF cosine similarity."""

    STOPWORDS = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
        "by", "about", "against", "between", "into", "through", "during", "before",
        "after", "above", "below", "from", "up", "down", "is", "are", "was", "were",
        "be", "been", "being", "have", "has", "had", "do", "does", "did", "you", "your"
    }

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        if not text:
            return []
        tokens = re.findall(r'\b[a-zA-Z0-9_]{2,}\b', text.lower())
        return [t for t in tokens if t not in cls.STOPWORDS]

    @classmethod
    def get_ngrams(cls, tokens: List[str], n: int = 2) -> Set[str]:
        if len(tokens) < n:
            return set(tokens)
        return {" ".join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)}

    @classmethod
    def compute_fingerprint(cls, task: Dict[str, Any]) -> str:
        """Computes a compact hash fingerprint for a task definition."""
        scenario = task.get("scenario", {})
        comp = task.get("competencyTarget", {})
        skill = comp.get("skillName") or task.get("skill_name") or ""
        title = task.get("title") or comp.get("name") or ""
        obj = scenario.get("objective") or ""

        norm = f"{title.lower().strip()}|{obj.lower().strip()}|{skill.lower().strip()}"
        h = 0
        for char in norm:
            h = ((h << 5) - h) + ord(char)
            h &= 0xFFFFFFFF
        return f"fp-{hex(h)[2:]}"

    @classmethod
    def jaccard_similarity(cls, tokens1: List[str], tokens2: List[str]) -> float:
        set1 = set(tokens1)
        set2 = set(tokens2)
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return intersection / union if union > 0 else 0.0

    @classmethod
    def cosine_similarity(cls, tokens1: List[str], tokens2: List[str]) -> float:
        """Calculates term-frequency cosine similarity between token streams."""
        tf1: Dict[str, int] = {}
        tf2: Dict[str, int] = {}
        for t in tokens1:
            tf1[t] = tf1.get(t, 0) + 1
        for t in tokens2:
            tf2[t] = tf2.get(t, 0) + 1

        all_keys = set(tf1.keys()).union(set(tf2.keys()))
        if not all_keys:
            return 0.0

        dot_product = sum(tf1.get(k, 0) * tf2.get(k, 0) for k in all_keys)
        norm1 = math.sqrt(sum(v ** 2 for v in tf1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in tf2.values()))

        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)

    @classmethod
    def extract_task_text(cls, task: Dict[str, Any]) -> str:
        scenario = task.get("scenario", {})
        parts = [
            task.get("title", ""),
            task.get("skill_name", ""),
            scenario.get("background", ""),
            scenario.get("objective", ""),
            " ".join(scenario.get("initialRequirements", []) or scenario.get("initial_requirements", []) or [])
        ]
        return " ".join(parts)

    @classmethod
    def is_duplicate(
        cls,
        candidate_task: Dict[str, Any],
        previous_tasks: List[Dict[str, Any]],
        threshold: float = 0.65
    ) -> Tuple[bool, float, str]:
        """
        Evaluates whether candidate_task is too similar to any previously completed task.
        Returns: (is_duplicate: bool, max_similarity: float, reason: str)
        """
        if not previous_tasks:
            return False, 0.0, "No prior task history."

        cand_fp = cls.compute_fingerprint(candidate_task)
        cand_text = cls.extract_task_text(candidate_task)
        cand_tokens = cls.tokenize(cand_text)

        max_sim = 0.0
        most_similar_id = ""

        for prev in previous_tasks:
            prev_fp = prev.get("repetitionFingerprint") or cls.compute_fingerprint(prev)
            if cand_fp == prev_fp:
                return True, 1.0, f"Exact match with prior task ID '{prev.get('id', 'unknown')}'."

            prev_text = cls.extract_task_text(prev)
            prev_tokens = cls.tokenize(prev_text)

            jacc = cls.jaccard_similarity(cand_tokens, prev_tokens)
            cos = cls.cosine_similarity(cand_tokens, prev_tokens)
            composite_sim = (0.4 * jacc) + (0.6 * cos)

            if composite_sim > max_sim:
                max_sim = composite_sim
                most_similar_id = prev.get("id", "unknown")

        if max_sim >= threshold:
            return True, round(max_sim, 3), f"Semantic similarity ({round(max_sim, 2)}) exceeds threshold ({threshold}) with task '{most_similar_id}'."

        return False, round(max_sim, 3), "Task offers fresh challenge context."
