import { MessageSquare, Send, FileText, Database, Mail, Box, Layers, Globe } from 'lucide-react';
import { getStatusColor } from '../Common/status-vocabulary';
import type { Connector } from '../../types/domain';

export const DEFAULT_CONNECTORS: Connector[] = [
    {
        id: 'slack',
        name: 'Slack API',
        type: 'Enterprise Chat',
        description: 'Bi-directional agent communication in channels.',
        color: '#4A154B',
        status: 'disconnected',
    },
    {
        id: 'discord',
        name: 'Discord',
        type: 'Community Chat',
        description: 'Bot integration for community management.',
        color: '#5865F2',
        status: 'disconnected',
    },
    {
        id: 'telegram',
        name: 'Telegram',
        type: 'Messaging',
        description: 'Direct secure updates via TG Bots.',
        color: '#26A5E4',
        status: 'disconnected',
    },
    {
        id: 'google-drive',
        name: 'Google Workspace',
        type: 'Document Store',
        description: 'Semantic search and RAG over Drive files.',
        color: '#4285F4',
        status: 'disconnected',
    },
    {
        id: 'dropbox',
        name: 'Dropbox',
        type: 'Storage',
        description: 'Sync raw data files and binary blobs.',
        color: '#0061FF',
        status: 'disconnected',
    },
    {
        id: 'gmail',
        name: 'Gmail Auth',
        type: 'Email Relay',
        description: 'Automated email parsing and response generation.',
        color: '#EA4335',
        status: 'disconnected',
    },
    {
        id: 'github',
        name: 'GitHub OAuth',
        type: 'Version Control',
        description: 'PR reviews and autonomous code commits.',
        color: 'var(--slate-50)',
        status: 'disconnected',
    },
    {
        id: 'notion',
        name: 'Notion API',
        type: 'Knowledge Base',
        description: 'Query and update knowledge graph blocks.',
        color: 'var(--slate-200)',
        status: 'disconnected',
    },
];

export const CONNECTOR_ICONS: Record<string, React.ReactNode> = {
    slack: <MessageSquare size={24} />,
    discord: <Send size={24} />,
    telegram: <Send size={24} />,
    'google-drive': <FileText size={24} />,
    dropbox: <Database size={24} />,
    gmail: <Mail size={24} />,
    github: <Box size={24} />,
    notion: <Layers size={24} />,
};

export const STORAGE_KEY = 'super_agents_connectors';

export const STAT_LABELS: Record<string, string> = {
    connected: 'connectors.status.authenticated',
    auth_required: 'connectors.status.auth_needed',
    disconnected: 'connectors.status.offline',
};

export function getConnectorStyle(status: string) {
    const color = getStatusColor(status);
    return {
        color,
        dotBg: color,
        dotShadow: status === 'connected' ? `0 0 10px ${color}` : 'none',
    };
}

export const getIcon = (id: string): React.ReactNode => CONNECTOR_ICONS[id] ?? <Globe size={24} />;
