import api from './axios'

export const getMatches = async () => {
  const response = await api.get('/api/matches')
  return response.data
}

export const createMatch = async (data) => {
  const response = await api.post('/api/matches', data)
  return response.data
}

export const updateMatch = async (id, data) => {
  const response = await api.put(`/api/matches/${id}`, data)
  return response.data
}

export const deleteMatch = async (id) => {
  await api.delete(`/api/matches/${id}`)
}
