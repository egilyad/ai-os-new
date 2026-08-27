
interface Props {
    pct: number;
    color: string;
}

const MiniBar: React.FC<Props> = ({ pct, color }) => (
    <div
        style={{
            width: '100%',
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
        }}
    >
        <div
            style={{
                width: `${Math.min(100, pct * 100)}%`,
                height: '100%',
                background: color,
                borderRadius: 2,
                transition: 'width 0.5s ease',
            }}
        />
    </div>
);

export default MiniBar;
