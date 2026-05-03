import React from 'react'

export default function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            backgroundColor: [
              '#ff6b6b', '#ffd93d', '#6bcb77',
              '#4d96ff', '#ff922b'
            ][i % 5],
            animation: `confetti ${1 + Math.random()}s ${Math.random() * 0.5}s ease-in forwards`
          }}
        />
      ))}
    </div>
  )
}