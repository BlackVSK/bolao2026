import api from './axios'

export const getPredictions = async () => {
  const response = await api.get('/api/predictions')
  return response.data
}

export const createPrediction = async (data) => {
  const response = await api.post('/api/predictions', data)
  return response.data
}

export const updatePrediction = async (id, data) => {
  const response = await api.put(`/api/predictions/${id}`, data)
  return response.data
}

export const getRanking = async () => {
  const response = await api.get('/api/predictions/ranking')
  return response.data
}

export const getAdminPredictions = async (params = {}) => {
  const response = await api.get('/api/predictions/admin', { params })
  return response.data
}

export const upsertAdminPrediction = async (data) => {
  const response = await api.post('/api/predictions/admin/upsert', data)
  return response.data
}
