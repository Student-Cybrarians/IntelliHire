"""
Safe Python Execution Sandbox for M03 Scientific & Data Analysis Tasks.
Enforces strict AST security scanning, package allowlisting, thread isolation,
resource timeouts, and output capture.
"""

import ast
import io
import time
import threading
from typing import Dict, Any, List, Tuple, Optional

ALLOWED_MODULES = {
    "math", "statistics", "json", "collections", "itertools",
    "re", "datetime", "random", "heapq", "bisect", "decimal", "fractions"
}

PROHIBITED_CALLS = {
    "eval", "exec", "open", "compile", "globals", "locals",
    "__import__", "getattr", "setattr", "delattr", "breakpoint"
}

PROHIBITED_ATTRIBUTES = {
    "__subclasses__", "__bases__", "__mro__", "__globals__",
    "__code__", "__dict__", "__class__"
}

SAFE_BUILTINS = {
    "abs": abs,
    "all": all,
    "any": any,
    "bin": bin,
    "bool": bool,
    "dict": dict,
    "divmod": divmod,
    "enumerate": enumerate,
    "filter": filter,
    "float": float,
    "format": format,
    "frozenset": frozenset,
    "hex": hex,
    "int": int,
    "isinstance": isinstance,
    "issubclass": issubclass,
    "iter": iter,
    "len": len,
    "list": list,
    "map": map,
    "max": max,
    "min": min,
    "next": next,
    "oct": oct,
    "ord": ord,
    "pow": pow,
    "print": print,
    "range": range,
    "reversed": reversed,
    "round": round,
    "set": set,
    "slice": slice,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
    "True": True,
    "False": False,
    "None": None
}


class SecurityNodeVisitor(ast.NodeVisitor):
    def __init__(self):
        self.violations: List[str] = []

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_module = alias.name.split(".")[0]
            if base_module not in ALLOWED_MODULES:
                self.violations.append(f"Prohibited import: '{alias.name}' not in allowlist")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            base_module = node.module.split(".")[0]
            if base_module not in ALLOWED_MODULES:
                self.violations.append(f"Prohibited import: '{node.module}' not in allowlist")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            if node.func.id in PROHIBITED_CALLS:
                self.violations.append(f"Prohibited function call: '{node.func.id}()'")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        if node.attr in PROHIBITED_ATTRIBUTES:
            self.violations.append(f"Prohibited attribute access: '{node.attr}'")
        self.generic_visit(node)


class SafePythonSandbox:
    """Safe runner for candidate scientific and data transformation Python tasks."""

    @classmethod
    def validate_ast(cls, code: str) -> Tuple[bool, List[str]]:
        """Parses and inspects code AST for security compliance."""
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, [f"SyntaxError on line {e.lineno}: {e.msg}"]

        visitor = SecurityNodeVisitor()
        visitor.visit(tree)
        return len(visitor.violations) == 0, visitor.violations

    @classmethod
    def execute_isolated(
        cls,
        code: str,
        input_data: Optional[Dict[str, Any]] = None,
        timeout_seconds: float = 3.0
    ) -> Dict[str, Any]:
        """
        Executes code inside a restricted thread sandbox with timeout,
        isolated builtins, and stdout capture.
        """
        start_time = time.time()

        # 1. Static AST Validation
        safe, violations = cls.validate_ast(code)
        if not safe:
            return {
                "success": False,
                "status": "security_violation",
                "output": f"Security Sandbox Rejection: {'; '.join(violations)}",
                "duration_ms": int((time.time() - start_time) * 1000),
                "violations": violations,
                "exported_variables": {}
            }

        # 2. Setup Sandbox Environment
        output_buffer = io.StringIO()

        def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
            base_module = name.split(".")[0]
            if base_module not in ALLOWED_MODULES:
                raise ImportError(f"Module '{name}' is not in the sandbox allowlist")
            return __import__(name, globals, locals, fromlist, level)

        safe_globals = {
            "__builtins__": {
                **SAFE_BUILTINS,
                "__import__": safe_import,
                "print": lambda *args, **kwargs: print(*args, file=output_buffer, **kwargs)
            }
        }

        # Add allowed modules to scope
        for mod_name in ALLOWED_MODULES:
            try:
                mod = __import__(mod_name)
                safe_globals[mod_name] = mod
            except Exception:
                pass

        safe_locals = dict(input_data or {})

        execution_result: Dict[str, Any] = {
            "completed": False,
            "error": None,
            "traceback": None
        }

        def target_worker():
            try:
                compiled = compile(code, "<sandbox>", "exec")
                exec(compiled, safe_globals, safe_locals)
                execution_result["completed"] = True
            except Exception as ex:
                execution_result["error"] = f"{type(ex).__name__}: {str(ex)}"

        worker_thread = threading.Thread(target=target_worker)
        worker_thread.daemon = True
        worker_thread.start()
        worker_thread.join(timeout=timeout_seconds)

        duration_ms = int((time.time() - start_time) * 1000)

        # 3. Timeout Check
        if worker_thread.is_alive():
            return {
                "success": False,
                "status": "timeout_exceeded",
                "output": f"Execution Timed Out: CPU/Runtime limit exceeded ({int(timeout_seconds * 1000)}ms).",
                "duration_ms": duration_ms,
                "violations": ["Execution exceeded allowable timeout quota"],
                "exported_variables": {}
            }

        stdout_content = output_buffer.getvalue()

        # 4. Runtime Error Check
        if execution_result.get("error"):
            return {
                "success": False,
                "status": "runtime_error",
                "output": f"{stdout_content}\nRuntime Error: {execution_result['error']}".strip(),
                "duration_ms": duration_ms,
                "violations": [],
                "error": execution_result["error"],
                "exported_variables": {}
            }

        # Filter safe serializable exports
        exported = {}
        for k, v in safe_locals.items():
            if not k.startswith("_") and isinstance(v, (int, float, str, bool, list, dict)):
                exported[k] = v

        return {
            "success": True,
            "status": "passed",
            "output": stdout_content.strip() or "[Execution completed with no output]",
            "duration_ms": duration_ms,
            "violations": [],
            "exported_variables": exported
        }
