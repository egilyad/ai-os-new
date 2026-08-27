interface StepDotsProps {
    step: 1 | 2 | 3;
}

const StepDots: React.FC<StepDotsProps> = ({ step }) => (
    <div className="modal-footer-dots">
        {[1, 2, 3].map((s) => (
            <div
                key={s}
                className={`modal-dot${step === s ? ' modal-dot--active' : step > s ? ' modal-dot--done' : ''}`}
            />
        ))}
    </div>
);

export default StepDots;
