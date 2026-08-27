import { Clock, Code, File } from 'lucide-react';

interface Props {
    recentFiles: string[];
    onSelectFile: (path: string) => void;
}

const RecentFilesSection: React.FC<Props> = ({ recentFiles, onSelectFile }) => {
    if (recentFiles.length === 0) {
        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--slate-600)',
                    gap: '0.75rem',
                    padding: '2rem',
                }}
            >
                <Code size={32} opacity={0.2} />
                <span style={{ fontSize: '0.8rem' }}>Select a file to preview</span>
            </div>
        );
    }

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--slate-600)',
                gap: '0.75rem',
                padding: '2rem',
            }}
        >
            <Code size={32} opacity={0.2} />
            <span style={{ fontSize: '0.8rem' }}>Select a file to preview</span>
            <div
                style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    maxWidth: 320,
                }}
            >
                <div
                    style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--slate-500)',
                        textTransform: 'uppercase',
                        marginBottom: '0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <Clock size={10} /> Recent
                </div>
                {recentFiles.slice(0, 6).map((path) => (
                    <div
                        key={path}
                        onClick={() => onSelectFile(path)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSelectFile(path);
                        }}
                        role="button"
                        tabIndex={0}
                        style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            color: 'var(--slate-400)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <File size={10} />
                        <span
                            style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {path}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentFilesSection;
