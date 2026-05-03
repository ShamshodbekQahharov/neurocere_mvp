import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { useEffect, useState } from 'react'
import api from '../../../services/api'

export default function GameMenuPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [childName, setChildName] = useState('Do\'stim')
  const [totalStars, setTotalStars] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)

  useEffect(() => {
    fetchChildData()
  }, [])

  useEffect(() => {
    document.title = 'NeuroCare — O\'yinlar'
  }, [])

  const fetchChildData = async () => {
    try {
      const childrenRes = await api.get('/api/children')
      const children = childrenRes.data?.data?.children || []
      if (children.length > 0) {
        setChildName(children[0].full_name.split(' ')[0])
        const childId = children[0].id
        // Fetch child's game sessions
        const sessionsRes = await api.get(`/api/games/sessions?child_id=${childId}`)
        const sessions = sessionsRes.data?.data?.sessions || []
        setGamesPlayed(sessions.length)
        setTotalStars(sessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0))
      }
    } catch (err) {
      console.error('Failed to fetch child data:', err)
    }
  }

  const motivationalMessages = [
    "Bugun ham ajoyib o'ynaysiz! 🌟",
    "Har kuni o'ynash miyani kuchaytiradi! 💪",
    "Siz eng yaxshi o'yinchisiz! 🏆",
    "Yangi yulduzlar siz kutmoqdasi! ⭐",
    "O'ynashdan oldin qo'l yuvvishni unutmang! ✋",
  ]

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

  const games = [
    {
      id: 'word-match',
      icon: '🔤',
      title: 'SO\'Z TOPISH',
      description: 'Rasmni nomlash',
      stars: 3,
    },
    {
      id: 'memory',
      icon: '🧠',
      title: 'XOTIRA O\'YINI',
      description: 'Juftlik topish',
      stars: 2,
    },
    {
      id: 'sorting',
      icon: '🎨',
      title: 'SARALASH',
      description: 'Rang va shakl',
      stars: 1,
    },
  ]

  return (
    <div className="flex flex-col items-center px-4 py-6">
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-yellow-300 flex items-center justify-center text-5xl mx-auto mb-4">
          👦
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Salom, {childName}! 👋
        </h1>
        <p className="text-white text-lg">
          Bugun qaysi o'yinni o'ynaysiz?
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-2xl">⭐</span>
          ))}
          <span className="ml-2 text-white font-bold">{totalStars}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => navigate(`/child/game/${game.id}`)}
            className="bg-white rounded-3xl p-6 shadow-lg text-center cursor-pointer hover:scale-105 transition-transform active:scale-95"
          >
            <div className="text-6xl mb-3">{game.icon}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{game.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{game.description}</p>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xl">
                  {i < game.stars ? '⭐' : '☆'}
                </span>
              ))}
            </div>
            <button className="bg-blue-500 text-white rounded-full px-8 py-3 font-bold text-lg hover:bg-blue-600 active:bg-blue-700">
              O'YNASH
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-white text-lg mb-2">{randomMessage}</p>
        <div className="text-white bg-white bg-opacity-20 rounded-full px-6 py-2">
          Bugun: {gamesPlayed} ta o'yin | {totalStars} ta yulduz
        </div>
      </div>
    </div>
  )
}