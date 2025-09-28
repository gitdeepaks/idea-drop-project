import api from '@/lib/axios'

export const registerUser = async ({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) => {
  try {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
    })
    return res.data
  } catch (error: any) {
    const message = error.response.data.message || 'Failed to register user'
    throw new Error(message)
  }
}

export const loginUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  try {
    const res = await api.post('/auth/login', {
      email,
      password,
    })
    return res.data
  } catch (error: any) {
    const message = error.response.data.message || 'Failed to login user'
    throw new Error(message)
  }
}

export const logoutUser = async () => {
  try {
    const res = await api.post('/auth/logout')
    return res.data
  } catch (error: any) {
    const message = error.response.data.message || 'Failed to logout user'
    throw new Error(message)
  }
}

export const refreshAccessToken = async () => {
  try {
    const res = await api.post('/auth/refresh')
    return res.data
  } catch (error: any) {
    const message =
      error.response.data.message || 'Failed to refresh access token'
    throw new Error(message)
  }
}
