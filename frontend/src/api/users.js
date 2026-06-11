import api from './axios'

export const getUsers = async () => {
  const response = await api.get('/api/users')
  return response.data
}

export const createUser = async (data) => {
  const response = await api.post('/api/users', data)
  return response.data
}

export const updateUser = async (id, data) => {
  const response = await api.put(`/api/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id) => {
  await api.delete(`/api/users/${id}`)
}
