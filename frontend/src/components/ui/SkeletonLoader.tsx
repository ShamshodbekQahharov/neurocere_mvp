import React from 'react'

interface SkeletonLoaderProps {
  width?: string
  height?: string
  rounded?: boolean
}

export default function SkeletonLoader({
  width = '100%',
  height = '16px',
  rounded = false,
}: SkeletonLoaderProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'}`}
      style={{ width, height }}
    />
  )
}