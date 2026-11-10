import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WikiPanel } from './WikiPanel';
import { WikiPanelStub } from './WikiArticleView';

afterEach(() => cleanup());

function openWiki() {
    render(
        <MemoryRouter>
            <WikiPanel />
        </MemoryRouter>,
    );
}

describe('WikiPanel portal', () => {
    it('renders home with sections and status', () => {
        openWiki();
        expect(screen.getByText('SuperAgents OS — Wiki')).toBeDefined();
        expect(screen.getByText('О проекте')).toBeDefined();
        expect(screen.getAllByText('Карта системы').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Состояние проекта')).toBeDefined();
    });

    it(
        'opens an article from the sidebar with freshness badge',
        () => {
            openWiki();
            fireEvent.click(screen.getByRole('button', { name: 'Дебаты' }));
            expect(
                screen.getByRole('heading', { name: 'Дебаты: режимы и механика' }),
            ).toBeDefined();
            expect(screen.getByText('Подтверждено кодом')).toBeDefined();
        },
        30000,
    );

    it(
        'internal [[slug]] links navigate between articles',
        () => {
            openWiki();
            const openers = screen.getAllByRole('button', { name: 'Что такое SuperAgents OS' });
            fireEvent.click(openers[0]!);
            expect(
                screen.getByRole('heading', { name: 'Что такое SuperAgents OS' }),
            ).toBeDefined();
            const link = screen.getByRole('button', { name: 'capabilities' });
            fireEvent.click(link);
            expect(screen.getByRole('heading', { name: 'Возможности ОС' })).toBeDefined();
        },
        30000,
    );

    it(
        'panel map renders live registry sections',
        () => {
            openWiki();
            fireEvent.click(screen.getByRole('button', { name: 'Карта ОС' }));
            expect(
                screen.getByText('Карта ОС — дерево из живого реестра'),
            ).toBeDefined();
        },
        30000,
    );

    it('unknown panels open an honest stub, not fake instructions', () => {
        render(
            <MemoryRouter>
                <WikiPanelStub title="Unknown Panel" sectionTitle="Unknown" />
            </MemoryRouter>,
        );
        expect(screen.getByText('Требует проверки')).toBeDefined();
        expect(screen.getByText(/пока не написана/)).toBeDefined();
    });

    it(
        'search finds articles by Russian text',
        async () => {
            openWiki();
            fireEvent.click(screen.getByRole('button', { name: 'Поиск' }));
            fireEvent.change(screen.getByLabelText('Поиск по Wiki'), {
                target: { value: 'дебаты режимы механика' },
            });
            await waitFor(
                () => {
                    expect(
                        screen.getByRole('button', { name: 'Дебаты: режимы и механика' }),
                    ).toBeDefined();
                },
                { timeout: 30000 },
            );
        },
        45000,
    );

    it(
        'news view renders the generated commits feed',
        () => {
            openWiki();
            fireEvent.click(screen.getByRole('button', { name: /Новости/ }));
            expect(screen.getByText('Новости проекта — лента коммитов')).toBeDefined();
        },
        30000,
    );
});
