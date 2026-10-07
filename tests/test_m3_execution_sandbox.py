"""
Unit test suite for SafePythonSandbox (M03 Execution Sandbox Engine).
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from python_services.m3_task_intelligence.execution_sandbox import SafePythonSandbox


class TestSafePythonSandbox(unittest.TestCase):

    def test_01_valid_data_analysis_execution(self):
        code = """
import statistics

data = [10.5, 20.2, 35.8, 42.1, 55.4]
avg = round(statistics.mean(data), 2)
print(f"Computed average: {avg}")
result_flag = avg > 30.0
"""
        res = SafePythonSandbox.execute_isolated(code)
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "passed")
        self.assertIn("Computed average: 32.8", res["output"])
        self.assertTrue(res["exported_variables"]["result_flag"])
        self.assertEqual(res["exported_variables"]["avg"], 32.8)

    def test_02_allowed_math_and_collections(self):
        code = """
import math
from collections import Counter

items = ["alpha", "beta", "alpha", "gamma", "alpha"]
counts = dict(Counter(items))
sqrt_val = math.sqrt(144)
print(f"Root: {sqrt_val}")
"""
        res = SafePythonSandbox.execute_isolated(code)
        self.assertTrue(res["success"])
        self.assertEqual(res["exported_variables"]["sqrt_val"], 12.0)
        self.assertEqual(res["exported_variables"]["counts"]["alpha"], 3)

    def test_03_blocks_os_and_subprocess_imports(self):
        code = "import os; os.system('echo test')"
        safe, violations = SafePythonSandbox.validate_ast(code)
        self.assertFalse(safe)
        self.assertTrue(any("os" in v for v in violations))

        res = SafePythonSandbox.execute_isolated(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "security_violation")

    def test_04_blocks_socket_and_network_calls(self):
        code = "import socket; s = socket.socket()"
        safe, violations = SafePythonSandbox.validate_ast(code)
        self.assertFalse(safe)
        self.assertTrue(any("socket" in v for v in violations))

    def test_05_blocks_eval_exec_and_open(self):
        code1 = "eval('2 + 2')"
        safe1, _ = SafePythonSandbox.validate_ast(code1)
        self.assertFalse(safe1)

        code2 = "open('/etc/passwd', 'r')"
        safe2, _ = SafePythonSandbox.validate_ast(code2)
        self.assertFalse(safe2)

    def test_06_blocks_dunder_attribute_traversal(self):
        code = "().__class__.__bases__[0].__subclasses__()"
        safe, violations = SafePythonSandbox.validate_ast(code)
        self.assertFalse(safe)
        self.assertTrue(any("__class__" in v or "__subclasses__" in v for v in violations))

    def test_07_timeout_enforcement_on_infinite_loops(self):
        code = """
count = 0
while True:
    count += 1
"""
        res = SafePythonSandbox.execute_isolated(code, timeout_seconds=0.4)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "timeout_exceeded")
        self.assertIn("limit exceeded", res["output"])

    def test_08_runtime_exception_handling(self):
        code = """
x = 100 / 0
"""
        res = SafePythonSandbox.execute_isolated(code)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "runtime_error")
        self.assertIn("ZeroDivisionError", res["error"])

    def test_09_syntax_error_reporting(self):
        code = "def malformed(x return"
        safe, violations = SafePythonSandbox.validate_ast(code)
        self.assertFalse(safe)
        self.assertIn("SyntaxError", violations[0])

    def test_10_input_data_injection(self):
        code = """
total = sum(transactions)
print(f"Total processed: {total}")
"""
        input_data = {"transactions": [100, 250, 400, 50]}
        res = SafePythonSandbox.execute_isolated(code, input_data=input_data)
        self.assertTrue(res["success"])
        self.assertIn("Total processed: 800", res["output"])
        self.assertEqual(res["exported_variables"]["total"], 800)


if __name__ == "__main__":
    unittest.main()
