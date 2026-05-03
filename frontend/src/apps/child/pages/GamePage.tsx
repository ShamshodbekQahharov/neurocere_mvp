import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import WordMatchGame from '../games/WordMatchGame'
import MemoryGame from '../games/MemoryGame'
import SortingGame from '../games/SortingGame'
import { useAuthStore } from '../../../store/authStore'

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const getGameTitle = () => {
    switch (gameId) {
      case 'word-match': return 'So\'z topish'
      case 'memory': return 'Xotira o\'yini'
      case 'sorting': return 'Saralash'
      default: return 'O\'yin'
    }
  }

  useEffect(() => {
    document.title = `NeuroCare — ${getGameTitle()}`
  }, [gameId])

  const handleGameComplete = (finalScore: number, correct: number, total: number) => {
    setScore(finalScore)
    setCorrectAnswers(correct)
    setTotalQuestions(total)
    navigate('/child/result', {
      state: {
        score: finalScore,
        correctAnswers: correct,
        totalQuestions: total,
        gameId
      }
    })
  }

  const renderGame = () => {
    switch (gameId) {
      case 'word-match':
        return <WordMatchGame onComplete={handleGameComplete} />
      case 'memory':
        return <MemoryGame onComplete={handleGameComplete} />
      case 'sorting':
        return <SortingGame onComplete={handleGameComplete} />
      default:
        return <div className="text-center p-8">O\'yin topilmadi</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500">
      <header className="bg-white bg-opacity-90 shadow-sm p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/child')}
            className="text-2xl text-gray-700 hover:text-gray-900"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-800">{getGameTitle()}</h1>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">⭐</span>
            <span className="font-bold text-gray-800">{score}</span>
          </div>
        </div>
      </header>
      <main className="p-4">
        {renderGame()}
      </main>
    </div>
  )
}