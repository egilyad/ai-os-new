/**
 * TaskDetailModal — AGEMS 2.4/2.5/2.6/2.7/2.8
 * Comments, Labels, Locking, Work products, Triggers
 */
import { useState, useEffect } from 'react';
import { X, Lock, Unlock, Clock, Tag, MessageSquare, Plus, Paperclip, Zap } from 'lucide-react';
import { getDexieDb } from '../../kernel/instances';
import type { AgemsTask, TaskComment, Label, TaskLabel, TaskWorkProduct, TaskTrigger } from '../../kernel/types/agems-task';
import { agemsTaskService } from '../../kernel/services/agems-task-service';
import { taskWorkProductService } from '../../kernel/services/task-work-product-service';
import { taskTriggerService } from '../../kernel/services/task-trigger-service';

interface TaskDetailModalProps {
    task: AgemsTask;
    onClose: () => void;
    onUpdate: (updated: AgemsTask) => void;
}

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [allLabels, setAllLabels] = useState<Label[]>([]);
    const [taskLabelIds, setTaskLabelIds] = useState<number[]>([]);
    const [newComment, setNewComment] = useState('');
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
    const [workProducts, setWorkProducts] = useState<TaskWorkProduct[]>([]);
    const [triggers, setTriggers] = useState<TaskTrigger[]>([]);
    const [newWpName, setNewWpName] = useState('');
    const [newTriggerAction, setNewTriggerAction] = useState('');
    const [newTriggerStatus, setNewTriggerStatus] = useState<AgemsTask['status']>('COMPLETED');

    useEffect(() => {
        const db = getDexieDb();
        void db.taskComments.where('taskId').equals(task.id).toArray().then(setComments);
        void db.labels.toArray().then(setAllLabels);
        void db.taskLabels.where('taskId').equals(task.id).toArray().then((rows) => setTaskLabelIds(rows.map((r) => (r as unknown as TaskLabel).labelId)));
        void taskWorkProductService.list(task.id).then(setWorkProducts);
        void taskTriggerService.list(task.id).then(setTriggers);
    }, [task.id]);

    const addComment = async () => {
        if (!newComment.trim()) return;
        const db = getDexieDb();
        const comment: TaskComment = {
            taskId: task.id,
            authorType: 'user',
            authorId: 'current',
            content: newComment.trim(),
            createdAt: Date.now(),
        };
        const id = await db.taskComments.add(comment as never);
        comment.id = id as number;
        setComments((prev) => [...prev, comment]);
        setNewComment('');
    };

    const addLabel = async () => {
        if (!newLabelName.trim()) return;
        const db = getDexieDb();
        const existing = await db.labels.where('name').equals(newLabelName.trim()).first();
        let labelId: number;
        if (existing) {
            labelId = existing.id!;
        } else {
            const label: Label = { name: newLabelName.trim(), color: newLabelColor };
            labelId = (await db.labels.add(label as never)) as number;
            setAllLabels((prev) => [...prev, { ...label, id: labelId }]);
        }
        const tl: TaskLabel = { taskId: task.id, labelId };
        await db.taskLabels.add(tl as never);
        setTaskLabelIds((prev) => [...prev, labelId]);
        setNewTaskLabelIds_on_task((prev) => [...prev, labelId]);
        setNewLabelName('');
    };

    const removeLabel = async (labelId: number) => {
        const db = getDexieDb();
        await db.taskLabels.where({ taskId: task.id, labelId }).delete();
        setTaskLabelIds((prev) => prev.filter((id) => id !== labelId));
        setNewTaskLabelIds_on_task((prev) => prev.filter((id) => id !== labelId));
    };

    const [, setNewTaskLabelIds_on_task] = useState<number[]>(taskLabelIds);

    const lock = async () => {
        await agemsTaskService.claimTask(task.id, 'current', 300000);
        onUpdate({ ...task, lockedBy: 'current', lockedUntil: Date.now() + 300000 });
    };

    const unlock = async () => {
        await agemsTaskService.releaseTask(task.id);
        onUpdate({ ...task, lockedBy: undefined, lockedUntil: undefined });
    };

    const isLocked = task.lockedBy && task.lockedUntil && task.lockedUntil > Date.now();
    const lockedLabels = allLabels.filter((l) => taskLabelIds.includes(l.id!));

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
            <div style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', background: 'var(--bg-card, #1a1a24)', border: '1px solid var(--border, #2a2a35)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{task.title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {/* Status + Priority + Due */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{task.status}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: task.priority === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : task.priority === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)', color: task.priority === 'CRITICAL' ? '#ef4444' : task.priority === 'HIGH' ? '#f59e0b' : '#94a3b8' }}>{task.priority}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>{task.type}</span>
                    {task.dueDate && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}><Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}</span>}
                    {task.cronSchedule && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>⏰ {task.cronSchedule.kind === 'preset' ? task.cronSchedule.preset : 'custom'}</span>}
                </div>

                {/* Lock */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    {isLocked ? (
                        <>
                            <Lock size={14} color="#f59e0b" />
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Locked by {task.lockedBy}</span>
                            <button onClick={unlock} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}><Unlock size={12} /> Unlock</button>
                        </>
                    ) : (
                        <>
                            <Unlock size={14} color="var(--slate-500)" />
                            <span style={{ color: 'var(--slate-500)' }}>Unlocked</span>
                            <button onClick={lock} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', cursor: 'pointer', fontSize: 11 }}><Lock size={12} /> Lock</button>
                        </>
                    )}
                </div>

                {/* Labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14} /> Labels</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {lockedLabels.map((l) => (
                            <span key={l.id} onClick={() => removeLabel(l.id!)} style={{ padding: '3px 8px', borderRadius: 6, background: `${l.color}20`, color: l.color, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>{l.name} <X size={10} /></span>
                        ))}
                        {lockedLabels.length === 0 && <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>No labels</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void addLabel(); }} placeholder="New label…" style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 11, color: 'inherit' }} />
                        <input type="color" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                        <button onClick={addLabel} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: newLabelName.trim() ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: 'white', cursor: newLabelName.trim() ? 'pointer' : 'not-allowed', fontSize: 11 }}><Plus size={12} /></button>
                    </div>
                </div>

                {/* Comments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={14} /> Comments ({comments.length})</div>
                    <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {comments.map((c) => (
                            <div key={c.id} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11 }}>
                                <div style={{ color: 'var(--slate-400)', marginBottom: 2 }}>{c.authorId} · {new Date(c.createdAt).toLocaleString()}</div>
                                <div style={{ color: 'var(--slate-200)' }}>{c.content}</div>
                            </div>
                        ))}
                        {comments.length === 0 && <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>No comments yet</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void addComment(); }} placeholder="Add comment…" style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12, color: 'inherit' }} />
                        <button onClick={addComment} disabled={!newComment.trim()} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: newComment.trim() ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, fontSize: 12, cursor: newComment.trim() ? 'pointer' : 'not-allowed' }}>Post</button>
                    </div>
                </div>

                {/* Work products 2.7 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={14} /> Work products ({workProducts.length})</div>
                    {workProducts.map(wp => <div key={wp.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}><span style={{ flex: 1 }}>{wp.fileName}</span><button onClick={() => { void taskWorkProductService.remove(wp.id!).then(() => setWorkProducts(p => p.filter(x => x.id !== wp.id))); }} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={12} /></button></div>)}
                    <div style={{ display: 'flex', gap: 4 }}><input value={newWpName} onChange={e => setNewWpName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { void taskWorkProductService.add(task.id, newWpName.trim()).then(wp => setWorkProducts(p => [...p, wp])); setNewWpName(''); } }} placeholder="file.pdf" style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 11, color: 'inherit' }} /><button onClick={() => { if (!newWpName.trim()) return; void taskWorkProductService.add(task.id, newWpName.trim()).then(wp => setWorkProducts(p => [...p, wp])); setNewWpName(''); }} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: newWpName.trim() ? '#10b981' : 'rgba(255,255,255,0.08)', color: 'white', fontSize: 11, cursor: newWpName.trim() ? 'pointer' : 'not-allowed' }}><Plus size={12} /></button></div>
                </div>

                {/* Triggers 2.8 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={14} /> Triggers ({triggers.length})</div>
                    {triggers.map(tg => <div key={tg.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 8px', borderRadius: 6, background: tg.enabled ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}><span>{tg.onStatus} → {tg.action}</span><span style={{ marginLeft: 'auto', fontSize: 10, color: tg.enabled ? '#22c55e' : 'var(--slate-500)' }}>{tg.enabled ? 'ON' : 'OFF'}</span><button onClick={() => { const ne = !tg.enabled; void taskTriggerService.toggle(tg.id!, ne).then(() => setTriggers(p => p.map(x => x.id === tg.id ? { ...x, enabled: ne } : x))); }} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--slate-400)', fontSize: 10, cursor: 'pointer' }}>{tg.enabled ? 'Disable' : 'Enable'}</button><button onClick={() => { void taskTriggerService.remove(tg.id!).then(() => setTriggers(p => p.filter(x => x.id !== tg.id))); }} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={12} /></button></div>)}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}><select value={newTriggerStatus} onChange={e => setNewTriggerStatus(e.target.value as AgemsTask['status'])} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 11, color: 'inherit' }}>{['PENDING','IN_PROGRESS','IN_REVIEW','COMPLETED','FAILED','BLOCKED'].map(s => <option key={s} value={s}>{s}</option>)}</select><input value={newTriggerAction} onChange={e => setNewTriggerAction(e.target.value)} placeholder="action e.g. notify" style={{ flex: 1, minWidth: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 11, color: 'inherit' }} /><button onClick={() => { if (!newTriggerAction.trim()) return; void taskTriggerService.add(task.id, newTriggerStatus, newTriggerAction.trim()).then(tg => setTriggers(p => [...p, tg])); setNewTriggerAction(''); }} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: newTriggerAction.trim() ? '#f59e0b' : 'rgba(255,255,255,0.08)', color: 'white', fontSize: 11, cursor: newTriggerAction.trim() ? 'pointer' : 'not-allowed' }}><Plus size={12} /></button></div>
                </div>

                {/* Description */}
                {task.description && (
                    <div style={{ fontSize: 12, color: 'var(--slate-400)', lineHeight: 1.5 }}>{task.description}</div>
                )}
            </div>
        </div>
    );
}
