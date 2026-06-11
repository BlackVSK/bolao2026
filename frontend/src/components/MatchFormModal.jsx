import { useState } from 'react'
import { COUNTRIES } from '../constants/countries'
import { createMatch, updateMatch } from '../api/matches'

export default function MatchFormModal({ existingMatch, onClose, onSaved }) {
  const [form, setForm] = useState({
    home_team: existingMatch?.home_team || '',
    home_flag: existingMatch?.home_flag || '',
    away_team: existingMatch?.away_team || '',
    away_flag: existingMatch?.away_flag || '',
    match_datetime: existingMatch?.match_datetime
      ? existingMatch.match_datetime.slice(0, 16)
      : '',
    home_score: existingMatch?.home_score ?? '',
    away_score: existingMatch?.away_score ?? '',
    is_finished: existingMatch?.is_finished || false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCountryChange = (side, countryName) => {
    const country = COUNTRIES.find((c) => c.name === countryName)
    if (country) {
      setForm((prev) => ({
        ...prev,
        [`${side}_team`]: country.name,
        [`${side}_flag`]: country.flag,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Build payload - convert datetime to ISO with timezone offset
    const payload = {
      home_team: form.home_team,
      home_flag: form.home_flag,
      away_team: form.away_team,
      away_flag: form.away_flag,
      match_datetime: form.match_datetime ? new Date(form.match_datetime).toISOString() : '',
      home_score: form.home_score !== '' ? Number(form.home_score) : null,
      away_score: form.away_score !== '' ? Number(form.away_score) : null,
      is_finished: form.is_finished,
    }

    try {
      if (existingMatch) {
        await updateMatch(existingMatch.id, payload)
      } else {
        await createMatch(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs)
      } else {
        setError('Erro ao salvar partida.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent'
  const labelClass = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg my-4">
        <h2 className="text-lg font-bold text-white mb-4">
          {existingMatch ? 'Editar Partida' : 'Nova Partida'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Home team */}
            <div>
              <label className={labelClass}>Time da Casa</label>
              <select
                value={form.home_team}
                onChange={(e) => handleCountryChange('home', e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecione...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Away team */}
            <div>
              <label className={labelClass}>Time Visitante</label>
              <select
                value={form.away_team}
                onChange={(e) => handleCountryChange('away', e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecione...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date/time */}
          <div>
            <label className={labelClass}>Data e Hora</label>
            <input
              type="datetime-local"
              value={form.match_datetime}
              onChange={(e) => setForm((p) => ({ ...p, match_datetime: e.target.value }))}
              className={inputClass}
              required
            />
          </div>

          {/* Score fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Gols Casa {form.home_flag && `(${form.home_flag})`}
              </label>
              <input
                type="number"
                min="0"
                value={form.home_score}
                onChange={(e) => setForm((p) => ({ ...p, home_score: e.target.value }))}
                className={inputClass}
                placeholder="—"
              />
            </div>
            <div>
              <label className={labelClass}>
                Gols Visitante {form.away_flag && `(${form.away_flag})`}
              </label>
              <input
                type="number"
                min="0"
                value={form.away_score}
                onChange={(e) => setForm((p) => ({ ...p, away_score: e.target.value }))}
                className={inputClass}
                placeholder="—"
              />
            </div>
          </div>

          {/* is_finished */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_finished}
              onChange={(e) => setForm((p) => ({ ...p, is_finished: e.target.checked }))}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-gray-300">Partida finalizada</span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

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
