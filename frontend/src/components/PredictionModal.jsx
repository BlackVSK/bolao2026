import { useState } from 'react'
import { createPrediction, updatePrediction } from '../api/predictions'

export default function PredictionModal({ match, existingPrediction, onClose, onSaved }) {
  const [homeScore, setHomeScore] = useState(
    existingPrediction ? existingPrediction.home_score : ''
  )
  const [awayScore, setAwayScore] = useState(
    existingPrediction ? existingPrediction.away_score : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (homeScore === '' || awayScore === '') {
      setError('Preencha os dois placares.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (existingPrediction) {
        await updatePrediction(existingPrediction.id, {
          home_score: Number(homeScore),
          away_score: Number(awayScore),
          match: match.id,
        })
      } else {
        await createPrediction({
          match: match.id,
          home_score: Number(homeScore),
          away_score: Number(awayScore),
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Erro ao salvar palpite.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-white mb-1">
          {existingPrediction ? 'Editar Palpite' : 'Fazer Palpite'}
        </h2>
        <p className="text-gray-400 text-sm mb-5">
          {match.home_flag} {match.home_team} vs {match.away_team} {match.away_flag}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Home score */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1 text-center">
                {match.home_flag} {match.home_team}
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full text-center text-2xl font-bold bg-background border border-border rounded-xl py-3 text-white focus:outline-none focus:border-accent"
                placeholder="0"
              />
            </div>

            <span className="text-gray-500 font-bold text-xl mt-4">×</span>

            {/* Away score */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1 text-center">
                {match.away_flag} {match.away_team}
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full text-center text-2xl font-bold bg-background border border-border rounded-xl py-3 text-white focus:outline-none focus:border-accent"
                placeholder="0"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-border text-gray-400 hover:bg-card-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-accent text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
