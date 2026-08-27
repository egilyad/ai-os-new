/**
 * Cognitive-aux / research panel (Experimental).
 * Aquarium trading game showcase — research-grade, not production surface (P1.21).
 */
import React, { useState } from 'react';
import { Fish, Send, X, Check, Ban } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { aquariumTradingService } from '../kernel/instances';

const AquariumTradingPanelContent: React.FC = () => {
    const [trades, setTrades] = useState(() => aquariumTradingService.getActiveTrades());
    const [history, setHistory] = useState(() => aquariumTradingService.getTradeHistory());
    const [creatures] = useState(() => aquariumTradingService.getCreatureList());
    const [showOffer, setShowOffer] = useState(false);
    const [offeredId, setOfferedId] = useState('');
    const [requestedId, setRequestedId] = useState('');
    const [note, setNote] = useState('');

    const refresh = () => {
        setTrades(aquariumTradingService.getActiveTrades());
        setHistory(aquariumTradingService.getTradeHistory());
    };

    const handleCreateOffer = () => {
        if (!offeredId || !requestedId) return;
        aquariumTradingService.createOffer(offeredId, requestedId, note || undefined);
        setShowOffer(false);
        setOfferedId('');
        setRequestedId('');
        setNote('');
        refresh();
    };

    const handleAccept = (id: string) => {
        aquariumTradingService.acceptTrade(id);
        refresh();
    };
    const handleDecline = (id: string) => {
        aquariumTradingService.declineTrade(id);
        refresh();
    };
    const handleCancel = (id: string) => {
        aquariumTradingService.cancelTrade(id);
        refresh();
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px',
                            fontSize: 18,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Fish size={20} color="#06b6d4" /> Aquarium Trading
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        Trade creatures with other users
                    </p>
                </div>
                <button
                    onClick={() => setShowOffer(!showOffer)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        background: showOffer ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)',
                        color: showOffer ? '#ef4444' : '#06b6d4',
                    }}
                >
                    {showOffer ? <X size={16} /> : <Send size={16} />}
                    {showOffer ? 'Cancel' : 'New Offer'}
                </button>
            </div>

            {showOffer && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    fontSize: 12,
                                    color: 'var(--slate-400)',
                                    marginBottom: 4,
                                    display: 'block',
                                }}
                            >
                                Offering
                            </label>
                            <select
                                value={offeredId}
                                onChange={(e) => setOfferedId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'var(--slate-900)',
                                    color: 'var(--slate-200)',
                                    fontSize: 13,
                                    outline: 'none',
                                }}
                            >
                                <option value="">Select...</option>
                                {creatures.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: 12,
                                    color: 'var(--slate-400)',
                                    marginBottom: 4,
                                    display: 'block',
                                }}
                            >
                                Requesting
                            </label>
                            <select
                                value={requestedId}
                                onChange={(e) => setRequestedId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'var(--slate-900)',
                                    color: 'var(--slate-200)',
                                    fontSize: 13,
                                    outline: 'none',
                                }}
                            >
                                <option value="">Select...</option>
                                {creatures.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note..."
                        style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--slate-900)',
                            color: 'var(--slate-200)',
                            fontSize: 13,
                            outline: 'none',
                            marginBottom: 12,
                        }}
                    />
                    <button
                        onClick={handleCreateOffer}
                        disabled={!offeredId || !requestedId}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(6,182,212,0.2)',
                            color: '#06b6d4',
                            fontSize: 13,
                            fontWeight: 600,
                            opacity: offeredId && requestedId ? 1 : 0.5,
                        }}
                    >
                        <Send size={14} /> Publish Offer
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Active Trades ({trades.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {trades.map((t) => (
                            <div
                                key={t.id}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'var(--slate-900)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderLeft: `3px solid ${t.status === 'open' ? '#10b981' : '#f59e0b'}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 4,
                                    }}
                                >
                                    <span
                                        style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}
                                    >
                                        {t.offeredCreatureName}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                        → {t.requestedCreatureName}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--slate-600)', marginBottom: 2 }}>
                                    by {t.offeredBy} · {new Date(t.createdAt).toLocaleDateString()}
                                </div>
                                {t.note && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--slate-500)',
                                            fontStyle: 'italic',
                                            marginBottom: 4,
                                        }}
                                    >
                                        "{t.note}"
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                    {t.status === 'open' && (
                                        <>
                                            <button
                                                onClick={() => handleAccept(t.id)}
                                                style={{
                                                    padding: '3px 8px',
                                                    borderRadius: 4,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: 10,
                                                    background: 'rgba(16,185,129,0.15)',
                                                    color: 'var(--success)',
                                                }}
                                            >
                                                <Check size={10} /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleDecline(t.id)}
                                                style={{
                                                    padding: '3px 8px',
                                                    borderRadius: 4,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: 10,
                                                    background: 'rgba(239,68,68,0.15)',
                                                    color: 'var(--error)',
                                                }}
                                            >
                                                <Ban size={10} /> Decline
                                            </button>
                                        </>
                                    )}
                                    {t.offeredBy === 'You' && t.status === 'pending' && (
                                        <button
                                            onClick={() => handleCancel(t.id)}
                                            style={{
                                                padding: '3px 8px',
                                                borderRadius: 4,
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: 10,
                                                background: 'rgba(239,68,68,0.15)',
                                                color: 'var(--error)',
                                            }}
                                        >
                                            <X size={10} /> Cancel
                                        </button>
                                    )}
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            fontSize: 10,
                                            color: 'var(--slate-500)',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {t.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {trades.length === 0 && (
                            <div
                                style={{
                                    padding: 16,
                                    textAlign: 'center',
                                    color: 'var(--slate-600)',
                                    fontSize: 13,
                                }}
                            >
                                No active trades
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Trade History ({history.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {history
                            .filter(
                                (t) =>
                                    t.status === 'accepted' ||
                                    t.status === 'declined' ||
                                    t.status === 'cancelled',
                            )
                            .map((t) => (
                                <div
                                    key={t.id}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 6,
                                        background: 'var(--slate-900)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        fontSize: 11,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            color: 'var(--slate-400)',
                                        }}
                                    >
                                        <span>
                                            {t.offeredCreatureName} ↔ {t.requestedCreatureName}
                                        </span>
                                        <span
                                            style={{
                                                color:
                                                    t.status === 'accepted' ? '#10b981' : '#ef4444',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {t.status}
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--slate-600)' }}>
                                        {t.offeredBy} · {new Date(t.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AquariumTradingPanel: React.FC = () => (
    <PanelLoader name="Aquarium Trading">
        <AquariumTradingPanelContent />
    </PanelLoader>
);

export default AquariumTradingPanel;
