import React from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

function ChildApp() {
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">O'yinlar</h1>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Chiqish
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">O'yin menu</h2>
          <p className="text-gray-600">Hali qayta ishlanayotgan sahifa. Yaqinda yangi o'yinlar qo'shiladi.</p>
          <div className="mt-4 flex gap-4">
            <Button variant="primary" size="lg">O'yni boshlash</Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default ChildApp
