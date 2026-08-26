#!/usr/bin/env python3
"""
Verification script for Spaceship Station backend.
Checks syntax of all Python files without executing.
"""

import ast
import sys
from pathlib import Path

def check_python_file(filepath):
    """Check if a Python file has valid syntax."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
        ast.parse(code)
        print(f"✓ {filepath.relative_to(Path.cwd())} - OK")
        return True
    except SyntaxError as e:
        print(f"✗ {filepath.relative_to(Path.cwd())} - SYNTAX ERROR")
        print(f"  Line {e.lineno}: {e.msg}")
        return False
    except Exception as e:
        print(f"✗ {filepath.relative_to(Path.cwd())} - ERROR: {e}")
        return False

def main():
    """Check all Python files in backend."""
    backend_path = Path("backend")
    if not backend_path.exists():
        print("Error: backend directory not found")
        sys.exit(1)
    
    print("Checking Python files...\n")
    
    python_files = list(backend_path.rglob("*.py"))
    if not python_files:
        print("No Python files found")
        sys.exit(1)
    
    results = []
    for py_file in sorted(python_files):
        results.append(check_python_file(py_file))
    
    print(f"\n{'='*50}")
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} files OK")
    
    if passed == total:
        print("✓ All syntax checks passed!")
        sys.exit(0)
    else:
        print(f"✗ {total - passed} file(s) have errors")
        sys.exit(1)

if __name__ == "__main__":
    main()
