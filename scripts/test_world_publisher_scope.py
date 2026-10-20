"""Synthetic tests; no GitHub or AWS calls."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("scope", Path(__file__).with_name("verify-world-publisher-scope.py"))
scope = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scope)


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.environment = {"deployment_branch_policy": {"protected_branches": False, "custom_branch_policies": True}}
        self.policies = {"total_count": 1, "branch_policies": [{"name": "main", "type": "branch"}]}

    def test_exact_main(self):
        scope.verify(self.environment, self.policies)

    def test_absent_rules(self):
        with self.assertRaises(ValueError):
            scope.verify({"deployment_branch_policy": None}, self.policies)

    def test_rejects_protected_branches_mode(self):
        with self.assertRaises(ValueError):
            scope.verify({"deployment_branch_policy": {"protected_branches": True, "custom_branch_policies": False}}, self.policies)

    def test_rejects_tags_and_wildcards(self):
        for rule in [{"name": "main", "type": "tag"}, {"name": "*", "type": "branch"}, {"name": "main*", "type": "branch"}]:
            with self.subTest(rule=rule), self.assertRaises(ValueError):
                scope.verify(self.environment, {"total_count": 1, "branch_policies": [rule]})

    def test_rejects_extra_or_paginated_rules(self):
        for rules in [{"total_count": 2, "branch_policies": self.policies["branch_policies"]}, {"total_count": 2, "branch_policies": self.policies["branch_policies"] * 2}]:
            with self.subTest(rules=rules), self.assertRaises(ValueError):
                scope.verify(self.environment, rules)


if __name__ == "__main__":
    unittest.main()
