import { Link, useNavigate } from '@tanstack/react-router'
import { Lightbulb, User, LogOut, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { logoutUser } from '@/api/auth'

const Header = () => {
  const navigate = useNavigate()
  const { user, setUser, setAccessToken } = useAuth()

  const handleLogout = async () => {
    try {
      await logoutUser()
      setAccessToken(null)
      setUser(null)
      navigate({ to: '/' })
    } catch (error) {
      console.error(error, 'Failed to logout user')
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-gray-800">
          <Link to="/" className="flex items-center space-x-2 text-gray-800">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">IdeaDrop</h1>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          {user ? (
            // Authenticated user navigation
            <>
              <Link
                to="/ideas"
                className="text-gray-700 hover:text-gray-900 font-medium transition"
              >
                My Ideas
              </Link>
              <Link
                to="/ideas/new"
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition px-3 py-2 rounded-md"
              >
                <Plus className="w-4 h-4" />
                <span>New Idea</span>
              </Link>
              <div className="flex cursor-pointer items-center space-x-2 text-gray-700">
                <User className="w-4 h-4" />
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 font-medium transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            // Unauthenticated user navigation
            <>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition px-3 py-2 rounded-md leading-none"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition px-4 py-2 rounded-md leading-none"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
