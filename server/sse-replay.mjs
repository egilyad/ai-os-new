export function selectReplayEvents(buffer, lastEventId, companyId, mayReceive) {
    if (!lastEventId) return { events: [], missing: false };
    const index = buffer.findIndex((event) => event.id === lastEventId);
    if (index < 0) return { events: [], missing: true };
    return {
        events: buffer.slice(index + 1).filter((event) => mayReceive(companyId, event.payload)),
        missing: false,
    };
}
