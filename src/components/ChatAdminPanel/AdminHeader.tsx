import { LayoutDashboard } from 'lucide-react';

const AdminHeader: React.FC = () => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingBottom: '0.5rem',
        }}
    >
        <div>
            <h2
                style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    margin: '0 0 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    color: 'var(--slate-50)',
                }}
            >
                <LayoutDashboard size={36} color="#3b82f6" /> Conversation History Admin
            </h2>
            <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '1rem' }}>
                Manage all active threads, review past cognitive workflows, and clear agent memory.
            </p>
        </div>
    </div>
);

export default AdminHeader;
