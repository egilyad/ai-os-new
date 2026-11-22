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

/**
 * Guard EVERY navigation before it leaves the browser: initial URL, redirects
 * and JS-initiated navigations. A post-goto check is too late — the forbidden
 * address has already been visited. Sub-resources are left alone so ordinary
 * pages keep loading.
 */
export async function guardPageNavigations(page, domains) {
  await page.route('**/*', (route) => {
    const request = route.request();
    if (!request.isNavigationRequest()) return route.continue();
    try {
      validateUrl(request.url(), domains);
      return route.continue();
    } catch (e) {
      return route.abort(`blocked by allowlist: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
}
