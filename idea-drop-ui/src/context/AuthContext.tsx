import { refreshAccessToken } from '@/api/auth'
import { createContext, useEffect, useState, useContext } from 'react'
import { setStoredAccessToken } from '@/lib/authToken'

type AuthContextType = {
  accessToken: string | null
  setAccessToken: (accessToken: string | null) => void
  user: { id: string; email: string; name: string } | null
  setUser: (user: AuthContextType['user']) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthContextType['user'] | null>(null)

  const loadAuth = async () => {
    try {
      const { accessToken: newToken, user } = await refreshAccessToken()
      setAccessToken(newToken)
      setUser(user)
      setStoredAccessToken(newToken)
    } catch (error) {
      console.error(error, 'Failed to load auth')
    }
  }

  useEffect(() => {
    loadAuth()
  }, [])

  useEffect(() => {
    setStoredAccessToken(accessToken)
  }, [accessToken])

  return (
    <AuthContext.Provider
      value={{ accessToken, setAccessToken, user, setUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
