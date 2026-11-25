import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import ssrf_guard


class SsrfGuardTests(unittest.TestCase):
    def test_blocks_internal_literals(self):
        for host in (
            "127.0.0.1",
            "10.0.0.5",
            "192.168.1.1",
            "169.254.169.254",
            "100.64.0.1",
            "[::1]",
            "0.0.0.0",
        ):
            with self.subTest(host=host):
                self.assertIsNotNone(ssrf_guard.is_blocked_host(host))

    def test_allows_public_literals(self):
        self.assertIsNone(ssrf_guard.is_blocked_host("93.184.216.34"))
        self.assertIsNone(ssrf_guard.is_blocked_host("2606:4700:4700::1111"))

    def test_blocks_local_names(self):
        self.assertIsNotNone(ssrf_guard.is_blocked_host("localhost"))
        self.assertIsNotNone(ssrf_guard.is_blocked_host("gateway.internal"))

    def test_resolves_all_dns_records(self):
        original = ssrf_guard.socket.getaddrinfo

        def fake(host, *args, **kwargs):
            return [
                (2, 1, 6, "", ("93.184.216.34", 443)),
                (2, 1, 6, "", ("10.0.0.7", 443)),
            ]

        ssrf_guard.socket.getaddrinfo = fake
        try:
            self.assertIsNotNone(ssrf_guard.is_blocked_host("example.com"))
        finally:
            ssrf_guard.socket.getaddrinfo = original


if __name__ == "__main__":
    unittest.main()
