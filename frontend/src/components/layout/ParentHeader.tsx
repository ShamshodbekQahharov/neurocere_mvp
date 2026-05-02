import { useLocation } from 'react-router-dom'

export default function ParentHeader() {
  const location = useLocation()

  const pageTitleMap: Record<string, string> = {
    '/parent': 'Dashboard',
    '/parent/report': 'Hisobot',
    '/parent/progress': 'Progress',
    '/parent/chat': 'Chat',
    '/parent/learn': "O'rganish",
  }

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitleMap)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return title
      }
    }
    return 'Dashboard'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Ota-ona paneli</span>
        </div>
      </div>
    </header>
  )
}
