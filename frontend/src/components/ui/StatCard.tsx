import React from 'react'

interface StatCardProps {
  title:     string
  value:     number | string
  icon:      string
  color:     'blue' | 'green' | 'yellow' | 'red' | 'teal' | 'purple'
  subtitle?: string
  loading?:  boolean
}

const colorMap: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  yellow: 'bg-amber-50 text-amber-600',
  red:    'bg-red-50 text-red-500',
  teal:   'bg-teal-50 text-teal',
  purple: 'bg-purple-50 text-purple-600',
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  loading = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 card-3d cursor-default border border-gray-100/80 shadow-sm group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color] || colorMap.blue} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded-lg animate-shimmer" />
        ) : (
          <span className="text-2xl font-bold text-navy">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-navy">{title}</p>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}
