import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { rootLogger } from '../kernel/instances';
const LOGGER = rootLogger.child('GlobalErrorBoundary');

interface GlobalErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}
interface GlobalErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<
    GlobalErrorBoundaryProps,
    GlobalErrorBoundaryState
> {
    constructor(props: GlobalErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        LOGGER.error('Unhandled error', error.message, { componentStack: info.componentStack });
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return <>{this.props.fallback}</>;
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        gap: '1rem',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)',
                    }}
                >
                    <AlertTriangle size={48} color="var(--accent-warning)" />
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                        Something went wrong
                    </h2>
                    <p
                        style={{
                            color: 'var(--text-muted)',
                            margin: 0,
                            maxWidth: '400px',
                            textAlign: 'center',
                        }}
                    >
                        {this.state.error?.message ||
                            'An unexpected error occurred. The application has been reset.'}
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                        }}
                    >
                        <RefreshCw size={16} />
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
