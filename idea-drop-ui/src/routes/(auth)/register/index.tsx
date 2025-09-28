import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { registerUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

export const Route = createFileRoute('/(auth)/register/')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { setAccessToken, setUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { mutateAsync, isPending } = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      setUser(data.user)
      navigate({ to: '/ideas' })
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await mutateAsync({ name, email, password })
    } catch (error: any) {
      setError(error.message)
    }
  }
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-600 mb-6">Register</h1>
      {error && <p className="bg-rose-100 text-rose-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          name="name"
          id="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <input
          type="email"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          name="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
        <input
          type="password"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          name="password"
          id="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
        />
        <button
          disabled={isPending}
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-gray-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:text-blue-700">
          Login
        </Link>
      </p>
    </div>
  )
}
