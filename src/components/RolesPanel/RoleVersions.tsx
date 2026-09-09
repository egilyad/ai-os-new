import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react'
import type { RoleVersion } from '../../kernel/services/role-version-service';
import { roleVersionService } from '../../kernel/instances';

interface RoleVersionsProps {
  roleId: string;
  onRollback: (version: RoleVersion) => void;
}

export const RoleVersions: React.FC<RoleVersionsProps> = ({ roleId, onRollback }) => {
  const [versions, setVersions] = useState<RoleVersion[]>([]);

  useEffect(() => {
    setVersions(roleVersionService.getVersions(roleId));
  }, [roleId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-400)' }}>Version History</h4>
      {versions.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem' }}>No version history yet</div>
      ) : versions.map(v => (
        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(v.createdAt).toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{v.changeNote}</div>
          </div>
          <button onClick={() => onRollback(v)} style={{ padding: '0.4rem', borderRadius: 6, background: 'transparent', border: '1px solid #3b82f6', color: 'var(--accent)', cursor: 'pointer' }}>
            <RotateCcw size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
