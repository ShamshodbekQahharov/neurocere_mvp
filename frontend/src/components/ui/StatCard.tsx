import React from 'react'

interface StatCardProps {
  title: string
  value: number | string
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red'
  loading?: boolean
}

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  loading = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        ) : (
          <div className="text-3xl font-bold text-gray-800">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        )}
        <div className="text-sm text-gray-500 mt-1">{title}</div>
      </div>
    </div>
  )
}