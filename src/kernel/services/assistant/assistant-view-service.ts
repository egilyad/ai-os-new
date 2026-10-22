/**
 * AssistantViewService — where the user is right now.
 *
 * The assistant answers questions about the project, and most of them are
 * asked while looking at a panel ("что это за экран?", "почему пусто?"). The
 * kernel does not own the router, so the interface pushes the current view
 * here and the assistant uses it as the operational layer (D) of the prompt.
 */
export interface AssistantView {
    /** Current route, e.g. "/memory". */
    route: string;
    /** Panel id, when the route belongs to a known panel. */
    panelId?: string;
    /** What the operator was doing, when the interface knows it. */
    activity?: string;
    updatedAt: number;
}

export class AssistantViewService {
    private view: AssistantView | null = null;

    /** The interface reports the current view. */
    setView(view: { route: string; panelId?: string; activity?: string }): void {
        this.view = {
            route: view.route,
            panelId: view.panelId,
            activity: view.activity,
            updatedAt: Date.now(),
        };
    }

    getView(): AssistantView | null {
        return this.view;
    }

    /** A one-line summary for the prompt. */
    summary(): string {
        if (!this.view) return '';
        const parts = [`route: ${this.view.route}`];
        if (this.view.panelId) parts.push(`panel: ${this.view.panelId}`);
        if (this.view.activity) parts.push(`activity: ${this.view.activity}`);
        return parts.join(', ');
    }

    clear(): void {
        this.view = null;
    }
}
