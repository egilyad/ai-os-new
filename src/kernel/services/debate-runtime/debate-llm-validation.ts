// ── Response validation ─────────────────────────────────────────────
// Detect instruction-leakage responses where the LLM returns
// meta-commentary ("Извините, но вы не выполнили инструкции") instead
// of an actual debate argument. These patterns indicate the model is
// rejecting the prompt rather than participating.
const INSTRUCTION_LEAKAGE_PATTERNS = [
    // Russian: apology + instruction not followed
    /извините,?\s+но\s+(кажется|похоже|вы)\s+(не\s+)?(выполнили|следуете|поняли|прочитали)/iu,
    /вы\s+(не\s+)?(выполнили|соблюдаете|следуете|учли)\s+(мои|все|указанные)\s+инструкци/u,
    /пожалуйста,\s*(внимательно|еще раз|заново)\s*(прочитайте|ознакомьтесь)/iu,
    /кажется,\s*вы\s+(забыли|пропустили|не учли|не указали)/iu,
    /я\s+не\s+(могу|буду)\s+(выполнять|участвовать|продолжать)\s+в\s+этой\s+(роли|дискуссии)/iu,
    /это\s+(нарушает|противоречит)\s+(мои|моим)\s+(принцип|правил|политик)/iu,
    /я\s+(не\s+)?(могу|должен|буду)\s+(отвечать|ответить|генерировать|создавать|писать)\s+(от\s+имени|в\s+роли|как)/iu,
    /как\s+языковая\s+модель|как\s+искусственный\s+интеллект|как\s+AI\s+ассистент/iu,

    // English: meta-rejection patterns
    /i\s+(can't|cannot|won't|shouldn't|will\s+not)\s+(respond|participate|continue|engage)/iu,
    /this\s+(goes\s+against|violates|breaches)\s+my\s+(guidelines|principles|policy|rules)/iu,
    /i\s+apologize[^.!]*?but\s+(i\s+)?(can't|cannot|won't)/iu,
    /i'm\s+(sorry|afraid)[^.!]*?(but\s+)?(i\s+)?(can't|cannot|won't)/iu,
    /as\s+an\s+(AI|artificial\s+intelligence)\s+(language\s+model|assistant)/iu,
    /i\s+wasn't\s+(designed|created|programmed)\s+to/iu,
    /it\s+would\s+be\s+inappropriate\s+(for\s+me|to)/iu,
    /i\s+(don't|do\s+not)\s+have\s+a\s+personal\s+(opinion|position|view)/iu,

    // Short vacuous responses (under 40 chars of real content)
    /^(interesting\s+(point|question)|that's?\s+a\s+(good|great)\s+(point|question)|i\s+(agree|disagree)|согласен|не\s+согласен)\s*\.?\s*$/iu,
];

export function isValidDebateResponse(content: string): { valid: boolean; reason?: string } {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 10) {
        return { valid: false, reason: 'Empty or too short' };
    }

    for (const pat of INSTRUCTION_LEAKAGE_PATTERNS) {
        if (pat.test(trimmed)) {
            return {
                valid: false,
                reason: `Instruction leakage pattern matched: ${pat.source.slice(0, 60)}`,
            };
        }
    }

    return { valid: true };
}
