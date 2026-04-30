import React from 'react'

interface ProgressBarProps {
  value: number
  color?: string
  showLabel?: boolean
}

export default function ProgressBar({
  value,
  color = 'bg-blue-600',
  showLabel = true,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        {showLabel && (
          <span className="ml-3 text-sm text-gray-600 min-w-[40px]">
            {clampedValue}%
          </span>
        )}
      </div>
    </div>
  )
}