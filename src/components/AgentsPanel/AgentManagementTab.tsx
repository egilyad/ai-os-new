/**
 * AgentManagementTab — Skills, Tools, Responsibilities & KPIs for an agent.
 * Reads/writes through the existing agentService (which delegates to AgentManagementService).
 */
import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { agentManagementService } from '../../kernel/instances';
import type { AgentSkillRecord, AgentToolRecord, ResponsibilityRecord } from '../../kernel/types/agent-management-types';

interface Props {
    agentId: string;
    t: (key: string) => string;
}

export const AgentManagementTab: React.FC<Props> = ({ agentId }) => {
    const [skills, setSkills] = useState<AgentSkillRecord[]>([]);
    const [tools, setTools] = useState<AgentToolRecord[]>([]);
    const [responsibilities, setResponsibilities] = useState<ResponsibilityRecord[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [newTool, setNewTool] = useState('');
    const [newRespTitle, setNewRespTitle] = useState('');
    const [newRespDesc, setNewRespDesc] = useState('');
    const [newRespKpis, setNewRespKpis] = useState('');

    const reload = async () => {
        if (!agentManagementService) return;
        const svc = await agentManagementService();
        const [s, r, resp] = await Promise.all([
            svc.listSkills(agentId),
            svc.listTools(agentId),
            svc.listResponsibilities(agentId),
        ]);
        setSkills(s);
        setTools(r);
        setResponsibilities(resp);
    };

    useEffect(() => { reload(); }, [agentId]);

    const addSkill = async () => {
        if (!newSkill.trim()) return;
        const svc = await agentManagementService();
        await svc.addSkill(agentId, newSkill.trim());
        setNewSkill('');
        reload();
    };

    const removeSkill = async (skillId: string) => {
        const svc = await agentManagementService();
        await svc.removeSkill(agentId, skillId);
        reload();
    };

    const addTool = async () => {
        if (!newTool.trim()) return;
        const svc = await agentManagementService();
        await svc.addTool(agentId, newTool.trim());
        setNewTool('');
        reload();
    };

    const removeTool = async (toolId: string) => {
        const svc = await agentManagementService();
        await svc.removeTool(agentId, toolId);
        reload();
    };

    const addResponsibility = async () => {
        if (!newRespTitle.trim()) return;
        const svc = await agentManagementService();
        const kpis = newRespKpis.split(',').map(k => k.trim()).filter(Boolean);
        await svc.setResponsibility(agentId, newRespTitle.trim(), newRespDesc.trim(), kpis);
        setNewRespTitle('');
        setNewRespDesc('');
        setNewRespKpis('');
        reload();
    };

    const removeResponsibility = async (respId: string) => {
        const svc = await agentManagementService();
        await svc.removeResponsibility(agentId, respId);
        reload();
    };

    const sectionStyle: React.CSSProperties = { marginBottom: 20 };
    const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', marginBottom: 6, display: 'block' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(20,20,40,0.5)', color: 'var(--slate-200)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' };
    const btnStyle: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(30,30,50,0.5)', color: 'var(--slate-300)', fontSize: '0.75rem', cursor: 'pointer' };

    return (
        <div style={{ padding: '0.5rem' }}>
            {/* Skills */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {skills.map(s => (
                        <span key={s.id} style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {s.skillId}
                            <button onClick={() => removeSkill(s.id)} style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="skill-id" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') addSkill(); }} />
                    <button onClick={addSkill} style={btnStyle}><Plus size={12} /></button>
                </div>
            </div>

            {/* Tools */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Tools</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {tools.map(tool => (
                        <span key={tool.id} style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {tool.toolId} <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>({tool.approvalMode})</span>
                            <button onClick={() => removeTool(tool.id)} style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <input value={newTool} onChange={e => setNewTool(e.target.value)} placeholder="tool-id" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') addTool(); }} />
                    <button onClick={addTool} style={btnStyle}><Plus size={12} /></button>
                </div>
            </div>

            {/* Responsibilities */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Responsibilities & KPIs</label>
                {responsibilities.map(r => (
                    <div key={r.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(30,30,50,0.4)', marginBottom: 6, position: 'relative' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-200)' }}>{r.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: 2 }}>{r.description}</div>
                        {r.kpis.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                {r.kpis.map((kpi: string, i: number) => (
                                    <span key={i} style={{ padding: '1px 6px', borderRadius: 4, fontSize: '0.65rem', background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>{kpi}</span>
                                ))}
                            </div>
                        )}
                        <button onClick={() => removeResponsibility(r.id)} style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: 'var(--slate-600)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                    </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                    <input value={newRespTitle} onChange={e => setNewRespTitle(e.target.value)} placeholder="Title" style={inputStyle} />
                    <input value={newRespDesc} onChange={e => setNewRespDesc(e.target.value)} placeholder="Description" style={inputStyle} />
                    <input value={newRespKpis} onChange={e => setNewRespKpis(e.target.value)} placeholder="KPIs (comma separated)" style={inputStyle} />
                    <button onClick={addResponsibility} style={{ ...btnStyle, alignSelf: 'flex-start' }}>Add Responsibility</button>
                </div>
            </div>
        </div>
    );
};
