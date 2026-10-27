import React from 'react';
import { AppLayout } from './components/AppLayout';
import { ResponsiveShell } from './components/Layout/ResponsiveShell';
import CommandPalette from './components/Common/CommandPalette';

const App: React.FC = () => {
    return (
        <ResponsiveShell>
            <AppLayout />
            <CommandPalette />
        </ResponsiveShell>
    );
};

export default App;
