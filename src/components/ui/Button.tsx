import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'base' | 'primary' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const baseClasses =
  'inline-flex items-center justify-center rounded border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  base: 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50',
  primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
  destructive: 'border-red-500 bg-red-500 text-white hover:bg-red-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  icon: 'h-8 w-8 p-0',
}

export function Button({
  variant = 'base',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

