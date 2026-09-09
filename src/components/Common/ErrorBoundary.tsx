import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-names';
import { rootLogger } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    children: ReactNode;
    name?: string;
    variant?: 'page' | 'panel';
}

interface ErrorBoundaryProps extends Props {
    t: (key: string, params?: Record<string, string | number>) => string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, State> {
    public state: State = { hasError: false, error: null };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        rootLogger.error('ErrorBoundary', error.message, {
            name: this.props.name,
            componentStack: errorInfo.componentStack,
            stack: error.stack,
        });
        eventBus.emit(EVENTS.ERROR_BOUNDARY_CAUGHT, {
            name: this.props.name,
            message: error.message,
            componentStack: errorInfo.componentStack as string | undefined,
            stack: error.stack,
            timestamp: Date.now(),
        });
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: `[ErrorBoundary${this.props.name ? ':' + this.props.name : ''}] ${error.message}`,
            type: 'error',
        });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        const t = this.props.t;
        if (this.state.hasError) {
            if (this.props.variant === 'panel') {
                return (
                    <div className="error-panel" role="alert" aria-live="assertive">
                        <AlertTriangle size={32} color="#ef4444" className="error-panel-icon" />
                        <p className="error-panel-title">
                            {this.props.name
                                ? `${this.props.name}: ${t('error_boundary.panel_crashed')}`
                                : t('error_boundary.panel_crashed')}
                        </p>
                        <p className="error-panel-message">
                            {this.state.error?.message || t('error_boundary.unexpected_error')}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="error-reload-btn"
                            aria-label={t('error_boundary.reload')}
                        >
                            <RefreshCw size={14} /> {t('error_boundary.reload')}
                        </button>
                    </div>
                );
            }

            return (
                <div className="error-page" role="alert" aria-live="assertive">
                    <div className="error-page-card">
                        <AlertTriangle size={64} color="#ef4444" className="error-page-icon" />
                        <h1 className="error-page-heading">{t('error_boundary.page_title')}</h1>
                        <p className="error-page-desc">{t('error_boundary.page_desc')}</p>

                        <div className="error-page-detail">{this.state.error?.toString()}</div>

                        <div className="error-page-actions">
                            <button onClick={this.handleReset} className="error-page-btn">
                                <RefreshCw size={18} /> {t('error_boundary.reload')}
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="error-page-btn--secondary"
                            >
                                <Home size={18} /> {t('error_boundary.go_home')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const ErrorBoundary: React.FC<Props> = (props) => {
    const { t } = useTranslation();
    return <ErrorBoundaryBase {...props} t={t} />;
};

export default ErrorBoundary;
