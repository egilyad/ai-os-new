import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCompanyFromBearer, canAccessCompany } from '../http-tenant.mjs';

const SECRETS = { org_a: 'secret-a-123456', org_b: 'secret-b-654321' };

function lookup(companyId) {
    const secret = SECRETS[companyId];
    return {
        exists: !!secret,
        verify: (candidate) => candidate === secret,
    };
}

test('company:secret bearer resolves only for known companies', () => {
    assert.equal(resolveCompanyFromBearer(`org_a:${SECRETS.org_a}`, lookup), 'org_a');
    assert.equal(resolveCompanyFromBearer(`org_b:${SECRETS.org_b}`, lookup), 'org_b');
    assert.equal(resolveCompanyFromBearer(`org_a:${SECRETS.org_b}`, lookup), null);
    assert.equal(resolveCompanyFromBearer('org_zzz:whatever', lookup), null);
    assert.equal(resolveCompanyFromBearer('legacy-shared-token', lookup), null);
    assert.equal(resolveCompanyFromBearer('org_a:', lookup), null);
    assert.equal(resolveCompanyFromBearer(':secret', lookup), null);
    assert.equal(resolveCompanyFromBearer('a:b:c', lookup), null);
});

test('bound company cannot see another company', () => {
    assert.equal(canAccessCompany('org_a', 'org_a'), true);
    assert.equal(canAccessCompany('org_a', 'org_b'), false);
    assert.equal(canAccessCompany(null, 'org_b'), true);
});
