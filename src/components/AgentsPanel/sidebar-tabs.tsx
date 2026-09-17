import { Settings, Zap, Cpu, Activity, Shield, BookOpen, RefreshCw, User, Info, Database, GitBranch, ShieldCheck, Target, Wallet, GitFork, MessageCircle } from 'lucide-react';
import type { TabId } from './AgentsPanelContext';

export const sidebarTabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'profile' as TabId, label: 'Profile', icon: <Info size={18} /> },
    { id: 'config' as TabId, label: 'Identity & Routing', icon: <Settings size={18} /> },
    { id: 'identity' as TabId, label: 'Agent Identity', icon: <User size={18} /> },
    { id: 'capabilities' as TabId, label: 'Equipped Tools', icon: <Zap size={18} /> },
    { id: 'memory' as TabId, label: 'Memory', icon: <Database size={18} /> },
    { id: 'hierarchy' as TabId, label: 'Hierarchy', icon: <GitBranch size={18} /> },
    { id: 'approvals' as TabId, label: 'Approvals', icon: <ShieldCheck size={18} /> },
    { id: 'responsibilities' as TabId, label: 'KPIs & Duties', icon: <Target size={18} /> },
    { id: 'budget' as TabId, label: 'Budget', icon: <Wallet size={18} /> },
    { id: 'repository' as TabId, label: 'Repository', icon: <GitFork size={18} /> },
    { id: 'chat' as TabId, label: 'Chat', icon: <MessageCircle size={18} /> },
    { id: 'infra' as TabId, label: 'Compute Engine', icon: <Cpu size={18} /> },
    { id: 'observability' as TabId, label: 'Live Telemetry', icon: <Activity size={18} /> },
    { id: 'permissions' as TabId, label: 'Safety Guards', icon: <Shield size={18} /> },
    { id: 'handoffs' as TabId, label: 'Handoffs', icon: <BookOpen size={18} /> },
    { id: 'history' as TabId, label: 'History', icon: <RefreshCw size={18} /> },
];
