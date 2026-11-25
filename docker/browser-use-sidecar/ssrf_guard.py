"""SSRF guard for the browser-use sidecar. No third-party imports."""

from __future__ import annotations

import ipaddress
import os
import socket
from typing import Optional

BLOCKED_NETWORKS = tuple(
    ipaddress.ip_network(net)
    for net in (
        "0.0.0.0/8",
        "10.0.0.0/8",
        "100.64.0.0/10",
        "127.0.0.0/8",
        "169.254.0.0/16",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "198.18.0.0/15",
        "224.0.0.0/4",
        "fc00::/7",
        "fe80::/10",
        "::1/128",
        "::/128",
    )
)
ALLOW_LOCALHOST = os.environ.get("BROWSER_USE_ALLOW_LOCALHOST") == "1"


def blocked_ip_reason(ip) -> Optional[str]:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    if ip.is_unspecified:
        return "unspecified address blocked"
    if ip.is_loopback and not ALLOW_LOCALHOST:
        return "loopback blocked"
    if ip.is_link_local or ip.is_private or ip.is_reserved or ip.is_multicast:
        return "internal address blocked"
    if any(ip in net for net in BLOCKED_NETWORKS):
        return "internal network blocked"
    return None


def is_blocked_host(host: str) -> Optional[str]:
    """Return a block reason or None. Resolves every A/AAAA record."""
    h = host.strip().lower().strip("[]")
    if not h:
        return "empty host"
    if not ALLOW_LOCALHOST and (
        h == "localhost" or h.endswith(".localhost") or h.endswith((".local", ".internal"))
    ):
        return "local name blocked"
    try:
        return blocked_ip_reason(ipaddress.ip_address(h))
    except ValueError:
        pass
    try:
        infos = socket.getaddrinfo(h, None, proto=socket.IPPROTO_TCP)
    except (socket.gaierror, OSError) as e:
        return f"dns resolution failed: {e}"
    if not infos:
        return "dns resolution failed: no addresses"
    for info in infos:
        address = info[4][0].split("%", 1)[0]
        try:
            ip = ipaddress.ip_address(address)
        except ValueError:
            return f"unparsable dns address: {address[:60]}"
        reason = blocked_ip_reason(ip)
        if reason:
            return reason
    return None
