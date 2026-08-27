import React from 'react';

export type ButtonVariant =
    'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent' | 'warning' | 'neutral';
export type ButtonSize = 'md' | 'sm' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

/**
 * Single canonical button primitive (FA-10). Backed by `src/styles/base.css`
 * `.btn` / `.btn-{variant}` / `.btn-sm` classes so every action shares one
 * visual language instead of the many inline / `styles/common.ts` button idioms.
 */
export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    className,
    type = 'button',
    children,
    ...rest
}) => {
    const classes = [
        'btn',
        `btn-${variant}`,
        size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (
        <button type={type} className={classes} {...rest}>
            {children}
        </button>
    );
};

export default Button;
