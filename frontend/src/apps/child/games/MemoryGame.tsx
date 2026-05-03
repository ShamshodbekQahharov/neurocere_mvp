import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'

const CARDS = ['🐱','🐶','🐸','🦋','🌸','⭐','🎈','🍎']

export default function MemoryGame({ onComplete }: { onComplete: (score: number, correct: number, total: number) => void }) {
  const [cards, setCards] = useState<Array<{ emoji: string; id: number }>>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [childId, setChildId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchChildId()
    initializeCards()
  }, [])

  const fetchChildId = async () => {
    try {
      const res = await api.get('/api/children')
      const children = res.data?.data?.children || []
      if (children.length > 0) {
        setChildId(children[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch child:', err)
    }
  }

  const initializeCards = () => {
    const duplicated = [...CARDS, ...CARDS]
    const shuffled = duplicated
      .map((emoji, i) => ({ emoji, id: i }))
      .sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }

  const handleCardClick = (index: number) => {
    if (flipped.length === 2) return
    if (flipped.includes(index)) return
    if (matched.includes(index)) return

    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setMatched(prev => [...prev, a, b])
        setFlipped([])
        if (matched.length + 2 === cards.length) {
          setTimeout(() => saveAndComplete(), 500)
        }
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }

  const saveAndComplete = async () => {
    const finalScore = Math.max(0, 100 - moves * 5)
    const totalPairs = CARDS.length
    
    if (childId) {
      try {
        await api.post('/api/games/session', {
          child_id: childId,
          game_id: 'memory',
          score: finalScore,
          correct_answers: totalPairs,
          total_questions: totalPairs,
          difficulty_level: 1
        })
      } catch (err) {
        console.error('Failed to save result:', err)
      }
    }

    onComplete(finalScore, totalPairs, totalPairs)
  }

  return (
    <div className="flex flex-col items-center p-6">
      <div className="mb-4 text-white text-xl">
        Urinishlar: {moves}
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-md">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(index)
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              disabled={isFlipped}
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                transition-all transform
                ${isFlipped 
                  ? 'bg-white border-2 border-blue-300 cursor-default' 
                  : 'bg-blue-500 hover:bg-blue-400 cursor-pointer hover:scale-105'
                }
                ${matched.includes(index) ? 'bg-green-100 border-green-400' : ''}
              `}
            >
              {isFlipped ? card.emoji : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}