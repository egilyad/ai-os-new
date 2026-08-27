import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { textMutedXs } from '../../styles/common';
import type { AttachedFile } from './key-notes-types';

interface FilePreviewModalProps {
    file: AttachedFile | null;
    onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {file && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '90vw', maxHeight: '90vh', padding: '1rem' }}
                    >
                        {file.type.startsWith('image/') ? (
                            <img
                                src={file.dataUrl}
                                alt={file.name}
                                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8 }}
                            />
                        ) : (
                            <div
                                style={{
                                    padding: '2rem',
                                    background: 'var(--slate-800)',
                                    borderRadius: 8,
                                    color: 'var(--slate-200)',
                                }}
                            >
                                <p>{file.name}</p>
                                <p style={textMutedXs}>{(file.size / 1024).toFixed(1)} KB</p>
                                <a
                                    href={file.dataUrl}
                                    download={file.name}
                                    style={{
                                        marginTop: '1rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 6,
                                        background: 'var(--accent)',
                                        color: '#fff',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <Download size={12} /> {t('key_notes.download')}
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
