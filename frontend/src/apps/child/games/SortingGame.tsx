import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'

const questions = [
  { item: '🐱', question: 'Bu nima?', categories: ['Hayvon', 'Meva', 'Transport'], correct: 'Hayvon' },
  { item: '🍎', question: 'Bu nima?', categories: ['Hayvon', 'Meva', 'Transport'], correct: 'Meva' },
  { item: '🚗', question: 'Bu nima?', categories: ['Hayvon', 'Meva', 'Transport'], correct: 'Transport' },
  { item: '🐶', question: 'Bu nima?', categories: ['Hayvon', 'Sabzavot', 'Kiyim'], correct: 'Hayvon' },
  { item: '🥕', question: 'Bu nima?', categories: ['Hayvon', 'Sabzavot', 'Kiyim'], correct: 'Sabzavot' },
  { item: '👕', question: 'Bu nima?', categories: ['Hayvon', 'Sabzavot', 'Kiyim'], correct: 'Kiyim' },
  { item: '🚌', question: 'Bu nima?', categories: ['Hayvon', 'Meva', 'Transport'], correct: 'Transport' },
  { item: '🍌', question: 'Bu nima?', categories: ['Hayvon', 'Meva', 'Sabzavot'], correct: 'Meva' },
]

export default function SortingGame({ onComplete }: { onComplete: (score: number, correct: number, total: number) => void }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
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

    const isCorrect = option === questions[currentQ].correct
    if (isCorrect) {
      setScore(prev => prev + 10)
      setCorrectAnswers(prev => prev + 1)
    }

    setTimeout(async () => {
      if (currentQ + 1 >= questions.length) {
        const finalScore = score + (isCorrect ? 10 : 0)
        const finalCorrect = correctAnswers + (isCorrect ? 1 : 0)
        
        if (childId) {
          try {
            await api.post('/api/games/session', {
              child_id: childId,
              game_id: 'sorting',
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
      <div className="text-9xl mb-6">{currentQuestion.item}</div>
      <h2 className="text-2xl font-bold text-white mb-6">Bu qaysi guruhga kiradi?</h2>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {currentQuestion.categories.map((category) => {
          const isCorrect = category === currentQuestion.correct
          const isSelected = category === selectedAnswer
          
          let buttonClass = 'bg-white rounded-3xl p-6 text-lg font-bold shadow-md hover:scale-105 transition-transform border-4 border-transparent hover:border-blue-400'
          
          if (selectedAnswer) {
            if (isCorrect) {
              buttonClass = 'bg-green-50 border-green-500 rounded-3xl p-6 text-lg font-bold shadow-md'
            } else if (isSelected && !isCorrect) {
              buttonClass = 'bg-red-50 border-red-400 rounded-3xl p-6 text-lg font-bold shadow-md'
            }
          }

          return (
            <button
              key={category}
              onClick={() => handleAnswer(category)}
              disabled={!!selectedAnswer}
              className={buttonClass}
            >
              {category}
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