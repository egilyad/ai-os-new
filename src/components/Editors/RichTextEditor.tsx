import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    height?: number;
    readonly?: boolean;
}

const ToolbarBtn: React.FC<{
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        style={{
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            border: 'none',
            background: active ? 'rgba(59,130,246,0.3)' : 'transparent',
            color: active ? '#60a5fa' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: active ? 600 : 400,
        }}
    >
        {children}
    </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    height = 200,
    readonly,
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: placeholder || 'Start typing...' }),
        ],
        content: value,
        editable: !readonly,
        onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    });

    return (
        <div
            style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        >
            {!readonly && editor && (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.15rem',
                        padding: '0.3rem 0.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        flexWrap: 'wrap',
                    }}
                >
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold"
                    >
                        <strong>B</strong>
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic"
                    >
                        <em>I</em>
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </ToolbarBtn>
                    <span
                        style={{
                            width: 1,
                            background: 'var(--border-default)',
                            margin: '0 0.2rem',
                        }}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="H1"
                    >
                        H1
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="H2"
                    >
                        H2
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive('heading', { level: 3 })}
                        title="H3"
                    >
                        H3
                    </ToolbarBtn>
                    <span
                        style={{
                            width: 1,
                            background: 'var(--border-default)',
                            margin: '0 0.2rem',
                        }}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        •
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Ordered List"
                    >
                        1.
                    </ToolbarBtn>
                    <span
                        style={{
                            width: 1,
                            background: 'var(--border-default)',
                            margin: '0 0.2rem',
                        }}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive('blockquote')}
                        title="Blockquote"
                    >
                        {'"'}
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        active={false}
                        title="Horizontal Rule"
                    >
                        —
                    </ToolbarBtn>
                    <div style={{ flex: 1 }} />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().undo().run()}
                        active={false}
                        title="Undo"
                    >
                        ↩
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().redo().run()}
                        active={false}
                        title="Redo"
                    >
                        ↪
                    </ToolbarBtn>
                </div>
            )}
            <div style={{ height, overflow: 'auto', padding: '0.75rem' }}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default RichTextEditor;
