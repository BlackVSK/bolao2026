import api from './axios'

export const getStandings = () =>
  api.get('/api/world-cup/standings/').then((res) => res.data)

export const getMatches = (stage = null) =>
  api.get('/api/world-cup/matches/', { params: stage ? { stage } : {} }).then((res) => res.data)

export const getEnrichedMatches = (stage = null) =>
  api.get('/api/world-cup/matches-enriched/', { params: stage ? { stage } : {} }).then((res) => res.data)

export const getScorers = () =>
  api.get('/api/world-cup/scorers/').then((res) => res.data)

export const triggerSync = () =>
  api.post('/api/world-cup/sync/').then((res) => res.data)
