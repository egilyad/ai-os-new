/** URL/navigation safety helpers shared by the browser sidecar and its tests. */

/** Reject non-http(s) URLs and hosts outside the allowlist (SSRF guard). */
export function validateUrl(rawUrl, allowedDomains) {
  let u;
  try {
    u = new URL(String(rawUrl || ''));
  } catch {
    throw new Error('url must be valid http(s)');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('url must be http(s)');
  }
  const list = Array.isArray(allowedDomains) ? allowedDomains : [];
  if (list.length === 0) return u;
  const host = u.hostname.toLowerCase();
  const ok = list.some((d) => {
    const dd = String(d).toLowerCase().replace(/^\./, '');
    return host === dd || host.endsWith(`.${dd}`);
  });
  if (!ok) throw new Error(`url host ${u.hostname} not in allowlist`);
  return u;
}

/** A request may only NARROW the server-side allowlist, never widen it. */
export function effectiveAllowedDomains(requestDomains, defaultAllowedDomains = []) {
  const server = (defaultAllowedDomains || []).map((d) => String(d).toLowerCase().replace(/^\./, ''));
  if (!Array.isArray(requestDomains) || requestDomains.length === 0) return server;
  const requested = requestDomains.map((d) => String(d).toLowerCase().replace(/^\./, ''));
  if (server.length === 0) return requested;
  return requested.filter((d) => server.some((s) => d === s || d.endsWith(`.${s}`)));
}

/** Block loopback, private, link-local and cloud-metadata targets (SSRF). */
export function isForbiddenNetworkTarget(rawUrl) {
  let u;
  try {
    u = new URL(String(rawUrl || ''));
  } catch {
    return true;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return true;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === 'metadata.google.internal' || host === 'metadata.goog') return true;

  // IPv4: private, loopback, link-local (169.254/16 — cloud metadata),
  // carrier NAT (100.64/10) and reserved ranges.
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a === 0
    ) {
      return true;
    }
  }
  // IPv6 loopback / unique-local / link-local.
  if (host === '::1' || /^f[cd]/i.test(host) || /^fe[89ab]/i.test(host)) return true;
  return false;
}

/**
 * Guard EVERY request before it leaves the browser: navigation (initial URL,
 * redirects, JS-initiated) is also checked against the allowlist; all requests
 * — INCLUDING sub-resources — are checked against private/metadata networks.
 * A post-goto-only check is too late: the forbidden address was already visited.
 */
export async function guardPageNavigations(page, domains) {
  await page.route('**/*', (route) => {
    const request = route.request();
    const url = request.url();
    try {
      if (isForbiddenNetworkTarget(url)) {
        return route.abort('blocked by browser sidecar: private/metadata network target');
      }
      if (request.isNavigationRequest()) validateUrl(url, domains);
      return route.continue();
    } catch (e) {
      return route.abort(`blocked by allowlist: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
}
