#!/usr/bin/env python3
"""Exercise the real standalone image with synthetic values; never follow redirects.

Build with NEXT_PUBLIC_APP_URL=https://fitness.qworky.tech and synthetic Supabase
settings, then run: python3 scripts/test-canonical-redirects.py LOCAL_IMAGE
No runtime public settings, real credentials, auth codes or external requests.
"""
import http.client
import json
import subprocess
import sys
import time
import uuid


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()


def request(port, path, headers):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    try:
        connection.request("GET", path, headers=headers)
        response = connection.getresponse()
        result = (response.status, response.getheader("location"))
        response.read()
        return result
    finally:
        connection.close()


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: test-canonical-redirects.py LOCAL_IMAGE")
    name = "fitness-local-redirect-" + uuid.uuid4().hex[:12]
    started = False
    rows = []
    failures = []
    try:
        docker("run", "--rm", "--detach", "--name", name,
               "--publish", "127.0.0.1::3000", "--env",
               "SUPABASE_SERVICE_ROLE_KEY=synthetic-only", sys.argv[1])
        started = True
        port = int(docker("port", name, "3000/tcp").rsplit(":", 1)[1])
        deadline = time.monotonic() + 45
        while True:
            try:
                if request(port, "/api/health", {}) == (200, None):
                    break
            except (OSError, http.client.HTTPException):
                pass
            if time.monotonic() >= deadline:
                raise RuntimeError("Standalone image did not become healthy")
            time.sleep(1)
        proxies = {
            "canonical": {"Host": "fitness.qworky.tech", "X-Forwarded-Host": "fitness.qworky.tech", "X-Forwarded-Proto": "https", "X-Forwarded-Port": "443"},
            "hostile": {"Host": "attacker.invalid", "X-Forwarded-Host": "attacker.invalid", "X-Forwarded-Proto": "http", "Forwarded": "host=attacker.invalid;proto=http"},
            "mixed": {"Host": "fitness.qworky.tech", "X-Forwarded-Host": "attacker.invalid, fitness.qworky.tech", "X-Forwarded-Proto": "https,http"},
        }
        cases = [
            ("/api/health", (200, None)),
            ("/login", (200, None)),
            ("/login?next=//attacker.invalid", (200, None)),
            ("/", (307, "https://fitness.qworky.tech/login")),
            ("/?next=https://attacker.invalid", (307, "https://fitness.qworky.tech/login")),
            ("/sessions?next=//attacker.invalid", (307, "https://fitness.qworky.tech/login")),
            ("/auth/callback", (307, "https://fitness.qworky.tech/")),
            ("/auth/callback?next=//attacker.invalid", (307, "https://fitness.qworky.tech/")),
        ]
        for label, headers in proxies.items():
            for path, expected in cases:
                actual = request(port, path, headers)
                row = {"proxy": label, "path": path, "status": actual[0], "location": actual[1]}
                rows.append(row)
                if actual != expected:
                    failures.append({**row, "expected": expected})
        assert not failures, json.dumps({"image": sys.argv[1], "failures": failures})
        print(json.dumps({"image": sys.argv[1], "checks": len(rows), "passed": True, "results": rows}, indent=2))
    finally:
        if started:
            docker("rm", "--force", name)


if __name__ == "__main__":
    main()
