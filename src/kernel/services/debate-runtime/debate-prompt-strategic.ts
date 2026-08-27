import type { EntanglementConstraint, AnchorClaim } from '../../contracts/debate-entanglement';
import type { VulnerabilityTarget, VulnerabilityType } from '../../contracts/debate-vulnerability';
import type { BeliefConflict } from '../../contracts/debate-belief-mining';
import type { MinimaxMove } from '../../contracts/debate-minimax';
import type { SteelmanTarget } from '../../contracts/debate-steelman';
import type { UnmetBurden } from '../../contracts/debate-bop';
import type { Contradiction } from '../../contracts/debate-consistency';
import { DEFAULT_LANGUAGE } from './debate-prompt-constants';

export function buildEntanglementConstraintPrompt(
    constraint: EntanglementConstraint,
    language = DEFAULT_LANGUAGE,
): string {
    const typeInstruction =
        constraint.responseType === 'rebut'
            ? 'DIRECTLY REBUT this specific claim. Show why it is wrong, incomplete, or misleading.'
            : constraint.responseType === 'support'
              ? 'SUPPORT this claim with additional evidence or reasoning. Strengthen it.'
              : 'REFINE this claim — clarify, qualify, or add nuance.';

    const langInstruction =
        language === 'Russian'
            ? 'Ты ОБЯЗАН начать свой ответ с прямого обращения к утверждению оппонента.'
            : "You MUST begin your response by directly addressing the opponent's claim below.";

    return `

### ⚡ Cross-examination Requirement (ABSOLUTE)
${langInstruction}

**Opponent's claim to address (${constraint.opponentName}):**
> "${constraint.targetClaimText.slice(0, 300)}"

${typeInstruction}

DO NOT ignore this claim. If you do not address it, your response will be rejected.`;
}

export function buildBeliefConflictsPrompt(conflicts: BeliefConflict[], language: string): string {
    const langIntro =
        language === 'Russian'
            ? '### Фундаментальные расхождения\nПрежде чем атаковать поверхностный аргумент оппонента, укажите, в чём ваше коренное расхождение во взглядах. Система обнаружила следующие нестыковки в ваших базовых предпосылках:'
            : '### Foundational Disagreements\nBefore attacking surface-level arguments, identify where your fundamental beliefs diverge. The system detected the following conflicts in your underlying assumptions:';

    const items = conflicts
        .map((c) => {
            const severityLabel =
                c.severity > 0.8
                    ? language === 'Russian'
                        ? '[КРИТИЧЕСКОЕ РАСХОЖДЕНИЕ]'
                        : '[CRITICAL DIVERGENCE]'
                    : c.severity > 0.6
                      ? language === 'Russian'
                          ? '[ЗНАЧИТЕЛЬНОЕ]'
                          : '[SIGNIFICANT]'
                      : language === 'Russian'
                        ? '[УМЕРЕННОЕ]'
                        : '[MODERATE]';
            return `${severityLabel} ${c.description}`;
        })
        .join('\n');

    return `\n\n${langIntro}\n${items}\n\n${
        language === 'Russian'
            ? 'Обратитесь к этим расхождениям в своём ответе. Покажите, где именно ваши ценности или допущения расходятся.'
            : 'Address these divergences in your response. Show where your values or assumptions fundamentally differ.'
    }`;
}

