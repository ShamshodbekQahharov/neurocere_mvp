import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import Confetti from '../components/Confetti'

const questions = [
  { image: '🐱', word: 'mushuk', options: ['mushuk','it','baliq','qush'] },
  { image: '🐶', word: 'it', options: ['mushuk','it','ot','sigir'] },
  { image: '🍎', word: 'olma', options: ['nok','olma','uzum','shaftoli'] },
  { image: '🚗', word: 'mashina', options: ['avtobus','mashina','velosiped','mototsikl'] },
  { image: '🏠', word: 'uy', options: ['uy',"ko'cha",'bog\'','maktab'] },
  { image: '📚', word: 'kitob', options: ['kitob','daftar','qalam','ruchka'] },
  { image: '🌞', word: 'quyosh', options: ['oy','yulduz','quyosh','bulut'] },
  { image: '🌊', word: 'suv', options: ['suv','olov','havo','tuproq'] },
  { image: '✏️', word: 'qalam', options: ['ruchka','qalam',"o'chirg'ich",'chizg\'ich'] },
  { image: '🎈', word: 'shar', options: ['shar','koptok','kubik','piramida'] },
]

export default function WordMatchGame({ onComplete }: { onComplete: (score: number, correct: number, total: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [childId, setChildId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchChildId()
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

  const handleAnswer = async (option: string) => {
    if (selectedAnswer) return
    setSelectedAnswer(option)

    if (option === questions[currentQ].word) {
      setScore(prev => prev + 10)
      setCorrectAnswers(prev => prev + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1000)
    }

    setTimeout(async () => {
      if (currentQ + 1 >= questions.length) {
        const finalScore = score + (option === questions[currentQ].word ? 10 : 0)
        const finalCorrect = correctAnswers + (option === questions[currentQ].word ? 1 : 0)
        
        if (childId) {
          try {
            await api.post('/api/games/session', {
              child_id: childId,
              game_id: 'word-match',
              score: finalScore,
              correct_answers: finalCorrect,
              total_questions: questions.length,
              difficulty_level: 1
            })
          } catch (err) {
            console.error('Failed to save result:', err)
          }
        }

        onComplete(finalScore, finalCorrect, questions.length)
      } else {
        setCurrentQ(prev => prev + 1)
        setSelectedAnswer(null)
      }
    }, 1500)
  }

  const currentQuestion = questions[currentQ]

  return (
    <div className="flex flex-col items-center p-6">
      {showConfetti && <Confetti />}
      
      <div className="mb-6 text-center">
        <div className="text-8xl mb-4">{currentQuestion.image}</div>
        <h2 className="text-2xl font-bold text-white">Bu nima?</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {currentQuestion.options.map((option) => {
          const isCorrect = option === currentQuestion.word
          const isSelected = option === selectedAnswer
          
          let buttonClass = 'bg-white border-2 border-gray-200 rounded-2xl p-4 text-lg font-medium hover:border-blue-400 hover:bg-blue-50'
          
          if (selectedAnswer) {
            if (isCorrect) {
              buttonClass = 'bg-green-100 border-green-500 text-green-700'
            } else if (isSelected && !isCorrect) {
              buttonClass = 'bg-red-100 border-red-400 text-red-600'
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={buttonClass}
            >
              {isSelected && isCorrect && '✅ '}
              {isSelected && !isCorrect && '❌ '}
              {option}
            </button>
          )
        })}
      </div>

      <div className="mt-6 text-white">
        Savol {currentQ + 1}/{questions.length}
      </div>
    </div>
  )
}