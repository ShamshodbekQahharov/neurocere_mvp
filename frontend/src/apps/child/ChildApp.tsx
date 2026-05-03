import { Routes, Route } from 'react-router-dom'
import GameMenuPage from './pages/GameMenuPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'

export default function ChildApp() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500">
      <Routes>
        <Route index element={<GameMenuPage />} />
        <Route path="game/:gameId" element={<GamePage />} />
        <Route path="result" element={<ResultPage />} />
      </Routes>
    </div>
  )
}