import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  hover?: boolean
  glass?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  title,
  subtitle,
  className = '',
  hover = false,
  glass = false,
  padding = 'md',
}: CardProps) {
  const paddings = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-300
        ${glass ? 'glass' : 'bg-white border-gray-100/80 shadow-sm'}
        ${hover ? 'card-3d cursor-pointer hover:shadow-navy' : ''}
        ${paddings[padding]}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-4 pb-3 border-b border-gray-100">
          {title    && <h3 className="font-serif text-lg text-navy">{title}</h3>}
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
