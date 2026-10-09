"""Automated Secret Sanitization Verification Test.

Scans the repository to ensure ZERO real API keys, bearer tokens,
or hardcoded secrets (specifically `nvapi-...`) exist in committed files.
"""

import os
import re
import subprocess
import unittest


class TestSecretSanitization(unittest.TestCase):
    """Test suite ensuring absolute zero hardcoded credentials in the repository."""

    NVAPI_PATTERN = re.compile(r"nvapi-[A-Za-z0-9_-]{12,}")

    IGNORE_DIRS = {
        ".git",
        "node_modules",
        "dist",
        ".wrangler",
        "__pycache__",
        ".pytest_cache",
    }

    IGNORE_FILES = {
        ".dev.vars",  # Local developer env file ignored by Git
        ".env",       # Local developer env file ignored by Git
    }

    # Only allow explicit documentation placeholders
    SAFE_PLACEHOLDERS = {
        "nvapi-your-nvidia-api-key-here",
        "nvapi-your-key-here",
    }

    def test_git_does_not_track_local_secret_files(self):
        """Ensure local developer files like .dev.vars and .env are never tracked by Git."""
        repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        try:
            res = subprocess.run(
                ["git", "ls-files", ".dev.vars", ".env"],
                cwd=repo_root,
                capture_output=True,
                text=True,
                check=True,
            )
            tracked_secrets = res.stdout.strip()
            self.assertEqual(
                tracked_secrets,
                "",
                f"SECURITY VIOLATION: Sensitive env files are tracked by Git: {tracked_secrets}",
            )
        except subprocess.SubprocessError:
            pass  # Git check skipped if git not in environment

    def test_no_hardcoded_nvapi_keys_in_repository(self):
        """Recursively scan repository files and verify zero leaked credentials."""
        repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        leaks = []

        for root, dirs, files in os.walk(repo_root):
            # Prune ignored directories in-place
            dirs[:] = [d for d in dirs if d not in self.IGNORE_DIRS]

            for fname in files:
                if fname in self.IGNORE_FILES:
                    continue

                # Skip binary files
                if fname.endswith((".png", ".jpg", ".jpeg", ".ico", ".wasm", ".zip", ".tar", ".gz")):
                    continue

                file_path = os.path.join(root, fname)
                rel_path = os.path.relpath(file_path, repo_root)

                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
                        for line_num, line in enumerate(fp, start=1):
                            matches = self.NVAPI_PATTERN.findall(line)
                            for match in matches:
                                if match not in self.SAFE_PLACEHOLDERS:
                                    leaks.append(f"{rel_path}:{line_num} -> {match[:10]}...")
                except Exception as exc:
                    self.fail(f"Could not read {rel_path}: {exc}")

        self.assertEqual(
            leaks,
            [],
            f"SECURITY VIOLATION: Hardcoded NVIDIA API keys detected in repository:\n"
            + "\n".join(leaks),
        )


if __name__ == "__main__":
    unittest.main()
