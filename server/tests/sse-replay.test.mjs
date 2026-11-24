import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectReplayEvents } from '../sse-replay.mjs';

const buffer = [
    { id: '1', message: 'a', payload: { type: 'a' } },
    { id: '2', message: 'b', payload: { type: 'b', companyId: 'org_a' } },
    { id: '3', message: 'c', payload: { type: 'c' } },
];

function mayReceive(companyId, payload) {
    const eventCompany = payload.companyId ?? null;
    return !eventCompany || companyId === eventCompany;
}

test('replays only events after the last id', () => {
    const { events, missing } = selectReplayEvents(buffer, '1', null, mayReceive);
    assert.equal(missing, false);
    assert.deepEqual(
        events.map((e) => e.id),
        ['3'],
    );
});

test('filters events by company during replay', () => {
    const { events } = selectReplayEvents(buffer, '1', 'org_a', mayReceive);
    assert.deepEqual(
        events.map((e) => e.id),
        ['2', '3'],
    );
});

test('flags a missing last id for resync', () => {
    const result = selectReplayEvents(buffer, 'old', null, mayReceive);
    assert.equal(result.missing, true);
    assert.deepEqual(result.events, []);
});
