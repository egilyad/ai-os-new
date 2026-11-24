/**
 * HTTP tenant scoping helpers. Pure functions shared with unit tests:
 * a `companyId:secret` bearer binds a request to exactly one company, while
 * the legacy shared token stays a global admin credential.
 */

export function resolveCompanyFromBearer(token, lookup) {
    if (typeof token !== 'string' || token.length === 0) return null;
    const sep = token.indexOf(':');
    if (sep <= 0 || sep === token.length - 1) return null;
    const companyId = token.slice(0, sep);
    const secret = token.slice(sep + 1);
    if (companyId.includes(':') || secret.includes(':')) return null;
    const entry = lookup(companyId);
    return entry && entry.exists && entry.verify(secret) ? companyId : null;
}

export function canAccessCompany(boundCompanyId, companyId) {
    return !boundCompanyId || boundCompanyId === companyId;
}
