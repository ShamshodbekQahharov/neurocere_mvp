import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Confetti from '../components/Confetti'

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { score, correctAnswers, totalQuestions, gameId } = location.state || {}

  useEffect(() => {
    document.title = 'NeuroCare — Natija'
  }, [])

  const getResult = () => {
    if (score >= 80) {
      return { emoji: '🏆', title: 'AJOYIB!', desc: "Siz juda zo'r o'ynading!", stars: 3 }
    } else if (score >= 50) {
      return { emoji: '⭐', title: 'YAXSHI!', desc: "Davom eting, zo'r bo'lyapsiz!", stars: 2 }
    } else {
      return { emoji: '💪', title: 'HARAKAT QILING!', desc: "Keyingi safar yaxshiroq bo'ladi!", stars: 1 }
    }
  }

  const result = getResult()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center px-4">
      {score >= 80 && <Confetti />}
      
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-7xl mb-4 animate-bounce">{result.emoji}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{result.title}</h1>
        <p className="text-gray-600 mb-6">{result.desc}</p>
        
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="text-lg mb-2">
            <span className="font-bold">To'g'ri javoblar:</span> {correctAnswers} / {totalQuestions}
          </div>
          <div className="text-lg">
            <span className="font-bold">Ball:</span> {score}
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="text-3xl">
              {i < result.stars ? '⭐' : '☆'}
            </span>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/child/game/${gameId}`)}
            className="flex-1 bg-blue-500 text-white rounded-full py-3 font-bold text-lg hover:bg-blue-600 active:bg-blue-700"
          >
            🔄 Qayta o'ynash
          </button>
          <button
            onClick={() => navigate('/child')}
            className="flex-1 bg-gray-200 text-gray-800 rounded-full py-3 font-bold text-lg hover:bg-gray-300 active:bg-gray-400"
          >
            🏠 Bosh sahifa
          </button>
        </div>
      </div>
    </div>
  )
}