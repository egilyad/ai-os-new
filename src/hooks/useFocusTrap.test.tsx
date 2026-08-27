import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { useFocusTrap } from './useFocusTrap';

function Trap({ active, children }: { active: boolean; children?: ReactNode }) {
    const ref = useFocusTrap(active);
    return (
        <div ref={ref} data-testid="trap">
            {children}
        </div>
    );
}

describe('useFocusTrap', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('does not attach listeners when inactive', () => {
        const { getByTestId } = render(<Trap active={false} />);
        const container = getByTestId('trap');
        const addSpy = vi.spyOn(container, 'addEventListener');
        expect(addSpy).not.toHaveBeenCalled();
        addSpy.mockRestore();
    });

    it('focuses the first focusable element when activated', () => {
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const { getByTestId } = render(
            <Trap active>
                <input id="a" />
                <button id="b">ok</button>
            </Trap>,
        );
        const container = getByTestId('trap');
        const first = container.querySelector('#a') as HTMLInputElement;
        expect(focusSpy).toHaveBeenCalled();
        expect(focusSpy.mock.instances[0]).toBe(first);
        focusSpy.mockRestore();
    });

    it('does not focus anything when there are no focusable elements', () => {
        expect(() =>
            render(
                <Trap active>
                    <div>no focusable here</div>
                </Trap>,
            ),
        ).not.toThrow();
    });

    it('wraps Tab from the last element back to the first', () => {
        const { getByTestId } = render(
            <Trap active>
                <input id="a" />
                <button id="b">ok</button>
            </Trap>,
        );
        const container = getByTestId('trap');
        const first = container.querySelector('#a') as HTMLInputElement;
        const last = container.querySelector('#b') as HTMLButtonElement;
        last.focus();
        const firstFocusSpy = vi.spyOn(first, 'focus');
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        const preventSpy = vi.spyOn(event, 'preventDefault');
        act(() => {
            container.dispatchEvent(event);
        });
        expect(preventSpy).toHaveBeenCalled();
        expect(firstFocusSpy).toHaveBeenCalled();
    });

    it('wraps Shift+Tab from the first element to the last', () => {
        const { getByTestId } = render(
            <Trap active>
                <input id="a" />
                <button id="b">ok</button>
            </Trap>,
        );
        const container = getByTestId('trap');
        const first = container.querySelector('#a') as HTMLInputElement;
        const last = container.querySelector('#b') as HTMLButtonElement;
        first.focus();
        const lastFocusSpy = vi.spyOn(last, 'focus');
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
        const preventSpy = vi.spyOn(event, 'preventDefault');
        act(() => {
            container.dispatchEvent(event);
        });
        expect(preventSpy).toHaveBeenCalled();
        expect(lastFocusSpy).toHaveBeenCalled();
    });

    it('does not intercept Tab when focus is not on an edge', () => {
        const { getByTestId } = render(
            <Trap active>
                <input id="a" />
                <button id="b">ok</button>
            </Trap>,
        );
        const container = getByTestId('trap');
        const first = container.querySelector('#a') as HTMLInputElement;
        const last = container.querySelector('#b') as HTMLButtonElement;
        last.focus();
        first.focus();
        const firstFocusSpy = vi.spyOn(first, 'focus');
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        const preventSpy = vi.spyOn(event, 'preventDefault');
        act(() => {
            container.dispatchEvent(event);
        });
        expect(preventSpy).not.toHaveBeenCalled();
        expect(firstFocusSpy).not.toHaveBeenCalled();
    });

    it('ignores non-Tab keys', () => {
        const { getByTestId } = render(
            <Trap active>
                <input id="a" />
                <button id="b">ok</button>
            </Trap>,
        );
        const container = getByTestId('trap');
        const first = container.querySelector('#a') as HTMLInputElement;
        first.focus();
        const firstFocusSpy = vi.spyOn(first, 'focus');
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        const preventSpy = vi.spyOn(event, 'preventDefault');
        act(() => {
            container.dispatchEvent(event);
        });
        expect(preventSpy).not.toHaveBeenCalled();
        expect(firstFocusSpy).not.toHaveBeenCalled();
    });

    it('removes the listener and restores focus on cleanup', () => {
        const previouslyFocused = document.createElement('button');
        document.body.appendChild(previouslyFocused);
        previouslyFocused.focus();
        const { getByTestId, unmount } = render(
            <Trap active>
                <button id="b">ok</button>
            </Trap>,
        );
        const container = getByTestId('trap');
        const removeSpy = vi.spyOn(container, 'removeEventListener');
        unmount();
        expect(removeSpy).toHaveBeenCalled();
        expect(document.activeElement).toBe(previouslyFocused);
    });

    it('attaches the trap when toggled from inactive to active', () => {
        const { getByTestId, rerender } = render(<Trap active={false} />);
        const container = getByTestId('trap');
        const addSpy = vi.spyOn(container, 'addEventListener');
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        rerender(
            <Trap active>
                <input id="a" />
            </Trap>,
        );
        expect(focusSpy).toHaveBeenCalled();
        focusSpy.mockRestore();
        addSpy.mockRestore();
    });
});
