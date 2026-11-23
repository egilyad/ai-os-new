import React from 'react';
import { AppLayout } from './components/AppLayout';
import { ResponsiveShell } from './components/Layout/ResponsiveShell';
import CommandPalette from './components/Common/CommandPalette';
import NotificationToasts from './components/NotificationToasts';

const App: React.FC = () => {
    return (
        <ResponsiveShell>
            <AppLayout />
            <CommandPalette />
            <NotificationToasts />
        </ResponsiveShell>
    );
};

export default App;
