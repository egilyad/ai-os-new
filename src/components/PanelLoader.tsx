import ErrorBoundary from './Common/ErrorBoundary';

interface PanelLoaderProps {
  title?: string;
  name?: string;
  children: React.ReactNode;
}

const PanelLoader: React.FC<PanelLoaderProps> = ({ title, name, children }) => {
  return (
    <ErrorBoundary name={name || title} variant="panel">
      <div style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        {title && (
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-200)' }}>{title}</h2>
          </div>
        )}
        {children}
      </div>
    </ErrorBoundary>
  );
};

export default PanelLoader;
