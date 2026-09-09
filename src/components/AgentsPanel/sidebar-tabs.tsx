import { Settings, Zap, Cpu, Activity, Shield, BookOpen, RefreshCw, User } from 'lucide-react';
import type { TabId } from './AgentsPanelContext';

export const sidebarTabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'config' as TabId, label: 'Identity & Routing', icon: <Settings size={18} /> },
    { id: 'identity' as TabId, label: 'Agent Identity', icon: <User size={18} /> },
    { id: 'capabilities' as TabId, label: 'Equipped Tools', icon: <Zap size={18} /> },
    { id: 'infra' as TabId, label: 'Compute Engine', icon: <Cpu size={18} /> },
    { id: 'observability' as TabId, label: 'Live Telemetry', icon: <Activity size={18} /> },
    { id: 'permissions' as TabId, label: 'Safety Guards', icon: <Shield size={18} /> },
    { id: 'handoffs' as TabId, label: 'Handoffs', icon: <BookOpen size={18} /> },
    { id: 'history' as TabId, label: 'History', icon: <RefreshCw size={18} /> },
];
