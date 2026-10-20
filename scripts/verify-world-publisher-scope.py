#!/usr/bin/env python3
"""Read-only, fail-closed prerequisite for the proposed environment-scoped OIDC role."""
import json
import subprocess
import sys

REPOSITORY = "notreallyaperson/fitness-app"
ENVIRONMENT = "Live"


def verify(environment, policies):
    expected = {"protected_branches": False, "custom_branch_policies": True}
    if environment.get("deployment_branch_policy") != expected:
        raise ValueError("Live must use selected deployment branches, not all/protected branches.")
    rules = policies.get("branch_policies", [])
    if policies.get("total_count") != 1 or len(rules) != 1:
        raise ValueError("Live must have exactly one deployment branch rule.")
    if rules[0].get("name") != "main" or rules[0].get("type") != "branch":
        raise ValueError("Live must allow only branch main, with no tag or wildcard rules.")


def read(path):
    return json.loads(subprocess.check_output(["gh", "api", path], text=True))


def main():
    try:
        root = f"repos/{REPOSITORY}/environments/{ENVIRONMENT}"
        environment = read(root)
        # Do not treat the no-policy endpoint's 404 as authorization evidence.
        if environment.get("deployment_branch_policy") is None:
            raise ValueError("Live currently allows all branches; main-only restriction is absent.")
        verify(environment, read(root + "/deployment-branch-policies"))
    except (ValueError, subprocess.CalledProcessError) as error:
        print(f"Publisher blocked: {error}", file=sys.stderr)
        return 1
    print("Verified Live permits only refs/heads/main; no tag/wildcard deployment rules.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
