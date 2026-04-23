'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/colors';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          {
            'text-white hover:opacity-90': variant === 'default' || variant === 'destructive',
            'border hover:opacity-90': variant === 'outline',
            'hover:opacity-90': variant === 'secondary' || variant === 'ghost',
            'underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 rounded-md': size === 'sm',
            'h-11 px-8 rounded-md': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        style={{
          backgroundColor: 
            variant === 'default' ? colors.primary[950] :
            variant === 'destructive' ? colors.error[600] :
            variant === 'outline' ? colors.background.primary :
            variant === 'secondary' ? colors.background.secondary :
            variant === 'ghost' ? 'transparent' :
            'transparent',
          color:
            variant === 'default' ? colors.text.inverse :
            variant === 'destructive' ? colors.text.inverse :
            variant === 'outline' ? colors.text.primary :
            variant === 'secondary' ? colors.text.primary :
            variant === 'ghost' ? colors.text.primary :
            colors.text.primary,
          borderColor:
            variant === 'outline' ? colors.border.medium :
            variant === 'default' ? colors.primary[950] :
            'transparent',
        }}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };