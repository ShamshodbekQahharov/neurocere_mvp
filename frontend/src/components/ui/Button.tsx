import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const variants: Record<string, string> = {
  primary:   'bg-navy text-white hover:bg-navy-light hover:shadow-navy',
  secondary: 'bg-teal text-white hover:bg-teal-dark hover:shadow-teal',
  outline:   'border-2 border-navy text-navy hover:bg-navy hover:text-white',
  ghost:     'bg-transparent text-navy hover:bg-cream-dark',
  danger:    'bg-red-500 text-white hover:bg-red-600',
}

const sizes: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export default function Button({
  children,
  onClick,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  className = '',
  type     = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200
        hover:-translate-y-0.5 active:translate-y-0
        focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
