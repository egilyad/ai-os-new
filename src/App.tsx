import React from 'react';
import { AppLayout } from './components/AppLayout';
import { ResponsiveShell } from './components/Layout/ResponsiveShell';

const App: React.FC = () => {
    return (
        <ResponsiveShell>
            <AppLayout />
        </ResponsiveShell>
    );
};

export default App;
