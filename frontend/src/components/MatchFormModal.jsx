import { useState, useRef, useEffect } from 'react'
import { COUNTRIES, flagUrl } from '../constants/countries'
import { createMatch, updateMatch } from '../api/matches'

function CountrySelect({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const selected = COUNTRIES.find((c) => c.code === value)
  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch('') }}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 focus:outline-none focus:border-accent"
      >
        {selected ? (
          <>
            <img src={flagUrl(selected.code)} alt={selected.name} className="w-6 h-4 object-cover rounded-sm" />
            <span className="text-white">{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <span className="ml-auto text-gray-500">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país..."
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">Nenhum resultado</li>
            )}
            {filtered.map((c) => (
              <li
                key={c.code}
                onClick={() => { onChange(c.code, c.name); setOpen(false) }}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-background transition-colors ${
                  c.code === value ? 'text-accent' : 'text-white'
                }`}
              >
                <img src={flagUrl(c.code)} alt={c.name} className="w-6 h-4 object-cover rounded-sm" />
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

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

  // onChange recebe (code, name) — salva code em flag e name em team
  const handleCountryChange = (side, code, name) => {
    setForm((prev) => ({
      ...prev,
      [`${side}_team`]: name,
      [`${side}_flag`]: code,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
            <div>
              <label className={labelClass}>Time da Casa</label>
              <CountrySelect
                value={form.home_flag}
                onChange={(code, name) => handleCountryChange('home', code, name)}
                placeholder="Selecione..."
              />
            </div>
            <div>
              <label className={labelClass}>Time Visitante</label>
              <CountrySelect
                value={form.away_flag}
                onChange={(code, name) => handleCountryChange('away', code, name)}
                placeholder="Selecione..."
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Gols Casa {form.home_team && `(${form.home_team})`}
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
                Gols Visitante {form.away_team && `(${form.away_team})`}
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