export function buildSteelmanPrompt(target: SteelmanTarget, language: string): string {
    const langSteelman =
        language === 'Russian'
            ? `### 🔧 Усиление тезиса оппонента (Steelmanning)
Прежде чем отведать, переформулируй позицию оппонента в её МАКСИМАЛЬНО СИЛЬНОЙ форме.
Покажи, что ты действительно понял аргумент — даже если собираешься его оспорить.

Начни с:
"Дай я удостоверюсь, что правильно понял твой сильнейший аргумент: <перефразировка>"

Затем ОБЯЗАТЕЛЬНО добавь подтверждение:
"Я правильно тебя понял?"

ТОЛЬКО ПОСЛЕ этого переходи к своему возражению.

**Аргумент для усиления (от ${target.opponentName}):**
> "${target.claimText}"`
            : `### 🔧 Opponent Steelmanning (Strongest Restatement)
Before you rebut, restate the opponent's position in its STRONGEST possible form.
Show that you genuinely understand the argument — even if you plan to challenge it.

Begin with:
"Let me make sure I understand your strongest argument: <restatement>"

Then MUST add confirmation:
"Did I understand correctly?"

ONLY AFTER that proceed with your rebuttal.

**Claim to steelman (from ${target.opponentName}):**
> "${target.claimText}"`;

    return `\n\n${langSteelman}\n\n${language === 'Russian' ? 'НАРУШЕНИЕ этого правила = твой ответ будет отклонён. Всегда начинай с усиления тезиса оппонента.' : 'VIOLATION of this rule = your response will be rejected. Always start with steelmanning the opponent.'}`;
}

export function buildBurdenOfProofPrompt(unmetBurdens: UnmetBurden[], language: string): string {
    const items = unmetBurdens
        .map((b) => `  - "${b.claimText.slice(0, 200)}" (round ${b.round})`)
        .join('\n');

    const langIntro =
        language === 'Russian'
            ? `### ⚖️ Бремя доказательства
У вас есть невыполненные обязательства по подтверждению следующих утверждений. Предоставьте доказательства по каждому или явно передайте бремя оппоненту.
Невыполненные утверждения:`
            : `### ⚖️ Burden of Proof
You have unmet evidence obligations for the following claims. Provide evidence for each or explicitly shift the burden to your opponent.
Unmet claims:`;

    const langInstruction =
        language === 'Russian'
            ? 'ВАЖНО: Если вы не предоставите доказательства, судья засчитает эти утверждения как необоснованные.'
            : 'IMPORTANT: If you do not provide evidence, the judge will count these claims as unsupported.';

    return `\n\n${langIntro}\n${items}\n\n${langInstruction}`;
}

export function buildConsistencyWarning(contradictions: Contradiction[], language: string): string {
    const items = contradictions
        .map((c, i) => `  ${i + 1}. Round ${c.earlierRound}: "${c.earlierClaimText.slice(0, 150)}"`)
        .join('\n');

    const langIntro =
        language === 'Russian'
            ? `### ⚠️ Обнаружено противоречие
Система заметила, что ваша текущая позиция противоречит вашим же утверждениям из предыдущих раундов:
${items}

Если вы изменили позицию — объясните эволюцию вашего мышления (это нормально).
Если вы по-прежнему придерживаетесь обеих позиций — разрешите противоречие.`
            : `### ⚠️ Contradiction Detected
The system noticed your current position contradicts your own earlier claims:
${items}

If you have changed your position — explain how your thinking evolved (this is legitimate growth).
If you still hold both positions — resolve the contradiction.`;

    return `\n\n${langIntro}`;
}

export function buildVulnerabilityTargetingPrompt(
    targets: VulnerabilityTarget[],
    language: string,
): string {
    if (targets.length === 0) return '';

    const lines = targets.map((t, i) => {
        const label = language === 'Russian' ? _vulnLabelRu(t.type) : _vulnLabelEn(t.type);
        return (
            `  ${i + 1}. [${t.opponentName}] ${label}: "${t.targetClaimText.slice(0, 200)}"` +
            `\n     → ${t.detail}`
        );
    });

    const langInstruction =
        language === 'Russian'
            ? 'Атакуй эти слабые места в первую очередь. Каждое из них — структурная уязвимость.'
            : "Target these weak points first. Each is a structural vulnerability in the opponent's argumentation.";

    return `

### ⚔ Vulnerability Targeting (Priority)
Exploit these structural weaknesses in opponent arguments:
${lines.join('\n')}

${langInstruction}
Focus your attack on the claims listed above. They are the weakest points.`;
}

