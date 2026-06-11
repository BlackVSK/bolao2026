import api from './axios'

export const login = async (username, password) => {
  const response = await api.post('/api/auth/login', { username, password })
  return response.data
}

export const refreshToken = async (refresh) => {
  const response = await api.post('/api/auth/refresh', { refresh })
  return response.data
}