function _vulnLabelRu(type: VulnerabilityType): string {
    switch (type) {
        case 'orphan':
            return 'Незащищённое утверждение';
        case 'abandoned':
            return 'Забытая позиция';
        case 'overextended':
            return 'Перегруженное утверждение';
        case 'weak_centrality':
            return 'Периферийное утверждение';
        case 'unchallenged':
            return 'Неоспоренное утверждение';
    }
}

function _vulnLabelEn(type: VulnerabilityType): string {
    switch (type) {
        case 'orphan':
            return 'Undefended claim';
        case 'abandoned':
            return 'Abandoned position';
        case 'overextended':
            return 'Overextended claim';
        case 'weak_centrality':
            return 'Peripheral claim';
        case 'unchallenged':
            return 'Unchallenged claim';
    }
}

export function buildAnchorsPrompt(anchors: AnchorClaim[], language = DEFAULT_LANGUAGE): string {
    if (anchors.length === 0) return '';

    const lines = anchors.map(
        (a, i) =>
            `  ${i + 1}. [${a.agentName}]: "${a.text.slice(0, 160)}" (round ${a.roundResolved})`,
    );

    const langInstruction =
        language === 'Russian'
            ? 'HE повторяйте эти пункты. Если оппонент пытается их переоткрыть — напомните, что они уже согласованы.'
            : 'Do NOT repeat these points. If an opponent tries to reopen them, remind that they are already agreed.';

    return `

### ✅ Common Ground (Do NOT re-argue)
The following claims have been established and not challenged for several rounds:
${lines.join('\n')}

${langInstruction}

Focus EXCLUSIVELY on unresolved points.`;
}

function _minimaxLabelRu(type: string): string {
    switch (type) {
        case 'attack_high_centrality':
            return 'Атака ключевого утверждения';
        case 'attack_low_support':
            return 'Атака слабо защищённого утверждения';
        case 'defend_own_weak':
            return 'Защита собственного уязвимого утверждения';
        case 'support_own_strong':
            return 'Усиление собственного сильного утверждения';
        case 'challenge_unattacked':
            return 'Оспаривание незатронутого утверждения';
        default:
            return 'Стратегический ход';
    }
}

function _minimaxLabelEn(type: string): string {
    switch (type) {
        case 'attack_high_centrality':
            return 'Attack Key Claim';
        case 'attack_low_support':
            return 'Attack Weakly Supported Claim';
        case 'defend_own_weak':
            return 'Defend Vulnerable Claim';
        case 'support_own_strong':
            return 'Strengthen Strong Claim';
        case 'challenge_unattacked':
            return 'Challenge Unattacked Claim';
        default:
            return 'Strategic Move';
    }
}

export function buildMinimaxStrategicPrompt(move: MinimaxMove, language: string): string {
    const actionLabel =
        language === 'Russian' ? _minimaxLabelRu(move.type) : _minimaxLabelEn(move.type);

    const langIntro =
        language === 'Russian'
            ? '### 🎯 Стратегическая рекомендация (Minimax)'
            : '### 🎯 Strategic Recommendation (Minimax)';

    const langTarget =
        language === 'Russian' ? `Цель: "${move.targetClaim}"` : `Target: "${move.targetClaim}"`;

    const langPriority =
        language === 'Russian'
            ? `Приоритет: ${(move.score * 100).toFixed(0)}/100 | Ожидаемый урон: ${(move.expectedDamage * 100).toFixed(0)}%`
            : `Priority: ${(move.score * 100).toFixed(0)}/100 | Expected damage: ${(move.expectedDamage * 100).toFixed(0)}%`;

    const langExecute =
        language === 'Russian'
            ? `${actionLabel}: ${move.rationale}`
            : `${actionLabel}: ${move.rationale}`;

    const langInstruction =
        language === 'Russian'
            ? 'Этот ход выбран как наилучший по критерию минимакса — он максимизирует ваш гарантированный выигрыш в худшем случае. Выполните его в первую очередь в своём ответе.'
            : 'This move was selected as the best minimax strategy — it maximizes your worst-case guaranteed gain. Execute it first in your response.';

    return `\n\n${langIntro}\n${langTarget}\n${langPriority}\n${langExecute}\n${langInstruction}`;
}
